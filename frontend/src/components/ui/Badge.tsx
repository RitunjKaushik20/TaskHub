import React from 'react';
import { cn } from '../../lib/utils';

type BadgeColor = 'emerald' | 'indigo' | 'cyan' | 'amber' | 'rose' | 'slate';

const COLORS: Record<BadgeColor, string> = {
  emerald: 'bg-moss-sage text-moss-deep border border-moss-sage',
  indigo: 'bg-moss-sage text-moss-deep border border-moss-sage',
  cyan: 'bg-moss-sage/30 text-moss-deep border border-moss-sage',
  amber: 'bg-moss-sage/30 text-moss-deep border border-moss-sage',
  rose: 'bg-moss-sage/30 text-moss-deep border border-moss-sage',
  slate: 'bg-paper-bg text-ink-text border border-hairline',
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