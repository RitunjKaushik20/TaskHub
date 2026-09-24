import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'indigo' | 'emerald' | 'cyan' | 'amber' | 'purple';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
  className,
}) => {
  const colorMap = {
    indigo: 'bg-paper-bg border-hairline text-moss-deep hover:border-moss-sage',
    emerald: 'bg-paper-bg border-hairline text-moss-deep hover:border-moss-sage',
    cyan: 'bg-paper-bg border-hairline text-moss-deep hover:border-moss-sage',
    amber: 'bg-paper-bg border-hairline text-moss-deep hover:border-moss-sage',
    purple: 'bg-paper-bg border-hairline text-moss-deep hover:border-moss-sage',
  };

  const isEmerald = color === 'emerald';

  return (
    <div className={cn(`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden ${colorMap[color]}`, className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-text">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-paper-bg border border-hairline shadow-sm">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className={`text-2xl font-extrabold tracking-tight ${isEmerald ? 'text-moss-deep' : 'text-ink-text'}`}>{value}</h3>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-moss-sage text-moss-deep border border-moss-sage'
                : 'bg-moss-sage/30 text-moss-deep border border-moss-sage'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-ink-muted font-medium">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
