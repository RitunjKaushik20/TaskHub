import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, CheckCircle2, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { walletApi } from '../../api/wallet';
import { tasksApi } from '../../api/tasks';
import type { Task, WalletSummary } from '../../types';

const Overview: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletSummary>({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
  });
  const [recommendedTasks, setRecommendedTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        const [walletRes, tasksRes] = await Promise.all([
          walletApi.getWalletSummary(),
          tasksApi.getTasks(),
        ]);
        if (walletRes.success && walletRes.data) {
          setWallet(walletRes.data);
        }
        if (tasksRes.success && tasksRes.data) {
          setRecommendedTasks(tasksRes.data.filter((t) => t.status === 'AVAILABLE').slice(0, 2));
        }
      } catch (err) {
        console.warn('Failed to load worker overview data:', err);
      }
    };
    loadOverviewData();
  }, []);

  const handleAcceptTask = async (taskId: string) => {
    setLockingId(taskId);
    try {
      const res = await tasksApi.acceptTask(taskId);
      if (res.success) {
        toast.success('Task Accepted & Seat Locked!', 'You have 4 hours to complete instructions.');
        // Refresh recommended tasks
        const tasksRes = await tasksApi.getTasks();
        if (tasksRes.success && tasksRes.data) {
          setRecommendedTasks(tasksRes.data.filter((t) => t.status === 'AVAILABLE').slice(0, 2));
        }
      } else {
        toast.error('Could Not Claim Task', res.message || 'Failed to claim seat');
      }
    } catch {
      toast.error('Network Error', 'Please check your connection and try again.');
    } finally {
      setLockingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 border border-emerald-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Worker Dashboard</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Welcome back, {user?.name || 'Worker'}!</h1>
          <p className="text-xs text-slate-600 mt-1">
            Total Earnings: <strong className="text-emerald-700">{formatCurrency(wallet.totalEarned || wallet.availableBalance)}</strong> • In Review: <strong className="text-amber-700">{formatCurrency(wallet.pendingBalance)}</strong>.
          </p>
        </div>

        <Link
          to="/worker/tasks"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          Browse Marketplace Tasks <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Earnings"
          value={formatCurrency(wallet.totalEarned || wallet.availableBalance)}
          subtitle="Cumulative verified earnings"
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="Pending Review"
          value={formatCurrency(wallet.pendingBalance)}
          subtitle="Awaiting task verification"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Tasks Completed"
          value={(wallet.totalEarned > 0 ? Math.max(1, Math.round(wallet.totalEarned / 25)) : 0).toString()}
          subtitle="Successfully delivered"
          icon={CheckCircle2}
          color="indigo"
        />
        <StatCard
          title="Active Earnings Rate"
          value="100%"
          subtitle="Task approval rate"
          icon={TrendingUp}
          color="cyan"
        />
      </div>

      {/* Task Lifecycle Diagram */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Task Execution Flow Statuses</h3>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <StatusBadge status="AVAILABLE" />
          <span className="text-slate-400 font-bold">→</span>
          <StatusBadge status="ASSIGNED" />
          <span className="text-slate-400 font-bold">→</span>
          <StatusBadge status="IN_PROGRESS" />
          <span className="text-slate-400 font-bold">→</span>
          <StatusBadge status="SUBMITTED" />
          <span className="text-slate-400 font-bold">→</span>
          <StatusBadge status="UNDER_REVIEW" />
          <span className="text-slate-400 font-bold">→</span>
          <StatusBadge status="APPROVED" />
          <span className="text-slate-400 font-bold">→</span>
          <StatusBadge status="PAID" />
        </div>
      </div>

      {/* Available Tasks Quick List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recommended Tasks for You</h2>
          <Link to="/worker/tasks" className="text-xs text-brand-600 font-semibold hover:underline">
            View All Tasks →
          </Link>
        </div>

        {recommendedTasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-2">
            <p className="text-slate-600 text-sm">No new tasks available at this moment.</p>
            <Link to="/worker/tasks" className="text-brand-600 font-semibold text-xs hover:underline">
              Check all marketplace categories →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recommendedTasks.map((task) => (
              <div key={task.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-brand-500/40 hover:shadow-md transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-brand-700 px-2 py-0.5 rounded bg-brand-50 border border-brand-200">
                      {task.category}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">{formatCurrency(task.reward, task.currency)}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{task.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">By {task.businessCompany || task.businessName || 'Business'}</span>
                  <button
                    onClick={() => handleAcceptTask(task.id)}
                    disabled={lockingId === task.id}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all"
                  >
                    {lockingId === task.id ? 'Locking Seat...' : 'Accept Task'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
