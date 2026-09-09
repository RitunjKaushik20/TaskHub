import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { formatCurrency, formatDate } from '../../lib/utils';
import { walletApi } from '../../api/wallet';
import type { WalletSummary, Transaction } from '../../types';

const Wallet: React.FC = () => {
  const [wallet, setWallet] = useState<WalletSummary>({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const [sumRes, txRes] = await Promise.all([
          walletApi.getWalletSummary(),
          walletApi.getTransactions(),
        ]);
        if (sumRes.success && sumRes.data) {
          setWallet(sumRes.data);
        }
        if (txRes.success && txRes.data) {
          setTransactions(txRes.data);
        }
      } catch (err) {
        console.warn('Could not fetch wallet data:', err);
      }
    };
    fetchWallet();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Worker Earnings & Wallet</h1>
        <p className="text-xs text-slate-400">Manage your total earnings and transaction logs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Earnings"
          value={formatCurrency(wallet.totalEarned || wallet.availableBalance)}
          subtitle="Unlocked balance"
          icon={WalletIcon}
          color="emerald"
        />
        <StatCard
          title="Pending Review"
          value={formatCurrency(wallet.pendingBalance)}
          subtitle="Awaiting submission reviews"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Lifetime Earned"
          value={formatCurrency(wallet.totalEarned)}
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Total Withdrawn"
          value={formatCurrency(wallet.totalWithdrawn)}
          icon={CheckCircle2}
          color="cyan"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Transaction History</h2>
        <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase">
              <tr>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Description</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No transactions yet. Complete tasks to earn rewards!
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-mono text-slate-400">{tx.id}</td>
                    <td className="p-4 font-semibold text-slate-200">{tx.type}</td>
                    <td className="p-4 text-slate-300">{tx.description}</td>
                    <td className="p-4 text-slate-400">{formatDate(tx.createdAt)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-400">{formatCurrency(tx.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
