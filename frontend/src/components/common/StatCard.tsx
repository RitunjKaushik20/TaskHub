import React from 'react';
import type { LucideIcon } from 'lucide-react';

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
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
}) => {
  const colorMap = {
    indigo: 'bg-white border-slate-200 text-indigo-600 hover:border-indigo-300',
    emerald: 'bg-white border-slate-200 text-emerald-600 hover:border-emerald-300',
    cyan: 'bg-white border-slate-200 text-cyan-600 hover:border-cyan-300',
    amber: 'bg-white border-slate-200 text-amber-600 hover:border-amber-300',
    purple: 'bg-white border-slate-200 text-purple-600 hover:border-purple-300',
  };

  const isEmerald = color === 'emerald';

  return (
    <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className={`text-2xl font-extrabold tracking-tight ${isEmerald ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</h3>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-600 font-medium">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
