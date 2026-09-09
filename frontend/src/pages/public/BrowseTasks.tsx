import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  PlusCircle,
  Layers,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { tasksApi } from '../../api/tasks';
import type { Task } from '../../types';
import TaskCard from '../../components/common/TaskCard';

const CATEGORIES = [
  'ALL',
  'AI & Data Annotation',
  'UX Research',
  'Translation & Localization',
  'Software Engineering',
  'Lead Generation',
  'Quality Assurance',
];

const DIFFICULTIES: { label: string; value: string }[] = [
  { label: 'All Difficulties', value: 'ALL' },
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
  { label: 'Expert', value: 'EXPERT' },
];

const BUDGET_RANGES = [
  { label: 'All Budgets', value: 'ALL' },
  { label: 'Under ₹500 / $10', value: 'UNDER_500' },
  { label: '₹500 - ₹1,500 / $10 - $20', value: '500_1500' },
  { label: '₹1,500+ / $20+', value: 'OVER_1500' },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'NEWEST' },
  { label: 'Highest Reward', value: 'REWARD_HIGH' },
  { label: 'Lowest Reward', value: 'REWARD_LOW' },
  { label: 'Most Seats Open', value: 'SEATS_OPEN' },
];

const BrowseTasks: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state initialized from URL query params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'ALL'
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(
    searchParams.get('difficulty') || 'ALL'
  );
  const [selectedBudget, setSelectedBudget] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST');

  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null) {
      setSearch(urlSearch);
    }
  }, [searchParams]);

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

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('ALL');
    setSelectedDifficulty('ALL');
    setSelectedBudget('ALL');
    setSelectedCurrency('ALL');
    setSortBy('NEWEST');
    setSearchParams({});
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'ALL' ||
    selectedDifficulty !== 'ALL' ||
    selectedBudget !== 'ALL' ||
    selectedCurrency !== 'ALL';

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const query = search.toLowerCase().trim();
        const matchesSearch =
          !query ||
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          (Array.isArray(task.requiredSkills)
            ? task.requiredSkills.some((s) => s.toLowerCase().includes(query))
            : String(task.requiredSkills).toLowerCase().includes(query));

        const matchesCategory =
          selectedCategory === 'ALL' || task.category === selectedCategory;

        const matchesDifficulty =
          selectedDifficulty === 'ALL' || task.difficulty === selectedDifficulty;

        const matchesCurrency =
          selectedCurrency === 'ALL' || (task.currency || 'USD') === selectedCurrency;

        let matchesBudget = true;
        if (selectedBudget === 'UNDER_500') {
          matchesBudget = task.reward < 500;
        } else if (selectedBudget === '500_1500') {
          matchesBudget = task.reward >= 500 && task.reward <= 1500;
        } else if (selectedBudget === 'OVER_1500') {
          matchesBudget = task.reward > 1500;
        }

        return (
          matchesSearch &&
          matchesCategory &&
          matchesDifficulty &&
          matchesCurrency &&
          matchesBudget
        );
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'REWARD_HIGH') {
          return b.reward - a.reward;
        }
        if (sortBy === 'REWARD_LOW') {
          return a.reward - b.reward;
        }
        if (sortBy === 'SEATS_OPEN') {
          const aOpen = a.workerLimit - a.assignedWorkersCount;
          const bOpen = b.workerLimit - b.assignedWorkersCount;
          return bOpen - aOpen;
        }
        return 0;
      });
  }, [
    tasks,
    search,
    selectedCategory,
    selectedDifficulty,
    selectedBudget,
    selectedCurrency,
    sortBy,
  ]);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Breadcrumb */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-emerald-700 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Marketplace Tasks</span>
          {selectedCategory !== 'ALL' && (
            <>
              <span>/</span>
              <span className="text-emerald-700 font-bold">{selectedCategory}</span>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {selectedCategory === 'ALL'
                ? 'Explore All Micro-Gigs'
                : selectedCategory}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Find verified micro-tasks, RLHF datasets, and technical projects ready for execution.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="font-extrabold text-slate-900">{filteredTasks.length}</span>
            <span>services available</span>
          </div>
        </div>
      </div>

      {/* Fiverr-Style Multi-Facet Filter & Sorting Bar (Light Theme) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
        {/* Top Row: Search + Sort Dropdown */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gigs by title, keywords, or required skills..."
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs rounded-xl !pl-11 !pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" /> Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs font-medium"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 shadow-xs font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">
              Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 shadow-xs font-medium"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">
              Budget Range
            </label>
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 shadow-xs font-medium"
            >
              {BUDGET_RANGES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">
              Currency
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 shadow-xs font-medium"
            >
              <option value="ALL">All Currencies</option>
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 text-[11px] font-bold">Active Filters:</span>
            {selectedCategory !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('ALL')}>
                  <X className="w-3 h-3 text-emerald-600" />
                </button>
              </span>
            )}
            {selectedDifficulty !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
                {selectedDifficulty}
                <button onClick={() => setSelectedDifficulty('ALL')}>
                  <X className="w-3 h-3 text-purple-600" />
                </button>
              </span>
            )}
            {selectedBudget !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 text-[11px] font-semibold">
                {BUDGET_RANGES.find((b) => b.value === selectedBudget)?.label}
                <button onClick={() => setSelectedBudget('ALL')}>
                  <X className="w-3 h-3 text-cyan-600" />
                </button>
              </span>
            )}
            {selectedCurrency !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                {selectedCurrency}
                <button onClick={() => setSelectedCurrency('ALL')}>
                  <X className="w-3 h-3 text-amber-600" />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-semibold">
                "{search}"
                <button onClick={() => setSearch('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearFilters}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 ml-auto font-bold"
            >
              <RotateCcw className="w-3 h-3" /> Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Task Listings Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-white border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Matching Gigs Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            We couldn't find any tasks matching your selected filters. Try broadening your criteria or reset the filters.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Reset Filters
              </button>
            )}
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" /> Post a Task as Business
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseTasks;