import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, CheckCircle2, Clock, ArrowRight, TrendingUp, ListTodo, Send, MessageSquare, User } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import ShortcutCard from '../../components/common/ShortcutCard';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { walletApi } from '../../api/wallet';
import { tasksApi } from '../../api/tasks';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SwapyLayout, SwapySlot, SwapyItem, DragHandle } from '../../components/ui/swapy-draggable-card';
import type { Task, WalletSummary } from '../../types';

const SWAPY_CONFIG = { animation: 'dynamic' as const, autoScrollOnDrag: true };

const Overview: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletSummary>({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    totalSpending: 0,
    pendingPayout: 0,
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
    <SwapyLayout
      id="worker-overview-bento"
      config={SWAPY_CONFIG}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5"
    >
      {/* Welcome Banner */}
      <SwapySlot id="welcome" className="col-span-12 sm:col-span-2 lg:col-span-8">
        <SwapyItem id="welcome" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <div className="h-full p-6 rounded-3xl bg-gradient-to-r from-moss-sage/80 via-paper-bg to-paper-bg border border-moss-sage shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-moss-deep uppercase tracking-wider">Worker Dashboard</span>
              <h1 className="text-2xl font-extrabold text-ink-text mt-1">Welcome back, {user?.name || 'Worker'}!</h1>
              <p className="text-xs text-ink-muted mt-1">
                Total Earnings: <strong className="text-moss-deep">{formatCurrency(wallet.totalEarned || wallet.availableBalance)}</strong> • In Review: <strong className="text-moss-deep">{formatCurrency(wallet.pendingBalance)}</strong>.
              </p>
            </div>

            <Link
              to="/worker/tasks"
              className="px-5 py-2.5 rounded-xl bg-moss-primary hover:bg-moss-deep text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              Browse Marketplace Tasks <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </SwapyItem>
      </SwapySlot>

      {/* Total Earnings Metric */}
      <SwapySlot id="total-earnings" className="col-span-12 sm:col-span-1 lg:col-span-4">
        <SwapyItem id="total-earnings" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard
            className="h-full"
            title="Total Earnings"
            value={formatCurrency(wallet.totalEarned || wallet.availableBalance)}
            subtitle="Cumulative verified earnings"
            icon={Wallet}
            color="emerald"
          />
        </SwapyItem>
      </SwapySlot>

      {/* Pending Review Metric */}
      <SwapySlot id="pending-review" className="col-span-12 sm:col-span-1 lg:col-span-4">
        <SwapyItem id="pending-review" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard
            className="h-full"
            title="Pending Review"
            value={formatCurrency(wallet.pendingBalance)}
            subtitle="Awaiting task verification"
            icon={Clock}
            color="amber"
          />
        </SwapyItem>
      </SwapySlot>

      {/* Tasks Completed Metric */}
      <SwapySlot id="tasks-completed" className="col-span-12 sm:col-span-1 lg:col-span-4">
        <SwapyItem id="tasks-completed" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard
            className="h-full"
            title="Tasks Completed"
            value={(wallet.totalEarned > 0 ? Math.max(1, Math.round(wallet.totalEarned / 25)) : 0).toString()}
            subtitle="Successfully delivered"
            icon={CheckCircle2}
            color="indigo"
          />
        </SwapyItem>
      </SwapySlot>

      {/* Active Earnings Rate Metric */}
      <SwapySlot id="active-earnings-rate" className="col-span-12 sm:col-span-1 lg:col-span-4">
        <SwapyItem id="active-earnings-rate" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard
            className="h-full"
            title="Active Earnings Rate"
            value="100%"
            subtitle="Task approval rate"
            icon={TrendingUp}
            color="cyan"
          />
        </SwapyItem>
      </SwapySlot>

      {/* Task Lifecycle Diagram */}
      <SwapySlot id="task-lifecycle" className="col-span-12 lg:col-span-5">
        <SwapyItem id="task-lifecycle" className="h-full">
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <div className="h-full p-6 rounded-2xl bg-paper-bg border border-hairline shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-ink-text uppercase tracking-wider">Task Execution Flow Statuses</h3>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <StatusBadge status="AVAILABLE" />
              <span className="text-ink-muted font-bold">→</span>
              <StatusBadge status="ASSIGNED" />
              <span className="text-ink-muted font-bold">→</span>
              <StatusBadge status="IN_PROGRESS" />
              <span className="text-ink-muted font-bold">→</span>
              <StatusBadge status="SUBMITTED" />
              <span className="text-ink-muted font-bold">→</span>
              <StatusBadge status="UNDER_REVIEW" />
              <span className="text-ink-muted font-bold">→</span>
              <StatusBadge status="APPROVED" />
              <span className="text-ink-muted font-bold">→</span>
              <StatusBadge status="PAID" />
            </div>
          </div>
        </SwapyItem>
      </SwapySlot>

      {/* Available Tasks Quick List */}
      <SwapySlot id="recommended-tasks" className="col-span-12 lg:col-span-7">
        <SwapyItem id="recommended-tasks" className="h-full">
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <div className="h-full p-6 rounded-2xl bg-paper-bg border border-hairline shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-text">Recommended Tasks for You</h2>
              <Link to="/worker/tasks" className="text-xs text-moss-deep font-semibold hover:underline">
                View All Tasks →
              </Link>
            </div>

            {recommendedTasks.length === 0 ? (
              <Card className="p-8 text-center space-y-2">
                <p className="text-ink-muted text-sm">No new tasks available at this moment.</p>
                <Link to="/worker/tasks" className="text-moss-deep font-semibold text-xs hover:underline">
                  Check all marketplace categories →
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {recommendedTasks.map((task) => (
                  <Card key={task.id} className="p-5 space-y-4 flex flex-col justify-between hover:border-moss-primary/40">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-moss-deep px-2 py-0.5 rounded bg-moss-sage border border-moss-sage">
                          {task.category}
                        </span>
                        <span className="text-sm font-extrabold text-moss-deep">{formatCurrency(task.reward, task.currency)}</span>
                      </div>
                      <h3 className="text-base font-bold text-ink-text">{task.title}</h3>
                      <p className="text-xs text-ink-muted line-clamp-2">{task.description}</p>
                    </div>

                    <div className="pt-3 border-t border-moss-sage/60 flex items-center justify-between">
                      <span className="text-xs text-ink-muted">By {task.businessCompany || task.businessName || 'Business'}</span>
                      <Button
                        variant="primary"
                        onClick={() => handleAcceptTask(task.id)}
                        disabled={lockingId === task.id}
                      >
                        {lockingId === task.id ? 'Locking Seat...' : 'Accept Task'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SwapyItem>
      </SwapySlot>

      {/* Shortcut Cards */}
      <SwapySlot id="shortcut-browse" className="col-span-12 sm:col-span-1 lg:col-span-3">
        <SwapyItem id="shortcut-browse" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <ShortcutCard to="/worker/tasks" title="Browse Tasks" description="Explore the live marketplace and accept new micro-tasks." icon={ListTodo} />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-submissions" className="col-span-12 sm:col-span-1 lg:col-span-3">
        <SwapyItem id="shortcut-submissions" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <ShortcutCard to="/worker/submissions" title="My Submissions" description="Track submission history and live review status." icon={Send} />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-chat" className="col-span-12 sm:col-span-1 lg:col-span-3">
        <SwapyItem id="shortcut-chat" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <ShortcutCard to="/worker/chat" title="Task Chat Threads" description="Open Socket.IO chat threads with business posters." icon={MessageSquare} />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-profile" className="col-span-12 sm:col-span-1 lg:col-span-3">
        <SwapyItem id="shortcut-profile" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <ShortcutCard to="/worker/profile" title="Worker Profile" description="Manage your account, skills and payout details." icon={User} />
        </SwapyItem>
      </SwapySlot>
    </SwapyLayout>
  );
};

export default Overview;
