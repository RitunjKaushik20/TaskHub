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
  primary: 'bg-gradient-to-r from-moss-deep to-moss-primary text-white shadow-md hover:opacity-95',
  secondary: 'bg-moss-primary hover:bg-moss-deep text-white shadow-sm',
  outline: 'bg-paper-bg border border-moss-sage text-ink-text hover:bg-paper-bg',
  ghost: 'bg-transparent text-ink-muted hover:bg-paper-bg hover:text-ink-text',
  danger: 'bg-moss-deep hover:bg-moss-deep text-white shadow-sm',
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