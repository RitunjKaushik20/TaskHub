import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, ArrowRight } from 'lucide-react';

const ForBusinesses: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs font-semibold text-brand-accent px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20">
          Scale Human Intelligence Workflows
        </span>
        <h1 className="text-4xl font-extrabold text-white">TaskHub for Enterprise & AI Labs</h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto">
          Deploy thousands of micro-tasks in minutes. From RLHF prompt evaluation to image segmentation and usability research — pay only for approved output.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <ShieldCheck className="w-8 h-8 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Direct Reward Protection</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your reward funds remain safely protected until you verify work quality. Reject substandard submissions with clear feedback.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <Zap className="w-8 h-8 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Instant Global Workforce Scale</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access thousands of active workers across 120+ countries ready to start data collection within seconds of posting.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-sm shadow-xl"
        >
          Register as Business Poster <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default ForBusinesses;
