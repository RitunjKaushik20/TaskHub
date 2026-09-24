import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SUB_CATEGORIES = [
  'AI & Data Annotation',
  'UX Research',
  'Translation & Localization',
  'Software Engineering',
  'Lead Generation',
  'Audio & Speech',
  'Quality Assurance',
];

const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      navigate(`/browse?search=${encodeURIComponent(headerSearch.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  const getDashboardPath = () => {
    if (user?.role === 'ADMIN') return '/admin';
    if (user?.role === 'BUSINESS') return '/business';
    return '/worker';
  };

  const getProfilePath = () => {
    if (user?.role === 'BUSINESS') return '/business/profile';
    return '/worker/profile';
  };

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper-bg text-ink-text selection:bg-moss-primary/20">
      {/* Top Primary Header (Fiverr Clean Light Style) */}
      <header className="sticky top-0 z-40 bg-paper-bg/95 backdrop-blur-md border-b border-hairline/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-moss-primary to-moss-deep p-0.5 shadow-md shadow-moss-primary/15 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-paper-bg rounded-[10px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-moss-deep" />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-xl font-black tracking-tight text-ink-text font-sans">
                Task<span className="text-moss-deep">Hub</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-moss-primary ml-0.5 inline-block" />
            </div>
          </Link>

          {/* Fiverr-Style Sleek Header Search Bar (Light Theme) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-4 relative items-center"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="What micro-task or service are you looking for?"
                className="w-full bg-paper-bg border border-moss-sage hover:border-moss-sage text-ink-text placeholder:text-ink-muted/70 text-xs rounded-xl pl-10 pr-24 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss-primary/40 focus:border-moss-primary transition-all shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-moss-primary hover:bg-moss-primary text-white font-bold text-xs transition-all shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold">
            <Link
              to="/browse"
              className={`hover:text-moss-deep transition-colors ${
                location.pathname === '/browse' ? 'text-moss-deep font-bold' : 'text-ink-muted'
              }`}
            >
              Explore Gigs
            </Link>
            <Link
              to="/how-it-works"
              className={`hover:text-moss-deep transition-colors ${
                location.pathname === '/how-it-works' ? 'text-moss-deep font-bold' : 'text-ink-muted'
              }`}
            >
              How It Works
            </Link>
            <Link
              to="/for-businesses"
              className={`hover:text-moss-deep transition-colors ${
                location.pathname === '/for-businesses' ? 'text-moss-deep font-bold' : 'text-ink-muted'
              }`}
            >
              For Businesses
            </Link>
            <Link
              to="/for-workers"
              className="text-moss-deep hover:text-moss-deep transition-colors flex items-center gap-1 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" /> Become a Worker
            </Link>
          </nav>

          {/* Auth Action Buttons or User Dropdown */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-paper-bg border border-hairline hover:border-moss-sage transition-all shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-moss-primary to-moss-primary flex items-center justify-center font-bold text-xs text-white shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left hidden md:block">
                    <span className="text-xs font-bold text-ink-text block truncate max-w-[100px]">
                      {user?.name || 'Account'}
                    </span>
                    <span className="text-[10px] font-mono text-moss-deep font-semibold block -mt-0.5">
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-52 rounded-2xl bg-paper-bg border border-hairline shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-4 py-2 border-b border-moss-sage/60">
                      <p className="text-xs font-bold text-ink-text truncate">{user?.name}</p>
                      <p className="text-[10px] text-ink-muted truncate">{user?.email}</p>
                    </div>

                    <div className="py-1 text-xs">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-ink-text hover:text-moss-deep hover:bg-paper-bg transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-moss-deep" />
                        Dashboard
                      </Link>
                      <Link
                        to={getProfilePath()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-ink-text hover:text-moss-deep hover:bg-paper-bg transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-moss-deep" />
                        My Profile
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-moss-sage/60">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-moss-deep hover:bg-moss-sage/30 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-ink-text hover:text-ink-text hover:bg-paper-bg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-moss-primary hover:bg-moss-primary text-white font-bold text-xs shadow-md shadow-moss-primary/25 transition-all hover:scale-[1.02]"
                >
                  Join TaskHub
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-ink-muted hover:text-ink-text hover:bg-paper-bg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Secondary Sub-Category Navigation Strip */}
        <div className="border-t border-hairline/80 bg-paper-bg/90 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 py-2.5 text-xs text-ink-muted whitespace-nowrap">
            {SUB_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => navigate(`/browse?category=${encodeURIComponent(cat)}`)}
                className="hover:text-moss-deep transition-colors relative py-0.5 group font-medium"
              >
                <span>{cat}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-moss-primary transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-paper-bg border-b border-hairline px-4 py-4 space-y-3 shadow-lg">
            <form onSubmit={handleSearchSubmit} className="relative pb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full bg-paper-bg border border-hairline text-xs rounded-xl pl-9 pr-3 py-2 text-ink-text placeholder:text-ink-muted/70"
              />
            </form>

            <Link
              to="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-ink-text hover:text-moss-deep py-1"
            >
              Explore Gigs
            </Link>
            <Link
              to="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-ink-text hover:text-moss-deep py-1"
            >
              How It Works
            </Link>
            <Link
              to="/for-businesses"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-ink-text hover:text-moss-deep py-1"
            >
              For Businesses
            </Link>
            <Link
              to="/for-workers"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-moss-deep py-1 font-bold"
            >
              Become a Worker
            </Link>

            <div className="pt-3 border-t border-moss-sage/60 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl bg-moss-primary font-bold text-white text-xs"
                  >
                    Go to Dashboard ({user?.role})
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-center py-2 rounded-xl bg-paper-bg text-moss-deep text-xs font-semibold"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 rounded-xl bg-paper-bg text-ink-text text-xs font-semibold"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 rounded-xl bg-moss-primary text-white text-xs font-bold shadow-md shadow-moss-primary/25"
                  >
                    Join TaskHub
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Clean High-Contrast Footer */}
      <footer className="bg-paper-bg border-t border-hairline text-ink-muted py-14 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-moss-primary flex items-center justify-center text-white font-black shadow-sm">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-ink-text">
                Task<span className="text-moss-deep">Hub</span>
              </span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              The world's leading micro-task marketplace connecting ambitious AI laboratories, researchers, and enterprises with verified human intelligence.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-moss-deep font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss-deep" /> 100% Direct Payouts Guaranteed
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-text mb-3">Categories</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/browse?category=AI%20%26%20Data%20Annotation" className="hover:text-moss-deep transition-colors">AI & Data Annotation</Link></li>
              <li><Link to="/browse?category=UX%20Research" className="hover:text-moss-deep transition-colors">UX Research & Usability</Link></li>
              <li><Link to="/browse?category=Translation%20%26%20Localization" className="hover:text-moss-deep transition-colors">Translation & Localization</Link></li>
              <li><Link to="/browse?category=Software%20Engineering" className="hover:text-moss-deep transition-colors">Software Engineering</Link></li>
              <li><Link to="/browse?category=Lead%20Generation" className="hover:text-moss-deep transition-colors">Lead Generation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-text mb-3">About & Community</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/how-it-works" className="hover:text-moss-deep transition-colors">How TaskHub Works</Link></li>
              <li><Link to="/for-workers" className="hover:text-moss-deep transition-colors">Become a Worker</Link></li>
              <li><Link to="/for-businesses" className="hover:text-moss-deep transition-colors">Post Work as Business</Link></li>
              <li><Link to="/about" className="hover:text-moss-deep transition-colors">About Us</Link></li>
              <li><Link to="/faq" className="hover:text-moss-deep transition-colors">Frequently Asked Questions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-text mb-3">Trust & Security</h4>
            <div className="p-3.5 rounded-2xl bg-paper-bg border border-hairline space-y-2 text-xs text-ink-muted shadow-sm">
              <p className="font-bold text-ink-text flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-moss-deep" /> Direct Settlement
              </p>
              <p className="text-[11px] leading-relaxed text-ink-muted">
                Rewards are credited immediately to worker balances upon deliverable approval with zero hidden deductions.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-moss-sage/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <p>© {new Date().getFullYear()} TaskHub Platform Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-medium text-ink-muted">Clean Light Theme</span>
            <span>•</span>
            <span>REST API & Socket.IO Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
