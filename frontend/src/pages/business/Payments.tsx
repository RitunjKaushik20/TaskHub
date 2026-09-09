import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Layers } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { tasksApi } from '../../api/tasks';
import type { Task } from '../../types';
import { formatCurrency } from '../../lib/utils';
import StatusBadge from '../../components/common/StatusBadge';

const Payments: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      try {
        const res = await tasksApi.getTasks();
        if (res.success && res.data) {
          setTasks(res.data);
        } else {
          setTasks([]);
        }
      } catch {
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const totalAllocated = tasks.reduce((sum, t) => sum + (t.reward * t.workerLimit), 0);
  const totalApprovedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'APPROVED');
  const totalSettled = totalApprovedTasks.reduce((sum, t) => sum + (t.reward * t.assignedWorkersCount), 0);
  const activeBatchesCount = tasks.filter(t => t.status === 'AVAILABLE' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Business Rewards & Billing</h1>
        <p className="text-xs text-slate-400">Track task reward allocations, settlements, and platform ledgers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Allocated Reward Budget" value={formatCurrency(totalAllocated)} icon={ShieldCheck} color="purple" />
        <StatCard title="Total Payouts Settled" value={formatCurrency(totalSettled)} icon={CreditCard} color="emerald" />
        <StatCard title="Active Reward Batches" value={activeBatchesCount.toString()} icon={Layers} color="cyan" />
      </div>

      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Task Reward Allocation Ledger</h3>
        {isLoading ? (
          <div className="p-6 text-center text-xs text-slate-500 animate-pulse">Loading reward ledger...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400">No task reward allocations yet. Posted tasks will be listed here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase">
                <tr>
                  <th className="p-3">Task ID</th>
                  <th className="p-3">Task Batch</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Allocated Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono text-slate-400">{task.id.slice(0, 8)}...</td>
                    <td className="p-3 font-semibold text-white">{task.title}</td>
                    <td className="p-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="p-3 text-right font-extrabold text-white">
                      {formatCurrency(task.reward * task.workerLimit, task.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
