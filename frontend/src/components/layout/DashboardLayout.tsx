import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
  LayoutDashboard,
  ListTodo,
  CheckCircle2,
  Send,
  MessageSquare,
  User,
  PlusCircle,
  CreditCard,
  BarChart3,
  Users,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface DashboardLayoutProps {
  role: 'WORKER' | 'BUSINESS' | 'ADMIN';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out', 'You have safely signed out.');
    navigate('/login');
  };

  const getNavigationLinks = () => {
    if (role === 'WORKER') {
      return [
        { name: 'Dashboard', path: '/worker', icon: LayoutDashboard },
        { name: 'Browse Tasks', path: '/worker/tasks', icon: ListTodo },
        { name: 'My Active Tasks', path: '/worker/my-tasks', icon: CheckCircle2 },
        { name: 'Submissions', path: '/worker/submissions', icon: Send },
        { name: 'Task Chat Threads', path: '/worker/chat', icon: MessageSquare },
        { name: 'Worker Profile', path: '/worker/profile', icon: User },
      ];
    }

    if (role === 'BUSINESS') {
      return [
        { name: 'Dashboard', path: '/business', icon: LayoutDashboard },
        { name: 'Manage Tasks', path: '/business/tasks', icon: ListTodo },
        { name: 'Post New Task', path: '/business/tasks/create', icon: PlusCircle },
        { name: 'Review Submissions', path: '/business/submissions', icon: CheckCircle2 },
        { name: 'Spending & Billing', path: '/business/payments', icon: CreditCard },
        { name: 'Business Profile', path: '/business/profile', icon: User },
      ];
    }

    // ADMIN
    return [
      { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'User Management', path: '/admin/users', icon: Users },
      { name: 'Business Approvals', path: '/admin/business-approvals', icon: ClipboardCheck },
      { name: 'Task Oversight', path: '/admin/tasks', icon: ListTodo },
      { name: 'Submission Logs', path: '/admin/submissions', icon: CheckCircle2 },
      { name: 'Fraud Detection', path: '/admin/fraud', icon: ShieldAlert },
      { name: 'Platform Analytics', path: '/admin/reports', icon: BarChart3 },
      { name: 'Platform Settings', path: '/admin/settings', icon: Settings },
    ];
  };

  const navLinks = getNavigationLinks();

  return (
    <div className="min-h-screen bg-paper-bg text-ink-text flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Desktop (Clean Light Theme) */}
        <aside className="hidden lg:flex flex-col w-64 bg-paper-bg border-r border-hairline/90 p-4 space-y-6 shadow-xs">
          <Link to="/" className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-moss-primary to-moss-deep p-0.5 shadow-sm">
              <div className="w-full h-full bg-paper-bg rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-moss-deep" />
              </div>
            </div>
            <span className="text-lg font-black text-ink-text tracking-tight">
              Task<span className="text-moss-deep">Hub</span>
            </span>
          </Link>

          {/* User Profile Card */}
          <Link
            to={role === 'BUSINESS' ? '/business/profile' : role === 'WORKER' ? '/worker/profile' : '/admin'}
            className="p-3 rounded-xl bg-paper-bg border border-hairline hover:border-moss-primary/50 transition-all flex items-center gap-3 group shadow-xs"
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border border-moss-primary/30 group-hover:scale-105 transition-transform"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-ink-text truncate group-hover:text-moss-deep transition-colors">{user?.name}</h4>
              <p className="text-[10px] font-extrabold text-moss-deep uppercase tracking-wider">{user?.role}</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-moss-primary text-white shadow-sm shadow-moss-primary/25'
                      : 'text-ink-muted hover:text-ink-text hover:bg-paper-bg'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-ink-muted'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-moss-deep hover:bg-moss-sage/30 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </aside>

        {/* Main Content Body */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-paper-bg">
          {/* Header Mobile */}
          <header className="lg:hidden bg-paper-bg border-b border-hairline px-4 py-3 flex items-center justify-between shadow-xs">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-moss-primary flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-ink-text">TaskHub ({role})</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-ink-muted hover:text-ink-text"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </header>

          {/* Mobile Drawer */}
          {sidebarOpen && (
            <div className="lg:hidden bg-paper-bg border-b border-hairline p-4 space-y-4 shadow-lg">
              <Link
                to={role === 'BUSINESS' ? '/business/profile' : role === 'WORKER' ? '/worker/profile' : '/admin'}
                onClick={() => setSidebarOpen(false)}
                className="p-3 rounded-xl bg-paper-bg border border-hairline flex items-center gap-3"
              >
                <img
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-ink-text">{user?.name}</h4>
                  <p className="text-[10px] font-bold text-moss-deep uppercase">{user?.role}</p>
                </div>
              </Link>

              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-ink-text hover:bg-paper-bg"
                  >
                    <link.icon className="w-4 h-4 text-ink-muted" />
                    {link.name}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 text-xs font-bold text-moss-deep hover:bg-moss-sage/30"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </nav>
            </div>
          )}

          {/* Child Page Outlet */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
