import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tasksApi } from '../../api/tasks';
import type { Task } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Users,
  ShieldCheck,
  Bot,
  FileCheck,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const BusinessTaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadTask = async () => {
      setIsLoading(true);
      try {
        const res = await tasksApi.getMyTasks();
        if (res.success && res.data) {
          const match = res.data.find((t) => t.id === id);
          setTask(match || null);
        }
      } catch (err) {
        console.warn('Could not load task details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTask();
  }, [id]);

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!window.confirm(`Are you sure you want to delete "${task.title}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await tasksApi.deleteTask(task.id);
      if (res.success) {
        toast.success('Task Deleted', 'The task has been permanently removed.');
        navigate('/business/tasks');
      } else {
        toast.error('Deletion Failed', res.message || 'Unable to delete task.');
      }
    } catch {
      toast.error('Deletion Failed', 'An error occurred while deleting the task.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 space-y-6 animate-pulse">
        <div className="h-6 bg-moss-light/40 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-paper-bg border border-hairline rounded-3xl" />
          <div className="h-80 bg-paper-bg border border-hairline rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Link to="/business/tasks" className="inline-flex items-center gap-1 text-xs text-moss-deep font-bold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Task List
        </Link>
        <div className="p-10 rounded-2xl bg-paper-bg border border-hairline text-center text-ink-muted text-sm shadow-sm">
          Task not found. It may have been deleted or archived.
        </div>
      </div>
    );
  }

  const skillsList = Array.isArray(task.requiredSkills)
    ? task.requiredSkills
    : typeof task.requiredSkills === 'string'
    ? (task.requiredSkills as string).split(',').map((s) => s.trim())
    : [];

  const seatsPercentage = Math.min(100, Math.round((task.assignedWorkersCount / task.workerLimit) * 100));

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link to="/business/tasks" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-moss-deep font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Tasks
        </Link>
        <span className="text-xs text-ink-muted font-mono">Task ID: {task.id.slice(0, 8)}...</span>
      </div>

      {/* Fiverr-Style Two-Column Layout (Light Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ================= LEFT COLUMN: GIG SPECS ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-paper-bg border border-hairline space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-moss-sage text-moss-deep border border-moss-sage">
                {task.category}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-paper-bg border border-hairline text-ink-text">
                {task.difficulty}
              </span>
              <StatusBadge status={task.status} size="sm" />
            </div>

            <h1 className="text-2xl font-black text-ink-text leading-snug">{task.title}</h1>

            <div className="flex items-center gap-4 text-xs text-ink-muted pt-2 border-t border-moss-sage/60">
              <span>Created on {formatDate(task.createdAt)}</span>
              <span>•</span>
              <span className="text-moss-deep font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Active Business Batch
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 rounded-3xl bg-paper-bg border border-hairline space-y-3 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-ink-muted">Description</h3>
            <p className="text-xs text-ink-text leading-relaxed whitespace-pre-line">{task.description}</p>
          </div>

          {/* Execution Instructions */}
          <div className="p-6 rounded-3xl bg-paper-bg border border-hairline space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-moss-deep" />
              <h3 className="text-xs font-black uppercase tracking-wider text-ink-muted">Worker Instructions</h3>
            </div>
            <div className="p-4 rounded-xl bg-paper-bg border border-hairline text-xs text-ink-text whitespace-pre-line font-mono leading-relaxed">
              {task.instructions}
            </div>
          </div>

          {/* Proof Requirements */}
          <div className="p-6 rounded-3xl bg-paper-bg border border-hairline space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-moss-deep" />
              <h3 className="text-xs font-black uppercase tracking-wider text-ink-muted">Proof Requirements</h3>
            </div>
            <p className="text-xs text-ink-text leading-relaxed">{task.proofRequirements}</p>
          </div>

          {/* Skills */}
          {skillsList.length > 0 && (
            <div className="p-6 rounded-3xl bg-paper-bg border border-hairline space-y-3 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-ink-muted">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {skillsList.map((skill) => (
                  <span key={skill} className="text-xs px-2.5 py-1 rounded-lg bg-paper-bg border border-hairline text-ink-text font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: STICKY ORDER SUMMARY ================= */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="p-6 rounded-3xl bg-paper-bg border-2 border-hairline shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-moss-sage/60 pb-4">
              <span className="text-xs font-bold uppercase text-ink-muted">Reward Per Seat</span>
              <span className="text-2xl font-black text-moss-deep">
                {formatCurrency(task.reward, task.currency)}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-ink-text font-medium">
                <span className="flex items-center gap-2 text-ink-muted">
                  <Clock className="w-4 h-4 text-moss-deep" /> Completion Deadline
                </span>
                <span className="font-bold text-ink-text">{formatDate(task.deadline)}</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-moss-sage/60">
                <div className="flex items-center justify-between text-ink-text font-medium">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <Users className="w-4 h-4 text-moss-deep" /> Worker Seats Claimed
                  </span>
                  <span className="font-bold text-ink-text">
                    {task.assignedWorkersCount} / {task.workerLimit}
                  </span>
                </div>
                <div className="w-full bg-paper-bg rounded-full h-2 overflow-hidden border border-hairline">
                  <div
                    className="bg-gradient-to-r from-moss-primary to-moss-primary h-full rounded-full transition-all"
                    style={{ width: `${seatsPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-moss-sage/60 text-[11px] text-ink-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-moss-deep" />
                  <span>Direct settlement upon approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-moss-deep" />
                  <span>Real-time Chat & File Attachments</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Link
                to="/business/submissions"
                className="w-full py-3 rounded-xl bg-moss-primary hover:bg-moss-primary text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-moss-primary/25 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Review Submissions Queue
              </Link>

              <Link
                to="/business/chat"
                className="w-full py-2.5 rounded-xl bg-paper-bg border border-hairline hover:bg-paper-bg text-ink-text text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-moss-deep" /> Open Worker Chat
              </Link>

              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl bg-moss-sage/30 hover:bg-moss-sage border border-moss-sage text-moss-deep text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting Batch...' : 'Delete Task Batch'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessTaskDetail;
