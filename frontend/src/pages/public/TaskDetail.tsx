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
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-10 bg-slate-200 rounded w-3/4" />
            <div className="h-64 bg-white rounded-2xl border border-slate-200" />
            <div className="h-40 bg-white rounded-2xl border border-slate-200" />
          </div>
          <div className="h-96 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-20 max-w-lg mx-auto px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Gig Not Found</h2>
        <p className="text-xs text-slate-500">
          This task may have been completed, deleted, or expired.
        </p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
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
      <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Link to="/browse" className="hover:text-emerald-700 transition-colors flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> Marketplace
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">{task.category}</span>
          <span>/</span>
          <span className="text-slate-500 truncate max-w-xs">{task.title}</span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-500" />
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
              <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {task.category}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                {task.difficulty}
              </span>
              <StatusBadge status={task.status} size="sm" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
              {task.title}
            </h1>

            {/* Poster Header Row */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-sm text-white shadow-xs">
                {posterInitial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{posterName}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Poster
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <div className="flex items-center text-amber-500 font-bold gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 5.0
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
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200 relative overflow-hidden space-y-2 shadow-xs">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" /> TaskHub Verified Direct Settlement
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                Posted: {formatDate(task.createdAt)}
              </span>
            </div>
            <p className="text-xs text-slate-700 relative z-10 leading-relaxed max-w-xl">
              This task guarantees direct reward distribution upon deliverable verification. 0% escrow delay, 0 platform deduction.
            </p>
          </div>

          {/* About This Task */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              About This Task
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {task.description}
            </p>
          </div>

          {/* Execution Instructions */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Bot className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Step-by-Step Worker Instructions
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-mono">
              {task.instructions}
            </div>
          </div>

          {/* Deliverable Proof Requirements */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <FileCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Proof & Verification Criteria
              </h2>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed">
              <p className="font-bold text-emerald-800 mb-1">Required Deliverable:</p>
              <p>{task.proofRequirements}</p>
            </div>
          </div>

          {/* Required Skills & Competencies */}
          {skillsList.length > 0 && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Required Skills & Expertise
              </h2>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About the Business Poster Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              About the Poster
            </h2>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-base text-white shrink-0 shadow-xs">
                {posterInitial}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{posterName}</h3>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified Business
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Active business poster committing direct settlements for AI training data and technical workflows on TaskHub.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Rating</span>
                    <span className="text-slate-900 font-bold">★ 5.0 (100% On-Time)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Member Since</span>
                    <span className="text-slate-900 font-bold">{formatDate(task.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Review Window</span>
                    <span className="text-emerald-700 font-bold">&lt; 24 Hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: STICKY ORDER SUMMARY ================= */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
            {/* Header Tab */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Direct Task Reward
              </span>
              <span className="text-2xl font-black text-emerald-600">
                {formatCurrency(task.reward, task.currency)}
              </span>
            </div>

            {/* Micro-gigs specification details */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-700 font-medium">
                <span className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4 text-emerald-600" /> Completion Deadline
                </span>
                <span className="font-bold text-slate-900">{formatDate(task.deadline)}</span>
              </div>

              {/* Worker Seats Progress */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Users className="w-4 h-4 text-teal-600" /> Worker Seats
                  </span>
                  <span className="font-bold text-slate-900">
                    {task.assignedWorkersCount} / {task.workerLimit} Filled
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${seatsPercentage}%` }}
                  />
                </div>
              </div>

              {/* Protection Guarantees */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>100% Direct Payout to your earnings (0 deductions)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Rapid 24-hour review SLA after proof submission</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
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
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    View Task Submissions
                  </Link>
                  <Link
                    to={`/business/chat`}
                    className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Open Chat
                  </Link>
                </div>
              ) : isAuthenticated && user?.role === 'WORKER' ? (
                <button
                  type="button"
                  onClick={handleClaimTask}
                  disabled={isClaiming || seatsFull}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all ${
                    seatsFull
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:scale-[1.02]'
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
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 hover:scale-[1.02] transition-all"
                >
                  Log In to Claim Task
                </Link>
              )}
            </div>

            <p className="text-[10px] text-center text-slate-400 font-medium">
              No subscription or credit card needed to accept tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
