import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, CreditCard, ListTodo, CheckCircle2, Users, Check } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { tasksApi } from '../../api/tasks';
import { submissionsApi } from '../../api/submissions';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import type { Task, Submission } from '../../types';

const Overview: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksRes, subsRes] = await Promise.all([
          tasksApi.getTasks(),
          submissionsApi.getSubmissions(),
        ]);
        if (tasksRes.success && tasksRes.data) {
          setTasks(tasksRes.data);
        }
        if (subsRes.success && subsRes.data) {
          setSubmissions(subsRes.data);
        }
      } catch (err) {
        console.warn('Failed to load business overview:', err);
      }
    };
    loadData();
  }, []);

  const pendingSubmissions = submissions.filter((s) => s.status === 'UNDER_REVIEW');
  const approvedSubmissions = submissions.filter((s) => s.status === 'APPROVED');
  const totalRewardCommitted = tasks.reduce((sum, t) => sum + (t.reward * t.workerLimit), 0);
  const companyName = user?.companyName || user?.name || 'CyberNet AI Labs';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="p-6 rounded-3xl glass-panel border border-brand-500/30 bg-gradient-to-r from-brand-950/50 via-slate-900 to-dark-bg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Business Poster Dashboard</span>
          <h1 className="text-2xl font-extrabold text-white mt-1">{companyName}</h1>
          <p className="text-xs text-slate-400 mt-1">
            You have <strong className="text-white">{tasks.length} active task batches</strong> and{' '}
            <strong className="text-amber-400">{pendingSubmissions.length} submission(s) awaiting review</strong>.
          </p>
        </div>

        <Link
          to="/business/tasks/create"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-accent text-white font-bold text-xs shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Post New Task Batch
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Allocated Rewards"
          value={formatCurrency(totalRewardCommitted)}
          subtitle="Committed across active tasks"
          icon={CreditCard}
          color="indigo"
        />
        <StatCard
          title="Active Task Batches"
          value={tasks.length.toString()}
          subtitle="Published in marketplace"
          icon={ListTodo}
          color="cyan"
        />
        <StatCard
          title="Submissions Approved"
          value={approvedSubmissions.length.toString()}
          subtitle="Delivered & verified"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending Reviews"
          value={pendingSubmissions.length.toString()}
          subtitle="Action required"
          icon={Users}
          color="amber"
        />
      </div>

      {/* Actionable Submissions Review Prompt */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Pending Submission Review Queue</h2>
          <Link to="/business/submissions" className="text-xs text-brand-accent hover:underline">
            View All Submissions →
          </Link>
        </div>

        {pendingSubmissions.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel border border-slate-800 flex items-center gap-3 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <span>No pending deliverables awaiting review. Worker submissions will appear here for grading and reward payout release.</span>
          </div>
        ) : (
          <div className="p-5 rounded-2xl glass-panel border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Awaiting Quality Rating</span>
              <h3 className="text-base font-bold text-white">{pendingSubmissions[0].taskTitle}</h3>
              <p className="text-xs text-slate-400">
                Worker: {pendingSubmissions[0].workerName} • Submitted: {pendingSubmissions[0].linkUrl || pendingSubmissions[0].proofContent}
              </p>
            </div>

            <Link
              to="/business/submissions"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
            >
              Review & Grade Proof
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
