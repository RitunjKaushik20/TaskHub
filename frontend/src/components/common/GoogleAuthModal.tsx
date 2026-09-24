import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Mail, Shield, Briefcase, Wrench, AlertTriangle } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

// Google Identity Services (GIS) — real "Sign in with Google" flow.
//
// The button is rendered by Google's own script and yields an ID token
// (credential) bound to the logged-in Google session. That token is sent to
// TaskHub where it is verified server-side (signature, issuer, audience,
// expiry via Google's tokeninfo endpoint). The client NEVER submits an email
// or name of its own choosing to authenticate — those fields are rejected by
// the hardened /auth/google/verify endpoint.

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  defaultRole?: 'WORKER' | 'BUSINESS';
}

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const loadGisScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) return resolve();

    const waitForGoogle = () => {
      const deadline = Date.now() + 8000;
      const poll = () => {
        if ((window as any).google?.accounts?.id) return resolve();
        if (Date.now() > deadline) return reject(new Error('Google Identity Services did not initialize.'));
        setTimeout(poll, 100);
      };
      poll();
    };

    const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', waitForGoogle);
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
      waitForGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = waitForGoogle;
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });

const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  redirectTo,
  defaultRole = 'WORKER',
}) => {
  const [role, setRole] = useState<'WORKER' | 'BUSINESS'>(defaultRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [gisError, setGisError] = useState('');
  const { hydrateSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef(role);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const handleCredential = useCallback(async (response: { credential?: string }) => {
    const credential = response?.credential;
    if (!credential) {
      setError('No Google credential received. Please try again.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const selectedRole = roleRef.current;
      const res = await authApi.googleVerify({ credential, role: selectedRole });

      if (res.success && res.data) {
        if (res.data.pendingEmailVerification) {
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          (window as any).__pendingRole = selectedRole;
          toast.info(
            'Verify Your Email',
            `We sent a 6-digit verification code to ${res.data.email}. Enter it to finish setting up your account.`
          );
          onClose();
          navigate(`/verify-email?email=${encodeURIComponent(res.data.email)}&role=${selectedRole}`, { replace: true });
          return;
        }

        if ((res.data as any).token) {
          localStorage.setItem('token', (res.data as any).token);
          localStorage.setItem('access_token', (res.data as any).token);
        }
        toast.success(
          'Google Account Connected',
          `Signed in as ${res.data.name} (${res.data.email})`
        );
        await hydrateSession();
        onClose();

        const dest = redirectTo || (res.data.role === 'BUSINESS' ? '/business' : '/worker');
        navigate(dest, { replace: true });
      } else {
        setError(res.message || 'Failed to authenticate Google account');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Network error communicating with Google OAuth service');
    } finally {
      setIsSubmitting(false);
    }
  }, [hydrateSession, navigate, onClose, redirectTo, toast]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setGisError('');
    setError('');

    const bootstrap = async () => {
      try {
        const config = await authApi.googleConfig();
        const clientId = (config as any)?.data?.clientId;
        if (cancelled) return;
        if (!clientId || typeof clientId !== 'string') {
          setGisError('Google sign-in is not configured on this server yet. Please use email & password.');
          return;
        }

        await loadGisScript();
        if (cancelled) return;

        const google = (window as any).google;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          ux_mode: 'popup',
        });

        if (buttonRef.current) {
          buttonRef.current.innerHTML = '';
          google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: Math.min(buttonRef.current.clientWidth || 320, 340),
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          setGisError(err?.message || 'Google sign-in is temporarily unavailable. Please use email & password.');
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [isOpen, handleCredential]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-moss-deep/60 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-paper-bg border border-hairline rounded-3xl shadow-2xl space-y-5 text-ink-text">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-ink-muted hover:text-ink-text rounded-full bg-paper-bg hover:bg-moss-light/40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Google Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-paper-bg border border-hairline flex items-center justify-center shadow-md p-2">
            <GoogleIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-ink-text tracking-tight">Sign in with Google</h2>
          <p className="text-xs text-ink-muted">
            Authenticate your Google profile to enter <span className="text-moss-deep font-semibold">TaskHub</span>
          </p>
        </div>

        {/* Role Toggle */}
        <div>
          <label className="block text-[11px] font-bold text-ink-text uppercase tracking-wider mb-1.5">
            Select Account Role
          </label>
          <div className="flex bg-paper-bg p-1 rounded-xl border border-hairline">
            <button
              type="button"
              onClick={() => setRole('WORKER')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                role === 'WORKER'
                  ? 'bg-moss-deep text-white shadow-md'
                  : 'text-ink-muted hover:text-ink-text'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" /> Worker
            </button>
            <button
              type="button"
              onClick={() => setRole('BUSINESS')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                role === 'BUSINESS'
                  ? 'bg-moss-deep text-white shadow-md'
                  : 'text-ink-muted hover:text-ink-text'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Business
            </button>
          </div>
        </div>

        {/* Real Google Identity Services button */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-center min-h-[44px]">
            {isSubmitting ? (
              <span className="flex items-center gap-2 text-xs text-ink-muted">
                <Loader2 className="w-4 h-4 animate-spin text-moss-deep" />
                Verifying Google account…
              </span>
            ) : (
              <div ref={buttonRef} className="w-full flex justify-center" />
            )}
          </div>

          {error && (
            <p className="text-xs text-moss-deep bg-moss-sage/30 border border-moss-sage p-2.5 rounded-xl font-medium animate-in fade-in-50">
              {error}
            </p>
          )}

          {gisError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{gisError}</span>
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-paper-bg hover:bg-moss-light/40 text-ink-text text-xs font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-hairline space-y-1.5 text-center">
          <p className="text-[10px] text-ink-muted flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-moss-deep" /> Google OAuth 2.0 & End-to-End Direct Payout Security
          </p>
          <p className="text-[10px] text-ink-muted flex items-center justify-center gap-1">
            <Mail className="w-3 h-3" /> Only verified Google accounts with non-temporary email addresses can sign in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthModal;
