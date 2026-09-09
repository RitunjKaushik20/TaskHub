import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { tasksApi } from '../../api/tasks';
import type { Task } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency } from '../../lib/utils';

const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadMyTasks = async () => {
      try {
        const res = await tasksApi.getTasks();
        if (res.success && res.data) {
          // Filter tasks that are in progress or claimed
          const active = res.data.filter(
            (t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED' || t.status === 'SUBMITTED'
          );
          setTasks(active);
        }
      } catch (err) {
        console.warn('Could not load worker tasks:', err);
      }
    };
    loadMyTasks();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">My Active & Assigned Tasks</h1>
        <p className="text-xs text-slate-400">
          Track lifecycle progress for tasks you have accepted or submitted proof for.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel border border-slate-800 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Active Tasks Claimed</h3>
            <p className="text-xs text-slate-400 mt-1">
              You haven't claimed any tasks yet. Explore verified gigs in the marketplace to lock a seat and start earning!
            </p>
          </div>
          <Link
            to="/worker/tasks"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
          >
            Browse Available Tasks <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-3">
                  <StatusBadge status={task.status} />
                  <span className="text-xs text-brand-accent font-semibold">{task.category}</span>
                </div>
                <h3 className="text-base font-bold text-white">{task.title}</h3>
                <p className="text-xs text-slate-400">By {task.businessCompany || task.businessName || 'Business'}</p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Reward</span>
                  <span className="text-lg font-extrabold text-emerald-400">{formatCurrency(task.reward, task.currency)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/worker/chat"
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4 text-brand-500" /> Chat
                  </Link>

                  <Link
                    to="/worker/submissions"
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-4 h-4" /> Submit Proof
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
