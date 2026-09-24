import React from 'react';
import { Layers } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper-bg text-ink-text">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-full bg-moss-primary/15 animate-ping" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-moss-deep to-moss-primary p-0.5 shadow-2xl flex items-center justify-center">
          <div className="w-full h-full bg-paper-bg rounded-[14px] flex items-center justify-center">
            <Layers className="w-8 h-8 text-moss-primary animate-pulse" />
          </div>
        </div>
      </div>

      <h1 className="mt-6 text-2xl font-bold font-sans tracking-tight gradient-text">
        TaskHub
      </h1>
      <p className="mt-2 text-sm text-ink-muted font-sans animate-pulse">
        Hydrating session & marketplace data...
      </p>
    </div>
  );
};

export default SplashScreen;
