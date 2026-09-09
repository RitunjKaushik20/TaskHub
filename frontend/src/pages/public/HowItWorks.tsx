import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Briefcase, ArrowRight } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WORKER' | 'BUSINESS'>('WORKER');

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-white">How TaskHub Marketplace Operates</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Explore the transparent lifecycle engineered for fast human micro-work, automated verification, and instant direct settlements.
        </p>
      </div>

      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('WORKER')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'WORKER'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" /> For Workers & Freelancers
          </button>
          <button
            onClick={() => setActiveTab('BUSINESS')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'BUSINESS'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" /> For Businesses & AI Labs
          </button>
        </div>
      </div>

      {activeTab === 'WORKER' ? (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-emerald-400">Step 1: Browse & Claim Task Seats</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Find micro-gigs matching your technical skills or background. Click "Accept Task" to lock a seat timer so no one else can steal your task slot while working.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-emerald-400">Step 2: Execute Instructions & Submit Proof</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Follow step-by-step instructions. Submit proof via file attachment, link URL, or text description using our secure submission portal.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-emerald-400">Step 3: Instant Direct Payout to Earnings</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Once approved by the business, task rewards instantly credit directly to your Total Earnings with zero platform deductions.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-indigo-400">Step 1: Set Reward Budget & Post Specs</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Create task batches specifying category, difficulty, reward per worker, and required proof formats. Reward budgets are committed directly.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-indigo-400">Step 2: Monitor Worker Execution & Chat</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Track worker progress in real time. Use dedicated per-task chat threads to answer questions and clarify edge cases.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-indigo-400">Step 3: Review, Grade & Export Data</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Review submitted proofs with 1-5 quality star ratings. Export structured JSON or CSV data ready for AI model training or business ops.
            </p>
          </div>
        </div>
      )}

      <div className="text-center pt-4">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-accent text-white font-bold text-sm shadow-xl"
        >
          Create Your TaskHub Account <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default HowItWorks;
