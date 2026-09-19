import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, ShieldCheck, Loader2, RotateCcw, AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';

const VerifyEmail: React.FC = () => {
  const { verifyEmail } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const [email, setEmail] = useState<string>(params.get('email') || localStorage.getItem('pending_verification_email') || '');
  const [code, setCode] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    if (email) localStorage.setItem('pending_verification_email', email);
  }, [email]);

  const sendCode = async (notify = true) => {
    if (!email || !email.includes('@')) {
      toast.error('Email required', 'Enter the email address you signed up with.');
      return;
    }
    setIsSending(true);
    try {
      const res = await authApi.sendOtp(email);
      setDevMode(res.data?.mode === 'dev');
      if (res.success) {
        if (notify) {
          toast.success('Verification code sent', `A 6-digit code was emailed to ${email}.`);
        }
      } else {
        toast.error('Could not send code', res.message || 'Please try again shortly.');
      }
    } catch {
      toast.error('Could not send code', 'Please try again shortly.');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (email) {
      sendCode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error('Invalid code', 'Enter the 6-digit code from your email.');
      return;
    }
    setIsVerifying(true);
    try {
      const result = await verifyEmail(email, code);
      if (result.ok) {
        localStorage.removeItem('pending_verification_email');
        toast.success('Email verified!', 'Your account is now active.');
        const role = (window as any).__pendingRole || 'WORKER';
        navigate(role === 'BUSINESS' ? '/business' : '/worker', { replace: true });
      } else {
        toast.error('Verification failed', result.message || 'Please check your code and try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-brand-accent p-0.5 mx-auto shadow-lg shadow-brand-500/10">
            <div className="w-full h-full bg-slate-100 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-brand-600" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verify Your Email</h2>
          <p className="text-xs text-slate-600">
            We sent a 6-digit code to your inbox. Enter it below to activate your account.
          </p>
        </div>

        <div className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full !pl-11 py-3 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">6-Digit Verification Code</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerify();
                }}
                placeholder="000000"
                className="w-full !pl-11 text-center tracking-[0.5em] py-3 text-base font-bold rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          {devMode && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Email transport is off (dev mode). Your code is printed to the <b>backend server console</b>.
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-accent text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-60"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Verify & Activate Account
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => sendCode(true)}
            disabled={isSending}
            className="w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-60"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Resend verification code
          </button>

          <div className="flex justify-center gap-4 text-[11px] pt-1">
            <Link to="/register" className="text-brand-accent hover:underline font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Wrong email?
            </Link>
            <Link to="/login" className="text-slate-500 hover:text-slate-700 font-medium">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;