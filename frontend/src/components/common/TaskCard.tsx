import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Heart,
  CheckCircle2,
  Users,
  Bot,
  Code,
  Sparkles,
  Search,
  FileText,
  Lock,
  ArrowRight,
} from 'lucide-react';
import type { Task } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface TaskCardProps {
  task: Task;
  onAccept?: (taskId: string, title: string) => Promise<void> | void;
  isAccepting?: boolean;
  showAcceptButton?: boolean;
}

// Light theme category gradient configs for Fiverr gig thumbnails
const CATEGORY_THEMES: Record<
  string,
  { bg: string; icon: React.ComponentType<{ className?: string }>; badge: string; accent: string }
> = {
  'AI & Data Annotation': {
    bg: 'from-moss-sage/80 via-moss-sage/40 to-paper-bg',
    icon: Bot,
    badge: 'AI VERIFIED',
    accent: 'text-moss-deep border-moss-sage bg-moss-sage/90',
  },
  'UX Research': {
    bg: 'from-moss-sage/80 via-moss-sage/40 to-paper-bg',
    icon: Search,
    badge: 'TOP RESEARCH',
    accent: 'text-moss-deep border-moss-sage bg-moss-sage/90',
  },
  'Translation & Localization': {
    bg: 'from-moss-sage/80 via-moss-sage/40 to-paper-bg',
    icon: Sparkles,
    badge: 'HUMAN REVIEW',
    accent: 'text-moss-deep border-moss-sage bg-moss-sage/90',
  },
  'Software Engineering': {
    bg: 'from-moss-sage/80 via-moss-sage/40 to-paper-bg',
    icon: Code,
    badge: 'CODE AUDIT',
    accent: 'text-moss-deep border-moss-sage bg-moss-sage/90',
  },
  'Lead Generation': {
    bg: 'from-moss-sage/80 via-moss-sage/40 to-paper-bg',
    icon: FileText,
    badge: 'VERIFIED LEADS',
    accent: 'text-moss-deep border-moss-sage bg-moss-sage/90',
  },
};

const DEFAULT_THEME = {
  bg: 'from-paper-bg via-paper-bg to-paper-bg',
  icon: Bot,
  badge: 'MICRO-GIG',
  accent: 'text-moss-deep border-moss-sage bg-moss-sage/90',
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onAccept,
  isAccepting = false,
  showAcceptButton = false,
}) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  const theme = CATEGORY_THEMES[task.category] || DEFAULT_THEME;
  const CategoryIcon = theme.icon;

  const skillsList = Array.isArray(task.requiredSkills)
    ? task.requiredSkills
    : typeof task.requiredSkills === 'string'
    ? (task.requiredSkills as string).split(',').map((s) => s.trim())
    : [];

  const posterDisplayName = task.businessCompany || task.businessName || 'Verified Business';
  const posterInitial = posterDisplayName.charAt(0).toUpperCase();

  const ratingScore = '5.0';
  const reviewsCount = 12 + (task.title.length % 28);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/tasks/${task.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative fiverr-card flex flex-col justify-between cursor-pointer border border-hairline/90 hover:border-moss-primary/60 hover:shadow-xl hover:shadow-moss-primary/10 transition-all duration-300 transform hover:-translate-y-1 bg-paper-bg"
    >
      {/* Top Banner / Gig Thumbnail (Light Theme) */}
      <div className={`relative h-40 bg-gradient-to-br ${theme.bg} p-4 flex flex-col justify-between overflow-hidden border-b border-moss-sage/60`}>
        {/* Abstract background decorative icon */}
        <div className="absolute right-3 top-3 text-ink-text/10 group-hover:text-ink-text/20 transition-colors pointer-events-none group-hover:scale-110 duration-300">
          <CategoryIcon className="w-16 h-16" />
        </div>

        {/* Top bar with category badge & bookmark heart */}
        <div className="flex items-center justify-between relative z-10">
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${theme.accent}`}>
            {theme.badge}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsSaved(!isSaved);
            }}
            className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
              isSaved
                ? 'bg-moss-deep text-white shadow-md scale-110'
                : 'bg-paper-bg/90 text-ink-muted hover:text-moss-deep hover:bg-paper-bg'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save gig'}
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom banner details: Difficulty pill & Seats */}
        <div className="relative z-10 flex items-center justify-between text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-paper-bg/90 border border-hairline/80 text-ink-text font-semibold shadow-xs">
            {task.difficulty}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] bg-paper-bg/90 px-2 py-0.5 rounded-md border border-hairline/80 text-moss-deep font-semibold shadow-xs">
            <Users className="w-3 h-3 text-moss-deep" />
            {task.assignedWorkersCount}/{task.workerLimit} Seats
          </span>
        </div>
      </div>

      {/* Main Content Body (Light Theme) */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {/* Business Poster Info Row */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-moss-primary to-moss-deep flex items-center justify-center font-bold text-xs text-white shadow-xs">
              {posterInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-ink-text truncate">
                  {posterDisplayName}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-moss-deep bg-moss-sage px-1.5 py-0.2 rounded border border-moss-sage">
                  <CheckCircle2 className="w-2.5 h-2.5 text-moss-deep" /> Verified
                </span>
              </div>
              <span className="text-[10px] text-ink-muted block -mt-0.5">Level 2 Business</span>
            </div>
          </div>

          {/* Gig Title (High contrast: dark slate -> emerald green on hover) */}
          <h3 className="text-sm font-bold text-ink-text line-clamp-2 leading-snug group-hover:text-moss-deep transition-colors">
            {task.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
            {task.description}
          </p>

          {/* Rating & Reviews Line */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center text-moss-deep font-bold gap-1">
              <Star className="w-3.5 h-3.5 fill-moss-primary text-moss-primary" />
              <span>{ratingScore}</span>
            </div>
            <span className="text-ink-muted text-[11px]">({reviewsCount})</span>
            <span className="text-ink-muted text-[10px]">•</span>
            <span className="text-[10px] text-ink-muted font-medium">{task.category}</span>
          </div>

          {/* Skill Tag Pills */}
          {skillsList.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {skillsList.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="text-[10px] font-medium text-ink-text bg-paper-bg px-2 py-0.5 rounded-md border border-hairline"
                >
                  {skill}
                </span>
              ))}
              {skillsList.length > 3 && (
                <span className="text-[10px] text-ink-muted px-1 py-0.5">
                  +{skillsList.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Footer: Starting At / Reward & Direct Action */}
        <div className="pt-3 border-t border-moss-sage/60 mt-2 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-ink-muted tracking-wider block">
              TASK REWARD
            </span>
            <span className="text-base font-black text-moss-deep">
              {formatCurrency(task.reward, task.currency)}
            </span>
          </div>

          {showAcceptButton && onAccept ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAccept(task.id, task.title);
              }}
              disabled={isAccepting}
              className="px-3.5 py-1.5 rounded-xl bg-moss-primary hover:bg-moss-primary text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isAccepting ? (
                <>
                  <Lock className="w-3.5 h-3.5 animate-spin" /> Locking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Claim Seat
                </>
              )}
            </button>
          ) : (
            <Link
              to={`/tasks/${task.id}`}
              onClick={(e) => e.stopPropagation()}
              className="px-3.5 py-1.5 rounded-xl bg-paper-bg border border-hairline hover:border-moss-primary hover:bg-moss-sage/60 text-ink-text hover:text-moss-deep text-xs font-semibold flex items-center gap-1 transition-all"
            >
              Specs <ArrowRight className="w-3 h-3 text-moss-deep" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
