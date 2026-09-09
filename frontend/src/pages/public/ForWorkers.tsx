import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Wallet, ArrowRight } from 'lucide-react';

const ForWorkers: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs font-semibold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          Monetize Your Time & Expertise
        </span>
        <h1 className="text-4xl font-extrabold text-white">Earn Money Anywhere on TaskHub</h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto">
          Complete micro-gigs, data labeling, translation, and user research. Enjoy low withdrawal minimums and fast payouts to PayPal, Bank, or Crypto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <DollarSign className="w-8 h-8 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Fair & Guaranteed Earnings</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every task has guaranteed reward funds allocated before you start. Once your proof is verified, your total earnings update immediately.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <Wallet className="w-8 h-8 text-brand-accent" />
          <h3 className="text-lg font-bold text-white">Flexible Cash-Out Methods</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Withdraw your funds easily via PayPal, direct bank deposit, or USDT stablecoins with automated processing.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-bold text-sm shadow-xl"
        >
          Sign Up as a Worker <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default ForWorkers;
