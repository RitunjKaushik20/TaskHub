import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl glass-panel border border-hairline text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-moss-primary/10 border border-moss-primary/30 flex items-center justify-center mx-auto text-moss-deep">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-moss-deep">Error 404</span>
          <h1 className="text-2xl font-extrabold text-ink-text">Page Not Found</h1>
          <p className="text-xs text-ink-muted">
            The marketplace route or resource you requested does not exist.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-moss-deep hover:bg-moss-primary text-white font-bold text-xs shadow-lg transition-all"
          >
            <Home className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
