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
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DotGridField from '../../components/ui/dot-grid-field';

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
    color: 'from-moss-primary/10 to-moss-primary/10 text-moss-deep border-moss-sage',
  },
  {
    name: 'UX Research & Testing',
    desc: 'User testing flows, conversion heuristics, prototype feedback',
    icon: Eye,
    color: 'from-moss-primary/10 to-moss-primary/10 text-moss-deep border-moss-sage',
  },
  {
    name: 'Translation & Localization',
    desc: 'Bilingual API testing, dialect validation, linguistic QA',
    icon: Globe,
    color: 'from-moss-primary/10 to-moss-primary/10 text-moss-deep border-moss-sage',
  },
  {
    name: 'Software Engineering',
    desc: 'Code review audits, test-case writing, bug reproduction',
    icon: Code,
    color: 'from-moss-primary/10 to-moss-primary/10 text-moss-deep border-moss-sage',
  },
  {
    name: 'Lead Generation',
    desc: 'B2B enrichment, verified email discovery, competitive research',
    icon: Database,
    color: 'from-moss-sage/50 to-moss-sage/20 text-moss-deep border-moss-sage',
  },
  {
    name: 'Quality Assurance',
    desc: 'Cross-browser testing, edge-case validation, manual test runs',
    icon: FileCheck,
    color: 'from-moss-primary/10 to-moss-primary/10 text-moss-deep border-moss-sage',
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
      <section className="relative pt-4 pb-12 flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden">
        {/* Interactive Dot-Grid Background (subtle Mossy Hollow texture) */}
        {/* Wrapper intentionally receives pointer events so hover repulsion is
            scoped to the hero area; the canvas itself stays pointer-events:none */}
        <div aria-hidden className="absolute inset-0 z-0">
          <DotGridField className="absolute inset-0 h-full w-full" />
        </div>

        <div className="relative z-10 flex-1 space-y-6 max-w-2xl text-center lg:text-left">
          {/* Badge */}
          <Badge color="emerald" className="px-3.5 py-1 text-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-moss-deep" />
            The Premier Human Intelligence & Micro-Task Marketplace
          </Badge>

          {/* Fiverr Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-ink-text leading-tight font-sans">
            Find the right <span className="text-moss-deep">micro-work</span> for your AI, right now.
          </h1>

          <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
            Connect your project with verified global micro-taskers for RLHF data annotation, code audits, UX research, and instant direct settlements.
          </p>

          {/* Fiverr-Style Hero Search Bar (Light Theme) */}
          <form onSubmit={handleHeroSearch} className="relative w-full max-w-xl">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-ink-muted pointer-events-none" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search any gig (e.g. bounding box annotation, UX testing...)"
                className="w-full bg-paper-bg border-2 border-moss-sage hover:border-moss-primary text-ink-text placeholder:text-ink-muted/70 text-sm rounded-2xl pl-12 pr-28 py-3.5 focus:outline-none focus:ring-2 focus:ring-moss-primary/40 focus:border-moss-primary transition-all shadow-md"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-moss-primary hover:bg-moss-primary text-white font-extrabold text-xs shadow-md shadow-moss-primary/25 transition-all hover:scale-[1.02]"
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular Tag Pills */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
            <span className="text-ink-muted font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-moss-deep" /> Popular:
            </span>
            {POPULAR_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => navigate(`/browse?search=${encodeURIComponent(pill)}`)}
                className="px-3 py-1 rounded-full bg-paper-bg border border-hairline hover:border-moss-primary hover:text-moss-deep text-ink-text font-semibold text-[11px] transition-all shadow-xs"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Trust Proof Counter */}
          <div className="pt-6 border-t border-hairline grid grid-cols-3 gap-4 text-center lg:text-left">
            <div>
              <span className="text-xl font-black text-ink-text block">50,000+</span>
              <span className="text-xs text-ink-muted font-medium">Tasks Completed</span>
            </div>
            <div>
              <span className="text-xl font-black text-moss-deep block">99.8%</span>
              <span className="text-xs text-ink-muted font-medium">Quality Precision</span>
            </div>
            <div>
              <span className="text-xl font-black text-ink-text block">Instant</span>
              <span className="text-xs text-ink-muted font-medium">Direct Payouts</span>
            </div>
          </div>
        </div>

        {/* 3D Interactive Platform Features Showcase Card (Light Theme) */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative z-10 flex-1 w-full max-w-lg perspective-1000 cursor-pointer"
        >
          <div
            style={{
              transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
              transition: 'transform 0.1s ease-out',
            }}
            className="p-6 sm:p-7 rounded-3xl bg-paper-bg relative border border-hairline/90 shadow-xl space-y-4 overflow-hidden"
          >
            {/* Ambient Decorative Glow */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-moss-sage/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-moss-sage/50 rounded-full blur-3xl pointer-events-none" />

            {/* Showcase Header */}
            <div className="flex items-center justify-between border-b border-moss-sage/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-moss-primary animate-ping" />
                <span className="text-xs font-mono font-bold text-moss-deep uppercase tracking-wider">
                  Platform Showcase
                </span>
              </div>
              <span className="text-[10px] text-ink-muted font-mono px-2.5 py-0.5 rounded-full bg-paper-bg border border-hairline font-semibold">
                v2.0 Verified
              </span>
            </div>

            {/* Core Capability Cards */}
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-paper-bg border border-hairline flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-moss-sage border border-moss-sage flex items-center justify-center shrink-0 text-moss-deep">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-text">RLHF AI Annotation</span>
                    <span className="text-[9px] font-mono text-moss-deep font-bold bg-moss-sage px-1.5 py-0.5 rounded border border-moss-sage">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
                    Image segmentation, polygon bounding boxes, and prompt evaluations with instant deliverable validation.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-paper-bg border border-hairline flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-moss-sage border border-moss-sage flex items-center justify-center shrink-0 text-moss-deep">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-text">Live Socket.IO Messaging</span>
                    <span className="text-[9px] font-mono text-moss-deep font-bold bg-moss-sage px-1.5 py-0.5 rounded border border-moss-sage">
                      ATTACHMENTS
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
                    Instant poster-to-worker collaboration with drag-and-drop screenshot uploads and direct feedback.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-paper-bg border border-hairline flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-moss-sage border border-moss-sage flex items-center justify-center shrink-0 text-moss-deep">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-text">Multi-Currency Payouts (₹/$)</span>
                    <span className="text-[9px] font-mono text-moss-deep font-bold bg-moss-sage px-1.5 py-0.5 rounded border border-moss-sage">
                      0 ESCROW
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
                    Direct settlements in INR (₹) and USD ($) without deductions, commissions, or delay holds.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="pt-2 border-t border-moss-sage/60 flex items-center justify-between text-[11px] text-ink-muted font-medium">
              <span className="flex items-center gap-1.5 text-moss-deep font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-moss-deep" /> 4 Core Systems Active
              </span>
              <span className="text-ink-muted font-mono">TaskHub Engine Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Fiverr-Style Category Exploration Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-hairline pb-4">
          <div>
            <h2 className="text-2xl font-black text-ink-text">Explore Marketplace Categories</h2>
            <p className="text-xs text-ink-muted font-medium">Browse specialized micro-task services by technical domain</p>
          </div>
          <Link
            to="/browse"
            className="text-xs font-bold text-moss-deep hover:text-moss-deep flex items-center gap-1"
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
                className="group text-left p-5 rounded-2xl bg-paper-bg border border-hairline hover:border-moss-primary hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center border shadow-xs group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-moss-deep group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-text group-hover:text-moss-deep transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed line-clamp-2">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <h2 className="text-2xl font-black text-ink-text">Trending Micro-Gigs & Open Tasks</h2>
            <p className="text-xs text-ink-muted font-medium">High-yield micro-tasks ready for immediate claim & execution</p>
          </div>
          <Link
            to="/browse"
            className="text-xs font-bold text-moss-deep hover:text-moss-deep flex items-center gap-1"
          >
            View all open tasks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-paper-bg border border-hairline animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-paper-bg border border-hairline max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-moss-sage border border-moss-sage flex items-center justify-center mx-auto text-moss-deep">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink-text">No Marketplace Gigs Posted Yet</h3>
            <p className="text-xs text-ink-muted">
              Be the first business to log in and post verified micro-tasks for global human intelligence.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-moss-primary text-white font-bold text-xs shadow-md shadow-moss-primary/25"
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
      <section className="p-8 sm:p-12 rounded-3xl bg-paper-bg/70 border border-hairline space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-ink-text">How TaskHub Works</h2>
          <p className="text-xs text-ink-muted">
            A frictionless marketplace engine delivering quality human intelligence with direct worker settlements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-moss-sage border border-moss-sage flex items-center justify-center text-moss-deep font-extrabold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-ink-text">Post Verified Gigs</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Define your task specs, attach instructions, set worker seat limits, and specify rewards in ₹ or $.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-moss-sage border border-moss-sage flex items-center justify-center text-moss-deep font-extrabold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-ink-text">Workers Execute & Submit</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Workers claim open seats, collaborate via real-time chat with attachments, and submit deliverable proofs.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-moss-sage border border-moss-sage flex items-center justify-center text-moss-deep font-extrabold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-ink-text">Review & Instant Payout</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Business approves deliverables with a 1-5 quality rating. Rewards transfer immediately to worker earnings with zero escrow deduction.
            </p>
          </Card>
        </div>
      </section>

      {/* Fiverr-Style Call to Action (High-Contrast Banner) */}
      <section className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-moss-primary via-moss-primary to-moss-deep text-white text-center space-y-6 relative overflow-hidden shadow-xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-black text-white font-sans">
            Ready to get started with TaskHub?
          </h2>
          <p className="text-paper-bg text-sm font-medium">
            Whether you are training next-gen AI models or looking to earn money solving micro-tasks, TaskHub is your platform.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3.5 rounded-xl bg-paper-bg text-ink-text hover:bg-paper-bg font-extrabold text-sm shadow-lg transition-all hover:scale-[1.03]"
          >
            Create Free Account
          </Link>
          <Link
            to="/browse"
            className="px-8 py-3.5 rounded-xl bg-moss-deep/60 hover:bg-moss-deep/80 border border-white/20 text-white text-sm font-bold transition-colors"
          >
            Browse All Marketplace Gigs
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;