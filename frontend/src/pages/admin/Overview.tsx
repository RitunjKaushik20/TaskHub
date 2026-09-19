import React, { useCallback, useEffect, useState } from 'react';
import { DollarSign, Users, ShieldCheck, BarChart3, Activity, TrendingUp } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { adminApi } from '../../api/admin';
import { getSocket } from '../../lib/socket';
import type { AdminDashboardStats } from '../../types';

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
    <div className="space-y-8">
      <div className="p-6 rounded-3xl glass-panel border border-purple-500/30 bg-gradient-to-r from-purple-950/50 via-slate-900 to-dark-bg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">SuperAdmin Governance</span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Platform Master Control</h1>
          <p className="text-xs text-slate-400 mt-1">
            System status:{' '}
            <strong className={isLive && !loading ? 'text-emerald-400' : 'text-slate-300'}>
              {isLive && !loading ? 'Live' : 'Connecting…'}
            </strong>{' '}
            • Active GMV: <strong className="text-white">{formatUsd(stats.totalGmv)}</strong>
          </p>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Platform GMV" value={formatUsd(stats.totalGmv)} subtitle="Escrow-locked task budgets" icon={DollarSign} color="purple" />
        <StatCard title="Payouts Settled" value={formatUsd(stats.payoutsSettled)} subtitle="Rewards released to workers" icon={BarChart3} color="emerald" />
        <StatCard title="Active Users" value={loading ? '…' : String(totalUsers)} subtitle={`${stats.activeWorkersCount} Workers • ${stats.activeBusinessesCount} Businesses`} icon={Users} color="indigo" />
        <StatCard title="Platform Health" value={healthLabel} subtitle="Direct reward settlements" icon={ShieldCheck} color="amber" />
      </div>

      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> Live Platform Activity
        </h3>
        {loading ? (
          <p className="text-xs text-slate-400">Loading platform activity…</p>
        ) : stats.monthlyGrowth.filter((b) => b.workers > 0 || b.businesses > 0).length === 0 && stats.totalGmv === 0 ? (
          <p className="text-xs text-slate-400">
            Zero-state: no platform activity yet. Cards above show $0 / 0 / no data until the
            first real registration, escrow deposit, or payout — then they update in real time.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stats.monthlyGrowth.filter((b) => b.workers > 0 || b.businesses > 0).map((b) => (
              <div key={b.month} className="p-4 rounded-2xl border border-slate-800 glass-panel">
                <p className="text-xs font-bold text-slate-400 uppercase">{b.month}</p>
                <p className="text-sm font-extrabold text-white mt-1">{b.workers} workers</p>
                <p className="text-sm font-extrabold text-indigo-300">{b.businesses} businesses</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Platform Ops
        </h3>
        <p className="text-xs text-slate-400">
          {stats.platformHealth?.lastDbWriteAt
            ? `Last successful platform write: ${new Date(stats.platformHealth.lastDbWriteAt).toLocaleString()}.`
            : 'No platform writes yet — fresh platform, no activity.'}
        </p>
      </div>
    </div>
  );
};

export default Overview;
