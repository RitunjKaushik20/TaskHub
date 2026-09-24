import React, { useState, useEffect } from 'react';
import { Search, Layers, Sparkles } from 'lucide-react';
import { tasksApi } from '../../api/tasks';
import type { Task } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import TaskCard from '../../components/common/TaskCard';

const AvailableTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [lockingId, setLockingId] = useState<string | null>(null);
  const toast = useToast();
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

  const handleAccept = async (taskId: string, title: string) => {
    setLockingId(taskId);
    try {
      const response = await tasksApi.acceptTask(taskId);
      if (response.success) {
        toast.success('Seat Locked!', `You claimed a seat for "${title}". Redirecting to active tasks.`);
        navigate('/worker/my-tasks');
      } else {
        toast.error('Accept Failed', response.message || 'Unable to lock seat for task.');
      }
    } catch {
      toast.error('Accept Failed', 'An error occurred while accepting the task.');
    } finally {
      setLockingId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const query = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-moss-sage text-moss-deep border border-moss-sage text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-moss-deep" /> Live Marketplace
          </div>
          <h1 className="text-2xl font-black text-ink-text">Available Marketplace Tasks</h1>
          <p className="text-xs text-ink-muted font-medium">
            Accept open tasks to lock worker seats, submit deliverable proofs, and receive instant payouts.
          </p>
        </div>

        <div className="text-xs text-ink-muted font-medium">
          <span className="font-extrabold text-moss-deep">{filteredTasks.length}</span> open tasks available
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted z-10 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter open tasks by title, category, or skills..."
          className="w-full bg-paper-bg border border-moss-sage text-ink-text placeholder:text-ink-muted/70 text-xs rounded-xl !pl-11 !pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss-primary/40 focus:border-moss-primary shadow-xs"
        />
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-paper-bg border border-hairline animate-pulse"
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-paper-bg border border-hairline space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-paper-bg flex items-center justify-center mx-auto text-ink-muted">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-ink-text">No Open Tasks Available</h3>
          <p className="text-xs text-ink-muted">
            Check back soon or wait for businesses to post new micro-gigs!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showAcceptButton={true}
              onAccept={handleAccept}
              isAccepting={lockingId === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableTasks;