import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, CreditCard, ListTodo, CheckCircle2, Users, Check, Lock, User } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import ApprovalBanner from '../../components/common/ApprovalBanner';
import ShortcutCard from '../../components/common/ShortcutCard';
import { tasksApi } from '../../api/tasks';
import { submissionsApi } from '../../api/submissions';
import { walletApi } from '../../api/wallet';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { SwapyLayout, SwapySlot, SwapyItem, DragHandle } from '../../components/ui/swapy-draggable-card';
import type { Task, Submission, WalletSummary } from '../../types';

const SWAPY_CONFIG = { animation: 'dynamic' as const, autoScrollOnDrag: true };

const Overview: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksRes, subsRes, walletRes] = await Promise.all([
          tasksApi.getMyTasks(),
          submissionsApi.getSubmissions(),
          walletApi.getWalletSummary(),
        ]);
        if (tasksRes.success && tasksRes.data) {
          setTasks(tasksRes.data);
        }
        if (subsRes.success && subsRes.data) {
          setSubmissions(subsRes.data);
        }
        if (walletRes.success && walletRes.data) {
          setWalletSummary(walletRes.data);
        }
      } catch (err) {
        console.warn('Failed to load business overview:', err);
      }
    };
    loadData();
  }, []);

  const pendingSubmissions = submissions.filter((s) => s.status === 'UNDER_REVIEW');
  const approvedSubmissions = submissions.filter((s) => s.status === 'APPROVED');
  const totalSpending = walletSummary?.totalSpending ?? 0;
  const pendingPayout = walletSummary?.pendingPayout ?? 0;
  const companyName = user?.companyName || user?.name || 'CyberNet AI Labs';
  const isApproved = user?.approvalStatus === 'APPROVED';

  const approvalButton =
    isApproved ? (
      <Link
        to="/business/tasks/create"
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-moss-deep to-moss-deep text-white font-bold text-xs shadow-md transition-all hover:opacity-95 flex items-center gap-2"
      >
        <PlusCircle className="w-4 h-4" /> Post New Task Batch
      </Link>
    ) : (
      <div
        className="group relative inline-flex"
        aria-label="Task publishing requires an approved business account"
      >
        <button
          type="button"
          disabled
          className="px-5 py-2.5 rounded-xl bg-moss-sage text-ink-text font-bold text-xs shadow-sm flex items-center gap-2 cursor-not-allowed"
        >
          <Lock className="w-4 h-4" /> Post New Task Batch
        </button>
        <span className="pointer-events-none absolute right-0 top-full mt-2 w-64 hidden group-hover:block rounded-xl bg-moss-deep text-paper-bg text-[11px] font-medium p-3 shadow-xl z-20">
          {user?.approvalStatus === 'REJECTED'
            ? 'This account was rejected. Contact support to reactivate task publishing.'
            : user?.approvalStatus === 'SUSPENDED'
            ? 'This account is suspended. Task publishing is disabled.'
            : 'Task publishing unlocks once a TaskHub admin approves your business account.'}
        </span>
      </div>
    );

  return (
    <SwapyLayout
      id="business-overview-bento"
      config={SWAPY_CONFIG}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5"
    >
      {/* Feature 2: Super Admin Approval Gate — status banner for unapproved businesses */}
      <SwapySlot id="approval-status" className="col-span-12 sm:col-span-2 lg:col-span-12">
        <SwapyItem id="approval-status" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <ApprovalBanner status={user?.approvalStatus} />
        </SwapyItem>
      </SwapySlot>

      {/* Welcome Header */}
      <SwapySlot id="welcome" className="col-span-12 sm:col-span-2 lg:col-span-8">
        <SwapyItem id="welcome" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <div className="h-full p-6 rounded-3xl bg-gradient-to-r from-moss-sage/80 via-paper-bg to-paper-bg border border-moss-sage shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-moss-deep uppercase tracking-wider">Business Poster Dashboard</span>
              <h1 className="text-2xl font-extrabold text-ink-text mt-1">{companyName}</h1>
              <p className="text-xs text-ink-muted mt-1">
                You have <strong className="text-ink-text">{tasks.length} active task batches</strong> and{' '}
                <strong className="text-moss-deep">{pendingSubmissions.length} submission(s) awaiting review</strong>.
              </p>
            </div>

            {approvalButton}
          </div>
        </SwapyItem>
      </SwapySlot>

      {/* Total Spending Metric */}
      <SwapySlot id="total-spending" className="col-span-12 sm:col-span-1 lg:col-span-4">
        <SwapyItem id="total-spending" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard
            className="h-full"
            title="Total Spending"
            value={formatCurrency(totalSpending)}
            subtitle={`${formatCurrency(pendingPayout)} approved & pending payout`}
            icon={CreditCard}
            color="indigo"
          />
        </SwapyItem>
      </SwapySlot>

      {/* Active Task Batches Metric */}
      <SwapySlot id="active-task-batches" className="col-span-12 sm:col-span-1 lg:col-span-4">
        <SwapyItem id="active-task-batches" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard
            className="h-full"
            title="Active Task Batches"
            value={tasks.length.toString()}
            subtitle="Published in marketplace"
            icon={ListTodo}
            color="cyan"
          />
        </SwapyItem>
      </SwapySlot>

      {/* Submissions Approved Metric */}
      <SwapySlot id="submissions-approved" className="col-span-12 sm:col-span-1 lg:col-span-4">
        <SwapyItem id="submissions-approved" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard
            className="h-full"
            title="Submissions Approved"
            value={approvedSubmissions.length.toString()}
            subtitle="Delivered & verified"
            icon={CheckCircle2}
            color="emerald"
          />
        </SwapyItem>
      </SwapySlot>

      {/* Pending Reviews Metric */}
      <SwapySlot id="pending-reviews" className="col-span-12 sm:col-span-1 lg:col-span-4">
        <SwapyItem id="pending-reviews" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard
            className="h-full"
            title="Pending Reviews"
            value={pendingSubmissions.length.toString()}
            subtitle="Action required"
            icon={Users}
            color="amber"
          />
        </SwapyItem>
      </SwapySlot>

      {/* Actionable Submissions Review Prompt */}
      <SwapySlot id="review-queue" className="col-span-12 sm:col-span-2 lg:col-span-6">
        <SwapyItem id="review-queue" className="h-full">
          <DragHandle className="z-20 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <div className="h-full p-6 rounded-2xl bg-paper-bg border border-hairline shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-text">Pending Submission Review Queue</h2>
              <Link to="/business/submissions" className="text-xs text-moss-deep font-semibold hover:underline">
                View All Submissions →
              </Link>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-paper-bg border border-hairline shadow-sm flex items-center gap-3 text-ink-muted text-xs">
                <div className="w-8 h-8 rounded-xl bg-moss-sage border border-moss-sage text-moss-deep flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span>No pending deliverables awaiting review. Worker submissions will appear here for grading and reward payout release.</span>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-moss-sage/30 border border-moss-sage flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-moss-deep uppercase tracking-wider">Awaiting Quality Rating</span>
                  <h3 className="text-base font-bold text-ink-text">{pendingSubmissions[0].taskTitle}</h3>
                  <p className="text-xs text-ink-muted">
                    Worker: {pendingSubmissions[0].workerName} • Submitted: {pendingSubmissions[0].linkUrl || pendingSubmissions[0].proofContent}
                  </p>
                </div>

                <Link
                  to="/business/submissions"
                  className="px-4 py-2 rounded-xl bg-moss-primary hover:bg-moss-deep text-white font-bold text-xs shadow-sm transition-all"
                >
                  Review & Grade Proof
                </Link>
              </div>
            )}
          </div>
        </SwapyItem>
      </SwapySlot>

      {/* Shortcut Cards */}
      <SwapySlot id="shortcut-manage-tasks" className="col-span-12 sm:col-span-1 lg:col-span-3">
        <SwapyItem id="shortcut-manage-tasks" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <ShortcutCard to="/business/tasks" title="My Posted Tasks" description="Manage every task batch you have published." icon={ListTodo} />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-post-new" className="col-span-12 sm:col-span-1 lg:col-span-3">
        <SwapyItem id="shortcut-post-new" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <ShortcutCard to="/business/tasks/create" title="Post New Task" description="Create and publish a new micro-task batch." icon={PlusCircle} />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-review" className="col-span-12 sm:col-span-1 lg:col-span-4">
        <SwapyItem id="shortcut-review" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <ShortcutCard to="/business/submissions" title="Review Submissions" description="View and grade all worker deliverables." icon={CheckCircle2} />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-spending" className="col-span-12 sm:col-span-1 lg:col-span-4">
        <SwapyItem id="shortcut-spending" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <ShortcutCard to="/business/payments" title="Spending & Billing" description="Live escrow, payout and total spending ledger." icon={CreditCard} />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-company-profile" className="col-span-12 sm:col-span-2 lg:col-span-4">
        <SwapyItem id="shortcut-company-profile" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <ShortcutCard to="/business/profile" title="Company Profile" description="Manage company details, branding and approval status." icon={User} />
        </SwapyItem>
      </SwapySlot>
    </SwapyLayout>
  );
};

export default Overview;
