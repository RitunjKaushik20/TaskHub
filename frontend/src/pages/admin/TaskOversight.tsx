import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import type { Task } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency } from '../../lib/utils';

const TaskOversight: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.getTasks();
        if (res.success && res.data) {
          setTasks(res.data);
        }
      } catch (err) {
        console.warn('Failed to load admin tasks:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Platform Task Oversight</h1>
        <p className="text-xs text-slate-400">Monitor all active & closed tasks across businesses on TaskHub.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold">
            <tr>
              <th className="p-4">Task ID & Title</th>
              <th className="p-4">Business Poster</th>
              <th className="p-4">Category</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Reward / Seat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Loading platform tasks...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No tasks currently in the system.
                </td>
              </tr>
            ) : (
              tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-white block">{t.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{t.id}</span>
                  </td>
                  <td className="p-4 text-slate-300">{t.businessCompany || t.businessName || 'Business'}</td>
                  <td className="p-4 text-slate-400">{t.category}</td>
                  <td className="p-4">
                    <StatusBadge status={t.status} size="sm" />
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-400">{formatCurrency(t.reward)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskOversight;
