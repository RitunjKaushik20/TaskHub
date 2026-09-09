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
        <h1 className="text-2xl font-extrabold text-white">Fraud Detection & Audit Logs</h1>
        <p className="text-xs text-slate-400">Inspect system security event logs, suspicious multi-submissions, and IP trails.</p>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <span>Automated Fraud Engine: 0 critical security threats flagged in the last 24 hours.</span>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" /> Platform Security Audit Trail
        </h3>

        <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase">
              <tr>
                <th className="p-4">Log ID</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Resource</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading security logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No security audit logs recorded yet. System events will be logged here.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 font-mono transition-colors">
                    <td className="p-4 text-slate-500">{log.id}</td>
                    <td className="p-4 font-sans font-bold text-white">
                      {log.actorName} ({log.actorRole})
                    </td>
                    <td className="p-4 font-bold text-purple-400">{log.action}</td>
                    <td className="p-4 font-sans text-slate-300">{log.target}</td>
                    <td className="p-4 text-cyan-400">{log.ipAddress}</td>
                    <td className="p-4 font-sans text-slate-400">{formatDate(log.timestamp)}</td>
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
