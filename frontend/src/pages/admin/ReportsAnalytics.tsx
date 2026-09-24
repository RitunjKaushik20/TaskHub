import React, { useCallback, useEffect, useState } from 'react';
import { TrendingUp, Users, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { adminApi } from '../../api/admin';
import { getSocket } from '../../lib/socket';
import type { AdminDashboardStats } from '../../types';

// Empty-platform default (a genuine zero-point, zero fabricated figures):
// no registrations, no revenue, no activity yet. Every number is overwritten
// by the live `/admin/dashboard-stats` response the moment it arrives.
const ZERO_POINT_STATE: AdminDashboardStats = {
  totalGmv: 0,
  payoutsSettled: 0,
  activeWorkersCount: 0,
  activeBusinessesCount: 0,
  platformHealth: { dbOnline: false, lastDbWriteAt: null },
  monthlyGrowth: [],
};

const ReportsAnalytics: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats>(ZERO_POINT_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
        setError(null);
      } else {
        setError(res?.message || 'Failed to load analytics');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time: backend emits `dashboard:update` over Socket.IO whenever a
  // worker/business registers, a business funds escrow, or a payout settles.
  // Single source of truth — refetch instead of trusting a local copy.
  useEffect(() => {
    const socket = getSocket();
    const onDashboardUpdate = () => fetchStats();
    socket.on('dashboard:update', onDashboardUpdate);
    return () => {
      socket.off('dashboard:update', onDashboardUpdate);
    };
  }, [fetchStats]);

  const growth = stats.monthlyGrowth.filter((b) => b.workers > 0 || b.businesses > 0);
  const isZeroState =
    stats.totalGmv === 0 &&
    stats.payoutsSettled === 0 &&
    stats.activeWorkersCount === 0 &&
    stats.activeBusinessesCount === 0;

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-xs text-moss-deep mb-4">Failed to load live reports: {error}</p>
      )}
      <div>
        <h1 className="text-2xl font-extrabold text-ink-text">Platform System Analytics</h1>
        <p className="text-xs text-ink-muted">
          Live registration growth reported from the database — zero fabricated figures.
        </p>
      </div>

      {/* Real registration growth (Workers vs Businesses, month over month) */}
      <div className="p-6 rounded-3xl glass-panel border border-hairline space-y-4">
        <h3 className="text-sm font-bold text-ink-text flex items-center gap-2">
          <Users className="w-4 h-4 text-moss-deep" /> Active User Registration Growth (Workers vs Businesses)
        </h3>
        {loading ? (
          <p className="text-xs text-ink-muted">Loading registration growth…</p>
        ) : isZeroState && growth.length === 0 ? (
          <p className="text-xs text-ink-muted">
            Zero-state: no workers or businesses have registered yet. The chart stays
            empty (a clean $0 / 0 platform) until the first real registration lands —
            then it appears here in real time via Socket.IO.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCDFC9" />
                <XAxis dataKey="month" stroke="#5C6152" fontSize={11} />
                <YAxis stroke="#5C6152" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FAFAF6', borderColor: '#DCDFC9', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="workers" fill="#636B2F" radius={[6, 6, 0, 0]} name="Workers" />
                <Bar dataKey="businesses" fill="#BAC095" radius={[6, 6, 0, 0]} name="Businesses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Platform ops health signal — real, never fabricated */}
      <div className="p-6 rounded-3xl glass-panel border border-hairline space-y-2">
        <h3 className="text-sm font-bold text-ink-text flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-moss-primary" /> Platform Operations
        </h3>
        <p className="text-xs text-ink-muted flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-moss-deep" />
          {stats.platformHealth?.lastDbWriteAt
            ? `Last successful platform DB write: ${new Date(stats.platformHealth.lastDbWriteAt).toLocaleString()}.`
            : 'No platform writes yet — a fresh, empty platform.'}
        </p>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
