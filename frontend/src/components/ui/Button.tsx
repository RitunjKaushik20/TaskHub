import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md hover:opacity-95',
  secondary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  outline: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[11px] rounded-lg',
  md: 'px-5 py-2.5 text-xs rounded-xl',
  lg: 'px-6 py-3 text-sm rounded-xl',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed',
      VARIANTS[variant],
      SIZES[size],
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export default Button;