import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users } from 'lucide-react';

const analyticsData = [
  { month: 'May', workers: 450, businesses: 40 },
  { month: 'Jun', workers: 720, businesses: 85 },
  { month: 'Jul', workers: 980, businesses: 120 },
  { month: 'Aug', workers: 1240, businesses: 155 },
  { month: 'Sep', workers: 1420, businesses: 185 },
];

const ReportsAnalytics: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Platform System Analytics</h1>
        <p className="text-xs text-slate-400">Recharts reporting on marketplace registration growth curves.</p>
      </div>

      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-accent" /> Active User Registration Growth (Workers vs Businesses)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="workers" fill="#10b981" radius={[6, 6, 0, 0]} name="Workers" />
              <Bar dataKey="businesses" fill="#6366f1" radius={[6, 6, 0, 0]} name="Businesses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
