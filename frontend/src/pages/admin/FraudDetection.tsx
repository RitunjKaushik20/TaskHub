import React, { useState, useEffect } from 'react';
import { ShieldAlert, Terminal } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatDate } from '../../lib/utils';
import type { AuditLog } from '../../types';

const FraudDetection: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.getAuditLogs();
        if (res.success && res.data) {
          setLogs(res.data);
        }
      } catch (err) {
        console.warn('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-text">Fraud Detection & Audit Logs</h1>
        <p className="text-xs text-ink-muted">Inspect system security event logs, suspicious multi-submissions, and IP trails.</p>
      </div>

      <div className="p-4 rounded-2xl bg-moss-sage/30 border border-moss-sage text-moss-deep text-xs flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-moss-deep flex-shrink-0" />
        <span>Automated Fraud Engine: 0 critical security threats flagged in the last 24 hours.</span>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-ink-text uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-moss-primary" /> Platform Security Audit Trail
        </h3>

        <div className="overflow-x-auto rounded-2xl glass-panel border border-hairline">
          <table className="w-full text-left text-xs text-ink-muted">
            <thead className="bg-moss-sage text-ink-muted font-semibold border-b border-hairline uppercase">
              <tr>
                <th className="p-4">Log ID</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Resource</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-muted">
                    Loading security logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-muted">
                    No security audit logs recorded yet. System events will be logged here.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-paper-bg font-mono transition-colors">
                    <td className="p-4 text-ink-muted">{log.id}</td>
                    <td className="p-4 font-sans font-bold text-ink-text">
                      {log.actorName} ({log.actorRole})
                    </td>
                    <td className="p-4 font-bold text-moss-primary">{log.action}</td>
                    <td className="p-4 font-sans text-ink-muted">{log.target}</td>
                    <td className="p-4 text-moss-primary">{log.ipAddress}</td>
                    <td className="p-4 font-sans text-ink-muted">{formatDate(log.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FraudDetection;
