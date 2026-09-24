import React from 'react';
import { cn } from '../../lib/utils';

interface FieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
}

const Field: React.FC<FieldProps & { children: React.ReactNode }> = ({
  label,
  required,
  hint,
  error,
  className,
  children,
}) => (
  <div className={cn('space-y-1.5', className)}>
    {label && (
      <label className="block text-xs font-bold text-ink-text">
        {label}
        {required && <span className="text-moss-deep"> *</span>}
        {hint && <span className="text-ink-muted text-[10px] font-normal"> ({hint})</span>}
      </label>
    )}
    {children}
    {error && <p className="text-[10px] text-moss-deep font-medium">{error}</p>}
  </div>
);

const InputControl = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('w-full glass-input !px-4 text-xs font-semibold', className)} {...props} />
  )
);
InputControl.displayName = 'InputControl';

const TextareaControl = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('w-full glass-input text-xs', className)} {...props} />
  )
);
TextareaControl.displayName = 'TextareaControl';

const SelectControl = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn('w-full glass-input !px-4 text-xs font-semibold', className)} {...props}>
      {children}
    </select>
  )
);
SelectControl.displayName = 'SelectControl';

export { Field, InputControl, TextareaControl, SelectControl };