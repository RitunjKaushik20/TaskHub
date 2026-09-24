import React, { useCallback, useEffect, useState } from 'react';
import { DollarSign, Users, ShieldCheck, BarChart3, Activity, TrendingUp, ClipboardCheck, ListTodo, CheckCircle2, ShieldAlert, Settings } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import ShortcutCard from '../../components/common/ShortcutCard';
import { adminApi } from '../../api/admin';
import { getSocket } from '../../lib/socket';
import { SwapyLayout, SwapySlot, SwapyItem, DragHandle } from '../../components/ui/swapy-draggable-card';
import type { AdminDashboardStats } from '../../types';

const SWAPY_CONFIG = { animation: 'dynamic' as const, autoScrollOnDrag: true };

// Zero-point: an empty platform is a true $0 / 0 / 0 / no-activity state.
// Every number is overwritten by the live /admin/dashboard-stats response the
// moment it arrives — the admin never sees fabricated growth figures.
const ZERO_POINT_STATE: AdminDashboardStats = {
  totalGmv: 0,
  payoutsSettled: 0,
  activeWorkersCount: 0,
  activeBusinessesCount: 0,
  platformHealth: { dbOnline: false, lastDbWriteAt: null },
  monthlyGrowth: [],
};

const formatUsd = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const Overview: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats>(ZERO_POINT_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
        setError(null);
      } else {
        setError(res.message || 'Failed to load dashboard stats');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once on mount.
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time: socket dashboard:update -> refetch (single source of truth).
  useEffect(() => {
    const socket = getSocket();
    const onDashboardUpdate = () => {
      setIsLive(true);
      fetchStats();
    };
    socket.on('dashboard:update', onDashboardUpdate);
    return () => {
      socket.off('dashboard:update', onDashboardUpdate);
    };
  }, [fetchStats]);

  const totalUsers = stats.activeWorkersCount + stats.activeBusinessesCount;
  const healthLabel = loading
    ? 'Checking…'
    : stats.platformHealth?.lastDbWriteAt
    ? 'Live • DB writing'
    : 'No data yet';

  return (
    <SwapyLayout
      id="admin-overview-bento"
      config={SWAPY_CONFIG}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5"
    >
      {/* Platform Master Control Header */}
      <SwapySlot id="admin-header" className="col-span-12 sm:col-span-2 lg:col-span-12" >
        <SwapyItem id="admin-header" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-moss-sage/90 border border-moss-sage text-ink-muted shadow-sm" />
          <div className="h-full p-6 rounded-3xl glass-panel border border-moss-primary/25 bg-gradient-to-r from-moss-sage via-paper-bg to-paper-bg flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-moss-primary uppercase tracking-wider">SuperAdmin Governance</span>
              <h1 className="text-2xl font-extrabold text-ink-text mt-1">Platform Master Control</h1>
              <p className="text-xs text-ink-muted mt-1">
                System status:{' '}
                <strong className={isLive && !loading ? 'text-moss-deep' : 'text-ink-muted'}>
                  {isLive && !loading ? 'Live' : 'Connecting…'}
                </strong>{' '}
                • Active GMV: <strong className="text-moss-deep">{formatUsd(stats.totalGmv)}</strong>
              </p>
              {error && <p className="text-xs text-moss-deep mt-1">{error}</p>}
            </div>
          </div>
        </SwapyItem>
      </SwapySlot>

      {/* Total Platform GMV */}
      <SwapySlot id="stat-gmv" className="col-span-12 sm:col-span-1 lg:col-span-4" >
        <SwapyItem id="stat-gmv" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard className="h-full" title="Total Platform GMV" value={formatUsd(stats.totalGmv)} subtitle="Escrow-locked task budgets" icon={DollarSign} color="purple" />
        </SwapyItem>
      </SwapySlot>

      {/* Payouts Settled */}
      <SwapySlot id="stat-payouts" className="col-span-12 sm:col-span-1 lg:col-span-4" >
        <SwapyItem id="stat-payouts" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard className="h-full" title="Payouts Settled" value={formatUsd(stats.payoutsSettled)} subtitle="Rewards released to workers" icon={BarChart3} color="emerald" />
        </SwapyItem>
      </SwapySlot>

      {/* Active Users */}
      <SwapySlot id="stat-users" className="col-span-12 sm:col-span-1 lg:col-span-4" >
        <SwapyItem id="stat-users" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard className="h-full" title="Active Users" value={loading ? '…' : String(totalUsers)} subtitle={`${stats.activeWorkersCount} Workers • ${stats.activeBusinessesCount} Businesses`} icon={Users} color="indigo" />
        </SwapyItem>
      </SwapySlot>

      {/* Platform Health */}
      <SwapySlot id="stat-health" className="col-span-12 sm:col-span-1 lg:col-span-4" >
        <SwapyItem id="stat-health" className="h-full" dragItemOpacity={70}>
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-paper-bg/80 border border-hairline shadow-sm" />
          <StatCard className="h-full" title="Platform Health" value={healthLabel} subtitle="Direct reward settlements" icon={ShieldCheck} color="amber" />
        </SwapyItem>
      </SwapySlot>

      {/* Live Platform Activity */}
      <SwapySlot id="live-activity" className="col-span-12 sm:col-span-2 lg:col-span-8" >
        <SwapyItem id="live-activity" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-moss-sage/90 border border-moss-sage text-ink-muted shadow-sm" />
          <div className="h-full p-6 rounded-3xl glass-panel border border-hairline space-y-4">
            <h3 className="text-sm font-bold text-ink-text flex items-center gap-2">
              <Activity className="w-4 h-4 text-moss-deep" /> Live Platform Activity
            </h3>
            {loading ? (
              <p className="text-xs text-ink-muted">Loading platform activity…</p>
            ) : stats.monthlyGrowth.filter((b) => b.workers > 0 || b.businesses > 0).length === 0 && stats.totalGmv === 0 ? (
              <p className="text-xs text-ink-muted">
                Zero-state: no platform activity yet. Cards above show $0 / 0 / no data until the
                first real registration, escrow deposit, or payout — then they update in real time.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {stats.monthlyGrowth.filter((b) => b.workers > 0 || b.businesses > 0).map((b) => (
                  <div key={b.month} className="p-4 rounded-2xl border border-hairline glass-panel">
                    <p className="text-xs font-bold text-ink-muted uppercase">{b.month}</p>
                    <p className="text-sm font-extrabold text-ink-text mt-1">{b.workers} workers</p>
                    <p className="text-sm font-extrabold text-moss-deep">{b.businesses} businesses</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SwapyItem>
      </SwapySlot>

      {/* Platform Ops */}
      <SwapySlot id="platform-ops" className="col-span-12 sm:col-span-2 lg:col-span-4" >
        <SwapyItem id="platform-ops" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-moss-sage/90 border border-moss-sage text-ink-muted shadow-sm" />
          <div className="h-full p-6 rounded-3xl glass-panel border border-hairline space-y-2">
            <h3 className="text-sm font-bold text-ink-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-moss-deep" /> Platform Ops
            </h3>
            <p className="text-xs text-ink-muted">
              {stats.platformHealth?.lastDbWriteAt
                ? `Last successful platform write: ${new Date(stats.platformHealth.lastDbWriteAt).toLocaleString()}.`
                : 'No platform writes yet — fresh platform, no activity.'}
            </p>
          </div>
        </SwapyItem>
      </SwapySlot>

      {/* Sidebar Section Shortcuts */}
      <SwapySlot id="shortcut-users" className="col-span-12 sm:col-span-1 lg:col-span-6" >
        <SwapyItem id="shortcut-users" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-moss-sage/90 border border-moss-sage text-ink-muted shadow-sm" />
          <ShortcutCard to="/admin/users" title="User Management" description="Moderate worker and business accounts platform-wide." icon={Users} variant="dark" />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-approvals" className="col-span-12 sm:col-span-1 lg:col-span-3" >
        <SwapyItem id="shortcut-approvals" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-moss-sage/90 border border-moss-sage text-ink-muted shadow-sm" />
          <ShortcutCard to="/admin/business-approvals" title="Business Approvals" description="Approve or reject pending business registrations." icon={ClipboardCheck} variant="dark" />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-task-oversight" className="col-span-12 sm:col-span-1 lg:col-span-3" >
        <SwapyItem id="shortcut-task-oversight" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-moss-sage/90 border border-moss-sage text-ink-muted shadow-sm" />
          <ShortcutCard to="/admin/tasks" title="Task Oversight" description="Inspect every task batch posted on the marketplace." icon={ListTodo} variant="dark" />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-submissions" className="col-span-12 sm:col-span-1 lg:col-span-3" >
        <SwapyItem id="shortcut-submissions" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-moss-sage/90 border border-moss-sage text-ink-muted shadow-sm" />
          <ShortcutCard to="/admin/submissions" title="Submission Logs" description="Audit submission records and proof of delivery." icon={CheckCircle2} variant="dark" />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-fraud" className="col-span-12 sm:col-span-1 lg:col-span-3" >
        <SwapyItem id="shortcut-fraud" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-moss-sage/90 border border-moss-sage text-ink-muted shadow-sm" />
          <ShortcutCard to="/admin/fraud" title="Fraud Detection" description="Review flagged activity and risky account patterns." icon={ShieldAlert} variant="dark" />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-analytics" className="col-span-12 sm:col-span-1 lg:col-span-3" >
        <SwapyItem id="shortcut-analytics" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-moss-sage/90 border border-moss-sage text-ink-muted shadow-sm" />
          <ShortcutCard to="/admin/reports" title="Platform Analytics" description="Charts for GMV, growth and settlement trends." icon={BarChart3} variant="dark" />
        </SwapyItem>
      </SwapySlot>
      <SwapySlot id="shortcut-settings" className="col-span-12 sm:col-span-2 lg:col-span-3" >
        <SwapyItem id="shortcut-settings" className="h-full">
          <DragHandle className="z-20 left-auto right-2 top-2 rounded-lg bg-moss-sage/90 border border-moss-sage text-ink-muted shadow-sm" />
          <ShortcutCard to="/admin/settings" title="Platform Settings" description="Configure platform-wide governance options." icon={Settings} variant="dark" />
        </SwapyItem>
      </SwapySlot>
    </SwapyLayout>
  );
};

export default Overview;
