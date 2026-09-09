import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import type { Submission } from '../../types';

const SubmissionOversight: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSubmissions = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.getSubmissions();
        if (res.success && res.data) {
          setSubmissions(res.data);
        }
      } catch (err) {
        console.warn('Failed to load admin submissions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubmissions();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Submission Logs & Dispute Oversight</h1>
        <p className="text-xs text-slate-400">View all worker deliverable submissions and review override states.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold">
            <tr>
              <th className="p-4">Submission ID</th>
              <th className="p-4">Task Title</th>
              <th className="p-4">Worker</th>
              <th className="p-4">Proof Link / File</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Reward</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Loading submissions...
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No worker submissions found in the system.
                </td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-4 font-mono text-slate-400">{s.id}</td>
                  <td className="p-4 font-semibold text-white max-w-xs truncate">{s.taskTitle}</td>
                  <td className="p-4 text-slate-300">{s.workerName}</td>
                  <td className="p-4 text-brand-accent max-w-xs truncate">
                    {s.fileUrl ? (
                      <a
                        href={s.fileUrl.startsWith('http') ? s.fileUrl : `http://localhost:8000${s.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-emerald-400"
                      >
                        File: {s.fileUrl}
                      </a>
                    ) : (
                      s.linkUrl || s.proofContent
                    )}
                  </td>
                  <td className="p-4">
                    <StatusBadge type="submission" status={s.status} size="sm" />
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-400">{formatCurrency(s.rewardAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionOversight;
