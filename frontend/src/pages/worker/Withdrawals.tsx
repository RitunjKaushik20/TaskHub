import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, DollarSign } from 'lucide-react';
import { withdrawalsApi } from '../../api/withdrawals';
import { walletApi } from '../../api/wallet';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import type { WithdrawalRequest, WalletSummary } from '../../types';

const withdrawalSchema = z.object({
  amount: z.number().min(1, 'Minimum withdrawal amount is $1.00'),
  method: z.enum(['PAYPAL', 'BANK_TRANSFER', 'CRYPTO_USDT']),
  accountDetails: z.string().min(3, 'Please provide valid account details'),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

const Withdrawals: React.FC = () => {
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRequest[]>([]);
  const [wallet, setWallet] = useState<WalletSummary>({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
  });
  const toast = useToast();

  const loadData = async () => {
    try {
      const [walletRes, withRes] = await Promise.all([
        walletApi.getWalletSummary(),
        withdrawalsApi.getWithdrawals(),
      ]);
      if (walletRes.success && walletRes.data) {
        setWallet(walletRes.data);
      }
      if (withRes.success && withRes.data) {
        setWithdrawalsList(withRes.data);
      }
    } catch (err) {
      console.warn('Error loading withdrawals/wallet:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 25.0,
      method: 'PAYPAL',
      accountDetails: 'alex.vance@worker.taskhub.io',
    },
  });

  const onSubmit = async (data: WithdrawalFormValues) => {
    if (data.amount > wallet.availableBalance) {
      toast.error(
        'Insufficient Balance',
        `Requested ${formatCurrency(data.amount)} exceeds available balance of ${formatCurrency(wallet.availableBalance)}.`
      );
      return;
    }

    const response = await withdrawalsApi.createWithdrawal({
      amount: data.amount,
      method: data.method,
      accountDetails: data.accountDetails,
    });

    if (response.success && response.data) {
      setWithdrawalsList([response.data, ...withdrawalsList]);
      setWallet((prev) => ({
        ...prev,
        availableBalance: prev.availableBalance - data.amount,
        totalWithdrawn: prev.totalWithdrawn + data.amount,
      }));
      toast.success(
        'Withdrawal Requested!',
        `Your payout request for ${formatCurrency(data.amount)} is pending approval.`
      );
      reset();
      loadData();
    } else {
      toast.error('Withdrawal Failed', response.message || 'Could not create withdrawal request');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Withdrawal Requests</h1>
        <p className="text-xs text-slate-400">Cash out your task earnings to PayPal, direct bank wire, or crypto.</p>
      </div>

      <div className="p-6 rounded-3xl glass-panel border border-emerald-500/30 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" /> Request Payout
          </h2>
          <span className="text-xs text-slate-300">
            Available:{' '}
            <strong className="text-emerald-400 font-bold">{formatCurrency(wallet.availableBalance)}</strong>
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Withdrawal Amount ($)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="50.00"
                  className="w-full glass-input pl-10 text-xs"
                />
              </div>
              {errors.amount && <p className="text-[10px] text-rose-400 mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payout Method</label>
              <select {...register('method')} className="w-full glass-input text-xs">
                <option value="PAYPAL">PayPal Payout</option>
                <option value="BANK_TRANSFER">Direct Wire / ACH Transfer</option>
                <option value="CRYPTO_USDT">USDT (TRC20 / ERC20)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Account Destination Details</label>
            <input
              type="text"
              {...register('accountDetails')}
              placeholder="e.g. PayPal email, IBAN account, or TRC20 address"
              className="w-full glass-input text-xs"
            />
            {errors.accountDetails && <p className="text-[10px] text-rose-400 mt-1">{errors.accountDetails.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Processing Request...' : 'Submit Payout Request'} <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Withdrawal History</h2>
        <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase">
              <tr>
                <th className="p-4">Request ID</th>
                <th className="p-4">Method</th>
                <th className="p-4">Account Details</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {withdrawalsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No withdrawal requests submitted yet. Payout requests will be tracked here.
                  </td>
                </tr>
              ) : (
                withdrawalsList.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-mono text-slate-400">{w.id}</td>
                    <td className="p-4 font-semibold text-slate-200">{w.method}</td>
                    <td className="p-4 text-slate-300">{w.accountDetails}</td>
                    <td className="p-4 text-slate-400">{formatDate(w.createdAt)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          w.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-white">{formatCurrency(w.amount)}</td>
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

export default Withdrawals;
