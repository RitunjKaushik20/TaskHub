import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Forbidden: React.FC = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (user?.role === 'ADMIN') return '/admin';
    if (user?.role === 'BUSINESS') return '/business';
    return '/worker';
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl glass-panel border border-moss-deep/30 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-moss-sage/30 border border-moss-deep/30 flex items-center justify-center mx-auto text-moss-deep">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-moss-deep">Error 403</span>
          <h1 className="text-2xl font-extrabold text-ink-text">Access Forbidden</h1>
          <p className="text-xs text-ink-muted">
            You do not have the required role permissions to view this endpoint or resource.
          </p>
        </div>

        {user && (
          <div className="p-3 rounded-xl bg-paper-bg border border-hairline text-xs text-ink-text">
            Logged in as: <strong className="text-moss-deep">{user.email}</strong> ({user.role})
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to={getDashboardPath()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-moss-deep hover:bg-moss-primary text-white font-bold text-xs shadow-lg transition-all"
          >
            Return to Dashboard
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-paper-bg border border-hairline text-ink-text hover:bg-moss-light/40 text-xs font-semibold"
          >
            Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
