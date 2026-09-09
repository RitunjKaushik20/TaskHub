import React from 'react';
import { CreditCard, DollarSign, ShieldCheck } from 'lucide-react';
import StatCard from '../../components/common/StatCard';

const Payments: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Platform Payment & Direct Reward Governance</h1>
        <p className="text-xs text-slate-400">Monitor total allocated rewards, direct payout distribution, and payout ledgers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Total Allocated Rewards" value="$12,450.00" icon={ShieldCheck} color="purple" />
        <StatCard title="Direct Settlements Processed" value="$2,142.50" icon={DollarSign} color="emerald" />
        <StatCard title="Total Worker Payouts" value="$40,707.50" icon={CreditCard} color="indigo" />
      </div>
    </div>
  );
};

export default Payments;
