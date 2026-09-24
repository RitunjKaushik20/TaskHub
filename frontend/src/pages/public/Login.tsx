import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LogIn, Layers, Mail, Lock, Eye, EyeOff, Loader2, KeyRound, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

import GoogleAuthModal from '../../components/common/GoogleAuthModal';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login, hydrateSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/worker';
  const hasProcessedOAuth = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    const result = await login(data);
    if (result.ok) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      }
      toast.success('Welcome back!', 'Successfully signed into TaskHub.');
      navigate(from, { replace: true });
    } else if (result.needsOtp) {
      // Part B: the account registered but never verified its email.
      toast.error('Email not verified', 'Enter the code we emailed you to activate your account.');
      navigate(`/verify-email?email=${encodeURIComponent(result.email || data.email)}`, { replace: false });
    } else {
      toast.error('Authentication failed', result.message || 'Please check your credentials and try again.');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('prompt_google') === 'true') {
      setIsGoogleModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (searchParams.get('google_error') === 'verification') {
      toast.error('Google verification failed', 'We could not verify your Google account. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (searchParams.get('google_error') === 'disposable') {
      toast.error('Email not allowed', 'Temporary email addresses cannot be used. Please use your real Google account.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (searchParams.get('oauth') === 'google_success' && !hasProcessedOAuth.current) {
      hasProcessedOAuth.current = true;
      const token = searchParams.get('token');
      const roleParam = searchParams.get('role');
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('access_token', token);
      }
      // Remove query parameters from address bar to prevent duplicate loops
      window.history.replaceState({}, document.title, window.location.pathname);

      toast.success('Google OAuth Successful', 'Welcome back! Signed in via Google.');
      hydrateSession().then((hydratedUser) => {
        const userRole = hydratedUser?.role || roleParam || 'WORKER';
        navigate(userRole === 'BUSINESS' ? '/business' : '/worker', { replace: true });
      }).catch(() => {
        const userRole = roleParam || 'WORKER';
        navigate(userRole === 'BUSINESS' ? '/business' : '/worker', { replace: true });
      });
    }
  }, [location.search, navigate, toast, hydrateSession]);

  const handleGoogleConnect = () => {
    setIsGoogleModalOpen(true);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      toast.error('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setResetSent(true);
    toast.success('Password Recovery Sent', `Instructions sent to ${resetEmail}.`);
    setTimeout(() => {
      setIsResetMode(false);
      setResetSent(false);
    }, 2500);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full p-8 rounded-3xl bg-paper-bg border border-hairline space-y-6 shadow-xl relative overflow-hidden">
        
        {/* Top Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-moss-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-moss-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-moss-deep via-moss-primary to-moss-primary p-0.5 mx-auto shadow-lg shadow-moss-primary/15">
            <div className="w-full h-full bg-paper-bg rounded-[14px] flex items-center justify-center">
              <Layers className="w-7 h-7 text-moss-deep" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-ink-text tracking-tight">
            {isResetMode ? 'Recover Password' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-ink-muted">
            {isResetMode
              ? 'Enter your email to receive recovery instructions'
              : 'Sign in to access your micro-work dashboard & wallet'}
          </p>
        </div>

        {/* Password Reset Mode */}
        {isResetMode ? (
          <form onSubmit={handleResetSubmit} className="space-y-4 relative z-10 animate-in fade-in-50 duration-300">
            {resetSent ? (
              <div className="p-4 rounded-2xl bg-moss-primary/10 border border-moss-primary/30 text-center space-y-2">
                <p className="text-xs font-semibold text-moss-deep">Reset email dispatched!</p>
                <p className="text-[11px] text-ink-muted">Redirecting to sign-in screen...</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-ink-text mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted z-10 pointer-events-none" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full glass-input !pl-11 !pr-4 py-3 text-xs rounded-xl text-ink-text placeholder:text-ink-muted/70 bg-paper-bg border-moss-sage"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-moss-deep to-moss-primary text-white font-bold text-xs shadow-lg shadow-moss-primary/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                >
                  <KeyRound className="w-4 h-4" /> Send Recovery Link
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetMode(false)}
                    className="text-xs text-moss-deep hover:underline font-semibold"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          <>
            {/* Mode Switcher Tabs */}
            <div className="flex bg-paper-bg rounded-xl p-1 border border-hairline relative z-10">
              <button
                type="button"
                className="flex-1 py-2 rounded-lg text-xs font-bold bg-moss-deep text-white shadow-md transition-all"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink-text transition-all"
              >
                Create Account
              </button>
            </div>

            {/* Google OAuth Login Button */}
            <button
              type="button"
              onClick={handleGoogleConnect}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-paper-bg border border-moss-sage hover:border-moss-sage text-ink-text text-xs font-semibold transition-all hover:bg-paper-bg relative z-10 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.26 21.3 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.42l4-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              Continue with Google OAuth
            </button>

            <div className="relative flex items-center justify-center relative z-10">
              <div className="border-t border-hairline w-full" />
              <span className="bg-paper-bg px-3 text-[10px] uppercase font-bold text-ink-muted absolute">
                Or sign in with email
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold text-ink-text mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted z-10 pointer-events-none" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="name@example.com"
                    className={cn(
                      "w-full glass-input !pl-11 !pr-4 py-3 text-xs rounded-xl transition-all text-ink-text placeholder:text-ink-muted/70 bg-paper-bg border-moss-sage",
                      errors.email ? "border-moss-deep focus:ring-moss-deep/20" : "border-moss-sage"
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-moss-deep mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3 h-3" /> {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-text mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted z-10 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                    placeholder="••••••••"
                    className={cn(
                      "w-full glass-input !pl-11 !pr-12 py-3 text-xs rounded-xl transition-all text-ink-text placeholder:text-ink-muted/70 bg-paper-bg border-moss-sage",
                      errors.password ? "border-moss-deep focus:ring-moss-deep/20" : "border-moss-sage"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-text transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] text-moss-deep mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3 h-3" /> {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-moss-sage bg-paper-bg text-moss-primary focus:ring-moss-primary focus:ring-offset-0"
                  />
                  <span className="text-ink-text font-medium">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-moss-deep hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-moss-deep via-moss-primary to-moss-primary hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-moss-primary/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Sign In <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-ink-muted relative z-10">
              Don't have an account?{' '}
              <Link to="/register" className="text-moss-deep font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </>
        )}

        <GoogleAuthModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          redirectTo={from}
        />
      </div>
    </div>
  );
};

export default Login;