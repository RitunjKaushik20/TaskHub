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
        const res = await tasksApi.getTasks();
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
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white border border-slate-200 rounded-3xl" />
          <div className="h-80 bg-white border border-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Link to="/business/tasks" className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Task List
        </Link>
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-sm shadow-sm">
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
        <Link to="/business/tasks" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Tasks
        </Link>
        <span className="text-xs text-slate-400 font-mono">Task ID: {task.id.slice(0, 8)}...</span>
      </div>

      {/* Fiverr-Style Two-Column Layout (Light Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ================= LEFT COLUMN: GIG SPECS ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {task.category}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                {task.difficulty}
              </span>
              <StatusBadge status={task.status} size="sm" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 leading-snug">{task.title}</h1>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Created on {formatDate(task.createdAt)}</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Active Business Batch
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Description</h3>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{task.description}</p>
          </div>

          {/* Execution Instructions */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Worker Instructions</h3>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-line font-mono leading-relaxed">
              {task.instructions}
            </div>
          </div>

          {/* Proof Requirements */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Proof Requirements</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{task.proofRequirements}</p>
          </div>

          {/* Skills */}
          {skillsList.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {skillsList.map((skill) => (
                  <span key={skill} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: STICKY ORDER SUMMARY ================= */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase text-slate-400">Reward Per Seat</span>
              <span className="text-2xl font-black text-emerald-600">
                {formatCurrency(task.reward, task.currency)}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-700 font-medium">
                <span className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4 text-emerald-600" /> Completion Deadline
                </span>
                <span className="font-bold text-slate-900">{formatDate(task.deadline)}</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Users className="w-4 h-4 text-teal-600" /> Worker Seats Claimed
                  </span>
                  <span className="font-bold text-slate-900">
                    {task.assignedWorkersCount} / {task.workerLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                    style={{ width: `${seatsPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Direct settlement upon approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Real-time Chat & File Attachments</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Link
                to="/business/submissions"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Review Submissions Queue
              </Link>

              <Link
                to="/business/chat"
                className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" /> Open Worker Chat
              </Link>

              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
