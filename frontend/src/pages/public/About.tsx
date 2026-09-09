import React from 'react';

const About: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-white">About TaskHub</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          We are on a mission to democratize global human work through transparent reward technology and modern RESTful architecture.
        </p>
      </div>

      <div className="p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
        <h2 className="text-2xl font-bold text-white">Built for Reliability & Trust</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          TaskHub was architected from the ground up to solve micro-tasking friction: slow worker payouts, opaque dispute resolution, and bad data quality for companies. Our platform integrates state-of-the-art role-based security, HTTPOnly JWT session control, and instant direct settlement.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
          <div>
            <span className="text-2xl font-extrabold text-brand-accent">120+</span>
            <p className="text-xs text-slate-400 mt-1">Countries Served</p>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-emerald-400">500,000+</span>
            <p className="text-xs text-slate-400 mt-1">Submissions Verified</p>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-indigo-400">99.9%</span>
            <p className="text-xs text-slate-400 mt-1">Platform Uptime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
