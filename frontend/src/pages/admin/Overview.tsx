import React from 'react';
import { Users, DollarSign, ShieldCheck, BarChart3 } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const gmvData = [
  { month: 'May', gmv: 12000, rev: 600 },
  { month: 'Jun', gmv: 18500, rev: 925 },
  { month: 'Jul', gmv: 27000, rev: 1350 },
  { month: 'Aug', gmv: 34500, rev: 1725 },
  { month: 'Sep', gmv: 42850, rev: 2142.5 },
];

const Overview: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="p-6 rounded-3xl glass-panel border border-purple-500/30 bg-gradient-to-r from-purple-950/50 via-slate-900 to-dark-bg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">SuperAdmin Governance</span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Platform Master Control</h1>
          <p className="text-xs text-slate-400 mt-1">
            System status: <strong className="text-emerald-400">100% Operational</strong> • Active GMV: <strong className="text-white">$42,850.00</strong>
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Platform GMV" value="$42,850.00" trend={{ value: '+32%', isPositive: true }} icon={DollarSign} color="purple" />
        <StatCard title="Total Payouts Settled" value="$40,707.50" icon={BarChart3} color="emerald" />
        <StatCard title="Active Users" value="1,605" subtitle="1,420 Workers • 185 Businesses" icon={Users} color="indigo" />
        <StatCard title="Platform Health" value="100% Operational" subtitle="Direct reward settlements" icon={ShieldCheck} color="amber" />
      </div>

      {/* GMV Growth Chart */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUpIcon className="w-4 h-4 text-purple-400" /> Platform Gross Merchandise Volume (GMV) & Direct Settlements
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gmvData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="gmv" stroke="#a855f7" strokeWidth={3} name="GMV ($)" />
              <Line type="monotone" dataKey="rev" stroke="#10b981" strokeWidth={2} name="Settled Rewards ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

export default Overview;
