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
    bg: 'from-emerald-100/80 via-teal-50 to-white',
    icon: Bot,
    badge: 'AI VERIFIED',
    accent: 'text-emerald-800 border-emerald-300 bg-emerald-100/90',
  },
  'UX Research': {
    bg: 'from-purple-100/80 via-indigo-50 to-white',
    icon: Search,
    badge: 'TOP RESEARCH',
    accent: 'text-purple-800 border-purple-300 bg-purple-100/90',
  },
  'Translation & Localization': {
    bg: 'from-cyan-100/80 via-sky-50 to-white',
    icon: Sparkles,
    badge: 'HUMAN REVIEW',
    accent: 'text-cyan-800 border-cyan-300 bg-cyan-100/90',
  },
  'Software Engineering': {
    bg: 'from-amber-100/80 via-orange-50 to-white',
    icon: Code,
    badge: 'CODE AUDIT',
    accent: 'text-amber-800 border-amber-300 bg-amber-100/90',
  },
  'Lead Generation': {
    bg: 'from-rose-100/80 via-pink-50 to-white',
    icon: FileText,
    badge: 'VERIFIED LEADS',
    accent: 'text-rose-800 border-rose-300 bg-rose-100/90',
  },
};

const DEFAULT_THEME = {
  bg: 'from-slate-100 via-slate-50 to-white',
  icon: Bot,
  badge: 'MICRO-GIG',
  accent: 'text-emerald-800 border-emerald-300 bg-emerald-100/90',
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
      className="group relative fiverr-card flex flex-col justify-between cursor-pointer border border-slate-200/90 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 transform hover:-translate-y-1 bg-white"
    >
      {/* Top Banner / Gig Thumbnail (Light Theme) */}
      <div className={`relative h-40 bg-gradient-to-br ${theme.bg} p-4 flex flex-col justify-between overflow-hidden border-b border-slate-100`}>
        {/* Abstract background decorative icon */}
        <div className="absolute right-3 top-3 text-slate-800/10 group-hover:text-slate-800/20 transition-colors pointer-events-none group-hover:scale-110 duration-300">
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
                ? 'bg-rose-500 text-white shadow-md scale-110'
                : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save gig'}
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom banner details: Difficulty pill & Seats */}
        <div className="relative z-10 flex items-center justify-between text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-white/90 border border-slate-200/80 text-slate-700 font-semibold shadow-xs">
            {task.difficulty}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] bg-white/90 px-2 py-0.5 rounded-md border border-slate-200/80 text-emerald-700 font-semibold shadow-xs">
            <Users className="w-3 h-3 text-emerald-600" />
            {task.assignedWorkersCount}/{task.workerLimit} Seats
          </span>
        </div>
      </div>

      {/* Main Content Body (Light Theme) */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {/* Business Poster Info Row */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              {posterInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {posterDisplayName}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Verified
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block -mt-0.5">Level 2 Business</span>
            </div>
          </div>

          {/* Gig Title (High contrast: dark slate -> emerald green on hover) */}
          <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
            {task.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {task.description}
          </p>

          {/* Rating & Reviews Line */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center text-amber-500 font-bold gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{ratingScore}</span>
            </div>
            <span className="text-slate-400 text-[11px]">({reviewsCount})</span>
            <span className="text-slate-300 text-[10px]">•</span>
            <span className="text-[10px] text-slate-500 font-medium">{task.category}</span>
          </div>

          {/* Skill Tag Pills */}
          {skillsList.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {skillsList.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200"
                >
                  {skill}
                </span>
              ))}
              {skillsList.length > 3 && (
                <span className="text-[10px] text-slate-400 px-1 py-0.5">
                  +{skillsList.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Footer: Starting At / Reward & Direct Action */}
        <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
              TASK REWARD
            </span>
            <span className="text-base font-black text-emerald-600">
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
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
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
              className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1 transition-all"
            >
              Specs <ArrowRight className="w-3 h-3 text-emerald-600" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
