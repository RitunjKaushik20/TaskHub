import React, { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserPlus, User, Briefcase, Mail, Lock, Building, ArrowRight, Eye, EyeOff, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
    role: z.enum(['WORKER', 'BUSINESS']),
    companyName: z.string().optional(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms of Service',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// Password strength calculation helper
const calculatePasswordStrength = (password: string) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const feedback: string[] = [];

  if (!requirements.length) feedback.push('At least 8 characters');
  if (!requirements.uppercase) feedback.push('One uppercase letter');
  if (!requirements.lowercase) feedback.push('One lowercase letter');
  if (!requirements.number) feedback.push('One number');
  if (!requirements.special) feedback.push('One special character');

  return { score, feedback };
};

const PasswordStrengthIndicator: React.FC<{ password?: string }> = ({ password }) => {
  if (!password) return null;
  const strength = calculatePasswordStrength(password);

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'text-rose-500 bg-rose-500';
    if (score <= 2) return 'text-orange-500 bg-orange-500';
    if (score <= 3) return 'text-yellow-500 bg-yellow-500';
    if (score <= 4) return 'text-blue-500 bg-blue-500';
    return 'text-emerald-500 bg-emerald-500';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="mt-2 space-y-1.5 animate-in fade-in-50 duration-200">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full ${getStrengthColor(strength.score)} transition-all duration-300 rounded-full`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-slate-400 min-w-[55px] text-right">
          {getStrengthText(strength.score)}
        </span>
      </div>
      {strength.feedback.length > 0 && (
        <div className="grid grid-cols-2 gap-1 pt-1">
          {strength.feedback.map((item, index) => (
            <div key={index} className="flex items-center gap-1 text-[10px] text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import GoogleAuthModal from '../../components/common/GoogleAuthModal';

const Register: React.FC = () => {
  const { register: registerAuth, hydrateSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const hasProcessedOAuth = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'WORKER',
      agreeToTerms: true,
    },
  });

  const selectedRole = useWatch({ control, name: 'role' });
  const watchPassword = useWatch({ control, name: 'password' });

  const onSubmit = async (data: RegisterFormValues) => {
    const success = await registerAuth({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      companyName: data.role === 'BUSINESS' ? data.companyName : undefined,
    });

    if (success) {
      toast.success('Registration successful!', `Welcome to TaskHub as a ${data.role}.`);
      if (data.role === 'BUSINESS') {
        navigate('/business');
      } else {
        navigate('/worker');
      }
    } else {
      toast.error('Registration failed', 'Unable to create account. Please try again.');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('prompt_google') === 'true') {
      setIsGoogleModalOpen(true);
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

      toast.success('Google OAuth Successful', 'Welcome to TaskHub! Signed in via Google.');
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

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full p-8 rounded-3xl glass-panel border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        
        {/* Top Glow Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-brand-accent p-0.5 mx-auto shadow-xl shadow-brand-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-brand-500" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create TaskHub Account</h2>
          <p className="text-xs text-slate-400">Join the decentralized human micro-work ecosystem</p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 relative z-10">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
          >
            Login
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded-lg text-xs font-bold bg-brand-600 text-white shadow-md transition-all"
          >
            Sign Up
          </button>
        </div>

        {/* Account Role Selection */}
        <div className="space-y-1.5 relative z-10">
          <label className="block text-xs font-semibold text-slate-300">Select Account Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('role', 'WORKER')}
              className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                selectedRole === 'WORKER'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl ${selectedRole === 'WORKER' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900'}`}>
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block text-white">Worker</span>
                <span className="text-[10px] text-slate-400">Earn from tasks</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setValue('role', 'BUSINESS')}
              className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                selectedRole === 'BUSINESS'
                  ? 'bg-brand-500/10 border-brand-500 text-brand-300 shadow-md ring-1 ring-brand-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl ${selectedRole === 'BUSINESS' ? 'bg-brand-500 text-white font-bold' : 'bg-slate-900'}`}>
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block text-white">Business</span>
                <span className="text-[10px] text-slate-400">Post & verify tasks</span>
              </div>
            </button>
          </div>
        </div>

        {/* Google OAuth Signup */}
        <button
          type="button"
          onClick={handleGoogleConnect}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition-all hover:bg-slate-900 relative z-10 shadow-sm"
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
          Register with Google OAuth
        </button>

        <div className="relative flex items-center justify-center relative z-10">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 absolute">
            Or fill registration details
          </span>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none" />
              <input
                type="text"
                {...register('name')}
                placeholder="Enter your full name"
                className={cn(
                  "w-full glass-input !pl-11 !pr-4 py-3 text-xs rounded-xl transition-all text-white placeholder:text-slate-500 bg-slate-950/80",
                  errors.name ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-800"
                )}
              />
            </div>
            {errors.name && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none" />
              <input
                type="email"
                {...register('email')}
                placeholder="name@example.com"
                className={cn(
                  "w-full glass-input !pl-11 !pr-4 py-3 text-xs rounded-xl transition-all text-white placeholder:text-slate-500 bg-slate-950/80",
                  errors.email ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-800"
                )}
              />
            </div>
            {errors.email && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.email.message}
              </p>
            )}
          </div>

          {/* Conditional Company Name Field for BUSINESS role */}
          {selectedRole === 'BUSINESS' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company Name <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none" />
                <input
                  type="text"
                  {...register('companyName')}
                  placeholder="CyberNet AI Labs Inc."
                  className="w-full glass-input !pl-11 !pr-4 py-3 text-xs rounded-xl border-slate-800 text-white placeholder:text-slate-500 bg-slate-950/80"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                {...register('password')}
                placeholder="••••••••"
                className={cn(
                  "w-full glass-input !pl-11 !pr-12 py-3 text-xs rounded-xl transition-all text-white placeholder:text-slate-500 bg-slate-950/80",
                  errors.password ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-800"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-10"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={watchPassword} />
            {errors.password && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register('confirmPassword')}
                placeholder="••••••••"
                className={cn(
                  "w-full glass-input !pl-11 !pr-12 py-3 text-xs rounded-xl transition-all text-white placeholder:text-slate-500 bg-slate-950/80",
                  errors.confirmPassword ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-800"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-10"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('agreeToTerms')}
                className="w-4 h-4 mt-0.5 rounded border-slate-800 bg-slate-950 text-brand-500 focus:ring-brand-500 focus:ring-offset-0"
              />
              <span className="text-xs text-slate-400 leading-tight">
                I agree to TaskHub's{' '}
                <a href="#" className="text-brand-accent hover:underline">
                  Terms of Service
                </a>{' '}
                &{' '}
                <a href="#" className="text-brand-accent hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.agreeToTerms.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-accent hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
              </>
            ) : (
              <>
                Register as {selectedRole} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 relative z-10">
          Already registered?{' '}
          <Link to="/login" className="text-brand-accent font-semibold hover:underline">
            Sign in here
          </Link>
        </p>

        <GoogleAuthModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          defaultRole={selectedRole}
          redirectTo={selectedRole === 'BUSINESS' ? '/business' : '/worker'}
        />
      </div>
    </div>
  );
};

export default Register;