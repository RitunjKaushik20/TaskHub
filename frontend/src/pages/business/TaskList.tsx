import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, MessageSquare, Layers, Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { tasksApi } from '../../api/tasks';
import type { Task } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const toast = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const response = await tasksApi.getMyTasks();
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

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      const res = await tasksApi.deleteTask(taskToDelete.id);
      if (res.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
        toast.success('Task Batch Deleted', `Successfully deleted "${taskToDelete.title}".`);
        setTaskToDelete(null);
      } else {
        toast.error('Deletion Failed', res.message || 'Could not delete task batch.');
      }
    } catch (err: any) {
      toast.error('Error', err?.message || 'Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-text">Posted Task Batches</h1>
          <p className="text-xs text-ink-muted">Manage specs, inspect assigned worker counts, and open task chat threads.</p>
        </div>

        <Link
          to="/business/tasks/create"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-moss-deep to-moss-primary text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" /> Create New Task
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-2xl glass-panel border border-hairline animate-pulse h-24" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-3xl border border-hairline space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-moss-primary/10 border border-moss-primary/20 flex items-center justify-center mx-auto text-moss-primary">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-ink-text">No Task Batches Posted Yet</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            You haven't posted any micro-work tasks yet. Click below to create your first task batch for workers to execute!
          </p>
          <div className="pt-2">
            <Link
              to="/business/tasks/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-moss-deep to-moss-primary text-white font-bold text-xs shadow-lg"
            >
              <PlusCircle className="w-4 h-4" /> Post Your First Task
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl glass-panel border border-hairline flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-moss-sage"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-3">
                  <StatusBadge status={task.status} />
                  <span className="text-xs text-moss-deep font-semibold">{task.category}</span>
                  <span className="text-[10px] text-ink-muted">Difficulty: {task.difficulty}</span>
                </div>
                <h3 className="text-base font-bold text-ink-text">{task.title}</h3>
                <p className="text-xs text-ink-muted">
                  Assigned Workers: <strong className="text-moss-deep">{task.assignedWorkersCount}/{task.workerLimit}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-hairline">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-ink-muted uppercase block font-semibold">Reward / Worker</span>
                  <span className="text-lg font-extrabold text-moss-deep">{formatCurrency(task.reward, task.currency)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/business/tasks/${task.id}/chat`}
                    className="p-2.5 rounded-xl bg-moss-sage border border-hairline text-ink-text hover:bg-moss-sage text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-moss-primary" /> Chat
                  </Link>

                  <Link
                    to={`/business/tasks/${task.id}`}
                    className="px-4 py-2.5 rounded-xl bg-moss-primary hover:bg-moss-deep text-white font-bold text-xs transition-all"
                  >
                    Manage Specs
                  </Link>

                  <button
                    type="button"
                    onClick={() => setTaskToDelete(task)}
                    className="p-2.5 rounded-xl bg-moss-sage/30 hover:bg-moss-sage text-moss-deep border border-moss-deep/20 text-xs font-semibold flex items-center transition-all"
                    title="Delete Task Batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md p-6 bg-paper-bg border border-hairline rounded-3xl shadow-2xl space-y-5 text-ink-text">
            <button
              onClick={() => setTaskToDelete(null)}
              className="absolute top-4 right-4 p-1.5 text-ink-muted hover:text-ink-text rounded-full bg-moss-sage hover:bg-moss-sage transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-moss-sage/30 border border-moss-deep/30 flex items-center justify-center text-moss-deep mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-ink-text">Delete Task Batch?</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Are you sure you want to delete <span className="text-moss-deep font-semibold">"{taskToDelete.title}"</span>?
                This will permanently delete this task batch along with all associated submissions and messages.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-moss-sage hover:bg-moss-sage text-ink-text border border-hairline text-xs font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-moss-deep hover:bg-moss-deep text-white text-xs font-bold shadow-lg shadow-moss-deep/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;