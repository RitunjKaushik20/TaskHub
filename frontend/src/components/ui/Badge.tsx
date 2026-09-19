import React from 'react';
import { cn } from '../../lib/utils';

type BadgeColor = 'emerald' | 'indigo' | 'cyan' | 'amber' | 'rose' | 'slate';

const COLORS: Record<BadgeColor, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  cyan: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border border-rose-200',
  slate: 'bg-slate-100 text-slate-700 border border-slate-200',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ color = 'emerald', dot, className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
      COLORS[color],
      className
    )}
    {...props}
  >
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

export default Badge;