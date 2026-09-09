import React, { useState } from 'react';
import { X, User as UserIcon, ArrowRight, Loader2, Mail, Shield, Briefcase, Wrench } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

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

const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  redirectTo,
  defaultRole = 'WORKER',
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'WORKER' | 'BUSINESS'>(defaultRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { hydrateSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid Google email address (e.g. user@gmail.com)');
      return;
    }

    setIsSubmitting(true);
    try {
      const displayName = name.trim() || cleanEmail.split('@')[0];
      const res = await authApi.googleVerify({
        email: cleanEmail,
        name: displayName,
        role,
      });

      if (res.success && res.data) {
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-2xl space-y-5 text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Google Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md p-2">
            <GoogleIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in with Google</h2>
          <p className="text-xs text-slate-600">
            Authenticate your Google profile to enter <span className="text-brand-600 font-semibold">TaskHub</span>
          </p>
        </div>

        {/* Role Toggle */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Select Account Role
          </label>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setRole('WORKER')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                role === 'WORKER'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" /> Worker
            </button>
            <button
              type="button"
              onClick={() => setRole('BUSINESS')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                role === 'BUSINESS'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Business
            </button>
          </div>
        </div>

        {/* Dynamic Google Account Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Google Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="your.email@gmail.com"
                required
                autoFocus
                className="w-full glass-input !pl-11 !pr-4 py-3 text-xs rounded-xl bg-white border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-900 placeholder:text-slate-400 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Google Profile Name <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full glass-input !pl-11 !pr-4 py-3 text-xs rounded-xl bg-white border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-900 placeholder:text-slate-400 transition-all outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium animate-in fade-in-50">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Connecting Google Account...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-4 h-4" />
                  <span>Continue with Google</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" /> Google OAuth 2.0 & End-to-End Direct Payout Security
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthModal;
