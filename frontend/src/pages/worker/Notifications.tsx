import React from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const Notifications: React.FC = () => {
  const alerts = [
    {
      id: '1',
      title: 'Submission Approved & Funds Paid!',
      desc: 'Task Poster approved your proof for task: "Verify 200 B2B Sales Leads". $35.00 credited to earnings.',
      date: '2026-09-04T14:20:00Z',
      type: 'payout',
    },
    {
      id: '2',
      title: 'New Chat Message Received',
      desc: 'Task Poster sent a message regarding: "Translate Technical API Documentation".',
      date: '2026-09-02T10:15:00Z',
      type: 'message',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Worker Activity Alerts</h1>
        <p className="text-xs text-slate-400">Notifications regarding task approvals, chat threads, and payouts.</p>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {a.type === 'payout' ? <CheckCircle2 className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white">{a.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
              <span className="text-[10px] text-slate-500 mt-2 block">{formatDate(a.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
