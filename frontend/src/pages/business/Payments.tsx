import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Layers } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { tasksApi } from '../../api/tasks';
import { walletApi } from '../../api/wallet';
import type { Task, WalletSummary } from '../../types';
import { formatCurrency } from '../../lib/utils';
import StatusBadge from '../../components/common/StatusBadge';

const Payments: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      try {
        const [res, walletRes] = await Promise.all([
          tasksApi.getMyTasks(),
          walletApi.getWalletSummary(),
        ]);
        if (res.success && res.data) {
          setTasks(res.data);
        } else {
          setTasks([]);
        }
        if (walletRes.success && walletRes.data) {
          setWalletSummary(walletRes.data);
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
  const totalSpending = walletSummary?.totalSpending ?? 0;
  const pendingPayout = walletSummary?.pendingPayout ?? 0;
  const activeBatchesCount = tasks.filter(t => t.status === 'AVAILABLE' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-text">Business Spending & Billing</h1>
        <p className="text-xs text-ink-muted">Track reward allocations and payments settled off-platform (no escrow). Payments are confirmed manually and counted live.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Allocated Reward Budget" value={formatCurrency(totalAllocated)} icon={ShieldCheck} color="purple" />
        <StatCard title="Total Spending (Paid)" value={formatCurrency(totalSpending)} subtitle={`${formatCurrency(pendingPayout)} approved & pending`} icon={CreditCard} color="emerald" />
        <StatCard title="Active Reward Batches" value={activeBatchesCount.toString()} icon={Layers} color="cyan" />
      </div>

      <div className="p-6 rounded-3xl glass-panel border border-hairline space-y-4">
        <h3 className="text-sm font-bold text-ink-text uppercase tracking-wider">Task Reward Allocation Ledger</h3>
        {isLoading ? (
          <div className="p-6 text-center text-xs text-ink-muted animate-pulse">Loading reward ledger...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Layers className="w-8 h-8 mx-auto text-ink-muted" />
            <p className="text-xs text-ink-muted">No task reward allocations yet. Posted tasks will be listed here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink-muted">
              <thead className="bg-moss-sage text-moss-deep border-b border-hairline uppercase">
                <tr>
                  <th className="p-3">Task ID</th>
                  <th className="p-3">Task Batch</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Allocated Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-paper-bg">
                    <td className="p-3 font-mono text-ink-muted">{task.id.slice(0, 8)}...</td>
                    <td className="p-3 font-semibold text-ink-text">{task.title}</td>
                    <td className="p-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="p-3 text-right font-extrabold text-ink-text">
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
