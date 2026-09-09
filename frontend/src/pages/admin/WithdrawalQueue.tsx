import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import type { WithdrawalRequest } from '../../types';

const WithdrawalQueue: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  useEffect(() => {
    const loadWithdrawals = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.getWithdrawals();
        if (res.success && res.data) {
          setWithdrawals(res.data);
        }
      } catch (err) {
        console.warn('Failed to load admin withdrawals:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadWithdrawals();
  }, []);

  const handleProcess = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const res = await adminApi.processWithdrawal(id, action);
    if (res.success && res.data) {
      setWithdrawals(withdrawals.map((w) => (w.id === id ? res.data! : w)));
      toast.success(
        action === 'APPROVE' ? 'Withdrawal Approved & Paid Out!' : 'Withdrawal Rejected',
        `Request ${id} processed successfully.`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Worker Withdrawal Processing Queue</h1>
        <p className="text-xs text-slate-400">Approve worker cash-out requests to PayPal, bank wire, or crypto.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold">
            <tr>
              <th className="p-4">Request ID</th>
              <th className="p-4">Worker</th>
              <th className="p-4">Method & Account</th>
              <th className="p-4">Requested Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Loading withdrawal queue...
                </td>
              </tr>
            ) : withdrawals.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No withdrawal requests in queue.
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-4 font-mono text-slate-400">{w.id}</td>
                  <td className="p-4">
                    <span className="font-bold text-white block">{w.workerName || 'Worker'}</span>
                    <span className="text-[10px] text-slate-400">{w.workerEmail}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-200 block">{w.method}</span>
                    <span className="text-[10px] font-mono text-slate-400">{w.accountDetails}</span>
                  </td>
                  <td className="p-4 text-slate-400">{formatDate(w.createdAt)}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        w.status === 'COMPLETED' || w.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : w.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-white">{formatCurrency(w.amount)}</td>
                  <td className="p-4 text-right">
                    {w.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleProcess(w.id, 'APPROVE')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] shadow"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleProcess(w.id, 'REJECT')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-[10px]"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500">Processed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WithdrawalQueue;
