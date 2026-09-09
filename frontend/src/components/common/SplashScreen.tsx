import React from 'react';
import { Layers } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-bg text-slate-100">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-full bg-brand-500/20 animate-ping" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-accent p-0.5 shadow-2xl flex items-center justify-center">
          <div className="w-full h-full bg-dark-bg rounded-[14px] flex items-center justify-center">
            <Layers className="w-8 h-8 text-brand-500 animate-pulse" />
          </div>
        </div>
      </div>

      <h1 className="mt-6 text-2xl font-bold font-sans tracking-tight gradient-text">
        TaskHub
      </h1>
      <p className="mt-2 text-sm text-slate-400 font-sans animate-pulse">
        Hydrating session & marketplace data...
      </p>
    </div>
  );
};

export default SplashScreen;
