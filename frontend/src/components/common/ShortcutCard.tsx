import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface ShortcutCardProps {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'indigo' | 'dark';
}

const variantStyles = {
  emerald: {
    card: 'bg-paper-bg border-hairline hover:border-moss-primary/60 text-ink-text',
    iconWrap: 'bg-moss-sage border-moss-sage text-moss-deep',
    arrow: 'text-moss-deep',
  },
  indigo: {
    card: 'bg-paper-bg border-hairline hover:border-moss-primary/60 text-ink-text',
    iconWrap: 'bg-moss-sage border-moss-sage text-moss-deep',
    arrow: 'text-moss-deep',
  },
  dark: {
    card: 'bg-moss-deep border-moss-deep hover:border-moss-primary text-white',
    iconWrap: 'bg-paper-bg/10 border-paper-bg/20 text-paper-bg',
    arrow: 'text-paper-bg',
  },
};

const ShortcutCard: React.FC<ShortcutCardProps> = ({
  to,
  title,
  description,
  icon: Icon,
  variant = 'emerald',
}) => {
  const s = variantStyles[variant];

  return (
    <Link
      to={to}
      className={`group flex flex-col h-full gap-3 p-5 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md ${s.card}`}
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform ${s.iconWrap}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold">{title}</p>
        <p className={`text-[11px] leading-snug font-medium ${variant === 'dark' ? 'text-paper-bg/80' : 'text-ink-muted'}`}>
          {description}
        </p>
      </div>
      <span className={`mt-auto inline-flex items-center gap-1 text-[11px] font-bold ${s.arrow}`}>
        Open <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
};

export default ShortcutCard;