import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  Sparkles,
  CheckCircle2,
  Bot,
  Zap,
  ShieldCheck,
  TrendingUp,
  Layers,
  Code,
  Globe,
  Database,
  Eye,
  FileCheck,
  PlusCircle,
} from 'lucide-react';
import { tasksApi } from '../../api/tasks';
import type { Task } from '../../types';
import TaskCard from '../../components/common/TaskCard';

const POPULAR_PILLS = [
  'AI Annotation',
  'API Translation',
  'UX Testing',
  'Code Review',
  'Image Segmentation',
  'Lead Gen',
];

const CATEGORIES = [
  {
    name: 'AI & Data Annotation',
    desc: 'Image segmentation, RLHF evaluations, bounding boxes, NLP labels',
    icon: Bot,
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-200',
  },
  {
    name: 'UX Research & Testing',
    desc: 'User testing flows, conversion heuristics, prototype feedback',
    icon: Eye,
    color: 'from-purple-500/10 to-indigo-500/10 text-purple-700 border-purple-200',
  },
  {
    name: 'Translation & Localization',
    desc: 'Bilingual API testing, dialect validation, linguistic QA',
    icon: Globe,
    color: 'from-cyan-500/10 to-blue-500/10 text-cyan-700 border-cyan-200',
  },
  {
    name: 'Software Engineering',
    desc: 'Code review audits, test-case writing, bug reproduction',
    icon: Code,
    color: 'from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200',
  },
  {
    name: 'Lead Generation',
    desc: 'B2B enrichment, verified email discovery, competitive research',
    icon: Database,
    color: 'from-rose-500/10 to-pink-500/10 text-rose-700 border-rose-200',
  },
  {
    name: 'Quality Assurance',
    desc: 'Cross-browser testing, edge-case validation, manual test runs',
    icon: FileCheck,
    color: 'from-teal-500/10 to-emerald-500/10 text-teal-700 border-teal-200',
  },
];

const Home: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [heroSearch, setHeroSearch] = useState('');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const response = await tasksApi.getTasks();
        if (response.success && response.data) {
          setTasks(response.data);
        } else {
          setTasks([]);
        }
      } catch {
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/browse?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 15, y: y * -15 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-20 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Fiverr-Style Hero Section (Clean Light Theme) */}
      <section className="relative pt-4 pb-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1 space-y-6 max-w-2xl text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            The Premier Human Intelligence & Micro-Task Marketplace
          </div>

          {/* Fiverr Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight font-sans">
            Find the right <span className="text-emerald-600">micro-work</span> for your AI, right now.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Connect your project with verified global micro-taskers for RLHF data annotation, code audits, UX research, and instant direct settlements.
          </p>

          {/* Fiverr-Style Hero Search Bar (Light Theme) */}
          <form onSubmit={handleHeroSearch} className="relative w-full max-w-xl">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search any gig (e.g. bounding box annotation, UX testing...)"
                className="w-full bg-white border-2 border-slate-300 hover:border-emerald-500 text-slate-900 placeholder:text-slate-400 text-sm rounded-2xl pl-12 pr-28 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-md"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular Tag Pills */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Popular:
            </span>
            {POPULAR_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => navigate(`/browse?search=${encodeURIComponent(pill)}`)}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 font-semibold text-[11px] transition-all shadow-xs"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Trust Proof Counter */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center lg:text-left">
            <div>
              <span className="text-xl font-black text-slate-900 block">50,000+</span>
              <span className="text-xs text-slate-500 font-medium">Tasks Completed</span>
            </div>
            <div>
              <span className="text-xl font-black text-emerald-600 block">99.8%</span>
              <span className="text-xs text-slate-500 font-medium">Quality Precision</span>
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 block">Instant</span>
              <span className="text-xs text-slate-500 font-medium">Direct Payouts</span>
            </div>
          </div>
        </div>

        {/* 3D Interactive Platform Features Showcase Card (Light Theme) */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="flex-1 w-full max-w-lg perspective-1000 cursor-pointer"
        >
          <div
            style={{
              transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
              transition: 'transform 0.1s ease-out',
            }}
            className="p-6 sm:p-7 rounded-3xl bg-white relative border border-slate-200/90 shadow-xl space-y-4 overflow-hidden"
          >
            {/* Ambient Decorative Glow */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />

            {/* Showcase Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
                  Platform Showcase
                </span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-semibold">
                v2.0 Verified
              </span>
            </div>

            {/* Core Capability Cards */}
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">RLHF AI Annotation</span>
                    <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Image segmentation, polygon bounding boxes, and prompt evaluations with instant deliverable validation.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0 text-teal-700">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Live Socket.IO Messaging</span>
                    <span className="text-[9px] font-mono text-teal-700 font-bold bg-teal-100 px-1.5 py-0.5 rounded border border-teal-200">
                      ATTACHMENTS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Instant poster-to-worker collaboration with drag-and-drop screenshot uploads and direct feedback.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Multi-Currency Payouts (₹/$)</span>
                    <span className="text-[9px] font-mono text-indigo-700 font-bold bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">
                      0 ESCROW
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Direct settlements in INR (₹) and USD ($) without deductions, commissions, or delay holds.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 4 Core Systems Active
              </span>
              <span className="text-slate-400 font-mono">TaskHub Engine Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Fiverr-Style Category Exploration Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Explore Marketplace Categories</h2>
            <p className="text-xs text-slate-500 font-medium">Browse specialized micro-task services by technical domain</p>
          </div>
          <Link
            to="/browse"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-600 flex items-center gap-1"
          >
            All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => navigate(`/browse?category=${encodeURIComponent(cat.name)}`)}
                className="group text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center border shadow-xs group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {cat.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Micro-Gigs / Tasks (Fiverr Gig Cards) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Trending Micro-Gigs & Open Tasks</h2>
            <p className="text-xs text-slate-500 font-medium">High-yield micro-tasks ready for immediate claim & execution</p>
          </div>
          <Link
            to="/browse"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-600 flex items-center gap-1"
          >
            View all open tasks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Marketplace Gigs Posted Yet</h3>
            <p className="text-xs text-slate-500">
              Be the first business to log in and post verified micro-tasks for global human intelligence.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                <PlusCircle className="w-4 h-4" /> Post a Gig as Business
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.slice(0, 6).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      {/* Fiverr-Style 3-Step Process (Light Theme) */}
      <section className="p-8 sm:p-12 rounded-3xl bg-slate-100/70 border border-slate-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">How TaskHub Works</h2>
          <p className="text-xs text-slate-600">
            A frictionless marketplace engine delivering quality human intelligence with direct worker settlements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">Post Verified Gigs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Define your task specs, attach instructions, set worker seat limits, and specify rewards in ₹ or $.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 font-extrabold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">Workers Execute & Submit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Workers claim open seats, collaborate via real-time chat with attachments, and submit deliverable proofs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">Review & Instant Payout</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Business approves deliverables with a 1-5 quality rating. Rewards transfer immediately to worker earnings with zero escrow deduction.
            </p>
          </div>
        </div>
      </section>

      {/* Fiverr-Style Call to Action (High-Contrast Banner) */}
      <section className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-center space-y-6 relative overflow-hidden shadow-xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-black text-white font-sans">
            Ready to get started with TaskHub?
          </h2>
          <p className="text-emerald-50 text-sm font-medium">
            Whether you are training next-gen AI models or looking to earn money solving micro-tasks, TaskHub is your platform.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3.5 rounded-xl bg-white text-slate-950 hover:bg-slate-50 font-extrabold text-sm shadow-lg transition-all hover:scale-[1.03]"
          >
            Create Free Account
          </Link>
          <Link
            to="/browse"
            className="px-8 py-3.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-800/80 border border-white/20 text-white text-sm font-bold transition-colors"
          >
            Browse All Marketplace Gigs
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;