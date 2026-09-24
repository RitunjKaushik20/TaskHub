import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  Zap,
  Lock,
  Share2,
  MessageSquare,
  Bot,
  FileCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { tasksApi } from '../../api/tasks';
import type { Task } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTask = async () => {
      setIsLoading(true);
      try {
        const res = await tasksApi.getTasks();
        if (res.success && res.data) {
          const match = res.data.find((t) => t.id === id);
          setTask(match || null);
        }
      } catch (err) {
        console.error('Failed to load task details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  const handleClaimTask = async () => {
    if (!task) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'WORKER') {
      toast.error('Worker Account Required', 'Only worker accounts can claim and execute micro-tasks.');
      return;
    }

    setIsClaiming(true);
    try {
      const response = await tasksApi.acceptTask(task.id);
      if (response.success) {
        toast.success('Task Claimed!', `You locked a seat for "${task.title}". Redirecting to active tasks.`);
        navigate('/worker/my-tasks');
      } else {
        toast.error('Claim Failed', response.message || 'Unable to claim task seat.');
      }
    } catch {
      toast.error('Claim Failed', 'An error occurred while claiming the task.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success('Link Copied', 'Gig link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
        <div className="h-6 bg-moss-light/40 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-10 bg-moss-light/40 rounded w-3/4" />
            <div className="h-64 bg-paper-bg rounded-2xl border border-hairline" />
            <div className="h-40 bg-paper-bg rounded-2xl border border-hairline" />
          </div>
          <div className="h-96 bg-paper-bg rounded-2xl border border-hairline" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-20 max-w-lg mx-auto px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-paper-bg flex items-center justify-center mx-auto text-ink-muted">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-ink-text">Gig Not Found</h2>
        <p className="text-xs text-ink-muted">
          This task may have been completed, deleted, or expired.
        </p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-moss-primary text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Browse All Gigs
        </Link>
      </div>
    );
  }

  const posterName = task.businessCompany || task.businessName || 'Verified Enterprise';
  const posterInitial = posterName.charAt(0).toUpperCase();
  const seatsFull = task.assignedWorkersCount >= task.workerLimit;
  const seatsPercentage = Math.min(100, Math.round((task.assignedWorkersCount / task.workerLimit) * 100));

  const skillsList = Array.isArray(task.requiredSkills)
    ? task.requiredSkills
    : typeof task.requiredSkills === 'string'
    ? (task.requiredSkills as string).split(',').map((s) => s.trim())
    : [];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Breadcrumbs & Back Link */}
      <div className="flex items-center justify-between gap-4 text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <Link to="/browse" className="hover:text-moss-deep transition-colors flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> Marketplace
          </Link>
          <span>/</span>
          <span className="text-ink-text font-medium">{task.category}</span>
          <span>/</span>
          <span className="text-ink-muted truncate max-w-xs">{task.title}</span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-bg border border-hairline hover:border-moss-sage text-ink-text text-xs font-semibold transition-colors shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5 text-ink-muted" />
          {copiedLink ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Fiverr-Style Two-Column Layout (Light Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ================= LEFT COLUMN: GIG CONTENT ================= */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gig Title */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-moss-sage text-moss-deep border border-moss-sage">
                {task.category}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-paper-bg border border-hairline text-ink-text">
                {task.difficulty}
              </span>
              <StatusBadge status={task.status} size="sm" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-ink-text leading-snug">
              {task.title}
            </h1>

            {/* Poster Header Row */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-moss-primary to-moss-deep flex items-center justify-center font-bold text-sm text-white shadow-xs">
                {posterInitial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink-text">{posterName}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-moss-deep bg-moss-sage px-2 py-0.5 rounded-full border border-moss-sage">
                    <CheckCircle2 className="w-3 h-3 text-moss-deep" /> Verified Poster
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-muted font-medium">
                  <div className="flex items-center text-moss-deep font-bold gap-1">
                    <Star className="w-3.5 h-3.5 fill-moss-primary text-moss-primary" /> 5.0
                  </div>
                  <span>•</span>
                  <span>Level 2 Enterprise</span>
                  <span>•</span>
                  <span>Response: &lt; 1 hour</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thematic Assurance Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-moss-sage via-moss-sage/50 to-paper-bg border border-moss-sage relative overflow-hidden space-y-2 shadow-xs">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2 text-moss-deep font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-moss-deep" /> TaskHub Verified Direct Settlement
              </div>
              <span className="text-[11px] font-mono text-ink-muted font-medium">
                Posted: {formatDate(task.createdAt)}
              </span>
            </div>
            <p className="text-xs text-ink-text relative z-10 leading-relaxed max-w-xl">
              This task guarantees direct reward distribution upon deliverable verification. 0% escrow delay, 0 platform deduction.
            </p>
          </div>

          {/* About This Task */}
          <div className="p-6 rounded-2xl bg-paper-bg border border-hairline space-y-3 shadow-xs">
            <h2 className="text-sm font-black text-ink-text uppercase tracking-wide">
              About This Task
            </h2>
            <p className="text-xs text-ink-text leading-relaxed whitespace-pre-line">
              {task.description}
            </p>
          </div>

          {/* Execution Instructions */}
          <div className="p-6 rounded-2xl bg-paper-bg border border-hairline space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-moss-sage border border-moss-sage flex items-center justify-center text-moss-deep">
                <Bot className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-ink-text uppercase tracking-wide">
                Step-by-Step Worker Instructions
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-paper-bg border border-hairline text-xs text-ink-text whitespace-pre-line leading-relaxed font-mono">
              {task.instructions}
            </div>
          </div>

          {/* Deliverable Proof Requirements */}
          <div className="p-6 rounded-2xl bg-paper-bg border border-hairline space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-moss-sage/30 border border-moss-sage flex items-center justify-center text-moss-deep">
                <FileCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-ink-text uppercase tracking-wide">
                Proof & Verification Criteria
              </h2>
            </div>
            <div className="p-4 rounded-xl bg-paper-bg border border-hairline text-xs text-ink-text leading-relaxed">
              <p className="font-bold text-moss-deep mb-1">Required Deliverable:</p>
              <p>{task.proofRequirements}</p>
            </div>
          </div>

          {/* Required Skills & Competencies */}
          {skillsList.length > 0 && (
            <div className="p-6 rounded-2xl bg-paper-bg border border-hairline space-y-3 shadow-xs">
              <h2 className="text-sm font-black text-ink-text uppercase tracking-wide">
                Required Skills & Expertise
              </h2>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-lg bg-paper-bg border border-hairline text-ink-text text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About the Business Poster Card */}
          <div className="p-6 rounded-2xl bg-paper-bg border border-hairline space-y-4 shadow-xs">
            <h2 className="text-sm font-black text-ink-text uppercase tracking-wide">
              About the Poster
            </h2>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-moss-primary to-moss-deep flex items-center justify-center font-bold text-base text-white shrink-0 shadow-xs">
                {posterInitial}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-ink-text">{posterName}</h3>
                  <span className="text-[10px] text-moss-deep font-bold bg-moss-sage px-2 py-0.5 rounded border border-moss-sage">
                    Verified Business
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  Active business poster committing direct settlements for AI training data and technical workflows on TaskHub.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                  <div>
                    <span className="text-ink-muted block text-[10px] uppercase font-bold">Rating</span>
                    <span className="text-ink-text font-bold">★ 5.0 (100% On-Time)</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[10px] uppercase font-bold">Member Since</span>
                    <span className="text-ink-text font-bold">{formatDate(task.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[10px] uppercase font-bold">Review Window</span>
                    <span className="text-moss-deep font-bold">&lt; 24 Hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: STICKY ORDER SUMMARY ================= */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="p-6 rounded-3xl bg-paper-bg border border-hairline shadow-xl space-y-6">
            {/* Header Tab */}
            <div className="flex items-center justify-between border-b border-moss-sage/60 pb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
                Direct Task Reward
              </span>
              <span className="text-2xl font-black text-moss-deep">
                {formatCurrency(task.reward, task.currency)}
              </span>
            </div>

            {/* Micro-gigs specification details */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-ink-text font-medium">
                <span className="flex items-center gap-2 text-ink-muted">
                  <Clock className="w-4 h-4 text-moss-deep" /> Completion Deadline
                </span>
                <span className="font-bold text-ink-text">{formatDate(task.deadline)}</span>
              </div>

              {/* Worker Seats Progress */}
              <div className="space-y-1.5 pt-2 border-t border-moss-sage/60">
                <div className="flex items-center justify-between text-ink-text font-medium">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <Users className="w-4 h-4 text-moss-deep" /> Worker Seats
                  </span>
                  <span className="font-bold text-ink-text">
                    {task.assignedWorkersCount} / {task.workerLimit} Filled
                  </span>
                </div>
                <div className="w-full bg-paper-bg rounded-full h-2 overflow-hidden border border-hairline">
                  <div
                    className="bg-gradient-to-r from-moss-primary to-moss-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${seatsPercentage}%` }}
                  />
                </div>
              </div>

              {/* Protection Guarantees */}
              <div className="space-y-2 pt-3 border-t border-moss-sage/60 text-[11px] text-ink-muted">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-moss-deep shrink-0 mt-0.5" />
                  <span>100% Direct Payout to your earnings (0 deductions)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-moss-deep shrink-0 mt-0.5" />
                  <span>Rapid 24-hour review SLA after proof submission</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-moss-deep shrink-0 mt-0.5" />
                  <span>Real-time chat with image & file attachments</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              {user?.role === 'BUSINESS' && user.id === task.businessId ? (
                <div className="space-y-2">
                  <Link
                    to="/business/submissions"
                    className="w-full py-3.5 rounded-2xl bg-moss-primary hover:bg-moss-primary text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-moss-primary/25 transition-all"
                  >
                    View Task Submissions
                  </Link>
                  <Link
                    to={`/business/chat`}
                    className="w-full py-2.5 rounded-xl bg-paper-bg border border-hairline hover:bg-paper-bg text-ink-text text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-moss-deep" /> Open Chat
                  </Link>
                </div>
              ) : isAuthenticated && user?.role === 'WORKER' ? (
                <button
                  type="button"
                  onClick={handleClaimTask}
                  disabled={isClaiming || seatsFull}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all ${
                    seatsFull
                      ? 'bg-paper-bg text-ink-muted cursor-not-allowed border border-hairline'
                      : 'bg-moss-primary hover:bg-moss-primary text-white shadow-moss-primary/25 hover:scale-[1.02]'
                  }`}
                >
                  {isClaiming ? (
                    <>
                      <Lock className="w-4 h-4 animate-spin" /> Locking Worker Seat...
                    </>
                  ) : seatsFull ? (
                    'All Seats Claimed'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Claim & Start Task
                    </>
                  )}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="w-full py-3.5 rounded-2xl bg-moss-primary hover:bg-moss-primary text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-moss-primary/25 hover:scale-[1.02] transition-all"
                >
                  Log In to Claim Task
                </Link>
              )}
            </div>

            <p className="text-[10px] text-center text-ink-muted font-medium">
              No subscription or credit card needed to accept tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
