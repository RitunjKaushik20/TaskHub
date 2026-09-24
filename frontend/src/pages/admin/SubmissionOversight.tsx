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
        <h1 className="text-2xl font-extrabold text-ink-text">Submission Logs & Dispute Oversight</h1>
        <p className="text-xs text-ink-muted">View all worker deliverable submissions and review override states.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl glass-panel border border-hairline">
        <table className="w-full text-left text-xs text-ink-muted">
          <thead className="bg-moss-sage text-ink-muted border-b border-hairline uppercase font-semibold">
            <tr>
              <th className="p-4">Submission ID</th>
              <th className="p-4">Task Title</th>
              <th className="p-4">Worker</th>
              <th className="p-4">Proof Link / File</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Reward</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted">
                  Loading submissions...
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted">
                  No worker submissions found in the system.
                </td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.id} className="hover:bg-paper-bg transition-colors">
                  <td className="p-4 font-mono text-ink-muted">{s.id}</td>
                  <td className="p-4 font-semibold text-ink-text max-w-xs truncate">{s.taskTitle}</td>
                  <td className="p-4 text-ink-muted">{s.workerName}</td>
                  <td className="p-4 text-moss-deep max-w-xs truncate">
                    {s.fileUrl ? (
                      <a
                        href={s.fileUrl.startsWith('http') ? s.fileUrl : `http://localhost:8000${s.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-moss-deep"
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
                  <td className="p-4 text-right font-bold text-moss-deep">{formatCurrency(s.rewardAmount)}</td>
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
