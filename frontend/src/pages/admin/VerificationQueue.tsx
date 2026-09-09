import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import type { UserManagementItem } from '../../types';

const VerificationQueue: React.FC = () => {
  const [queue, setQueue] = useState<UserManagementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  useEffect(() => {
    const loadQueue = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.getUsers();
        if (res.success && res.data) {
          setQueue(res.data.filter((u) => u.kycStatus === 'PENDING'));
        }
      } catch (err) {
        console.warn('Failed to load verification queue:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadQueue();
  }, []);

  const handleApproveKYC = (id: string, name: string) => {
    setQueue(queue.filter((u) => u.id !== id));
    toast.success('KYC Approved!', `Worker ${name} verified successfully.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Identity Verification & KYC Queue</h1>
        <p className="text-xs text-slate-400">Review worker identity documents and company registration credentials.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading verification queue...</div>
      ) : queue.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel border border-slate-800 text-center space-y-3 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Pending KYC Submissions</h3>
            <p className="text-xs text-slate-400 mt-1">
              All active users on TaskHub have verified identity status. New documents submitted by workers will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((u) => (
            <div key={u.id} className="p-5 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">KYC Verification Pending</span>
                <h3 className="text-base font-bold text-white mt-0.5">{u.name}</h3>
                <p className="text-xs text-slate-400">{u.email} • Role: {u.role}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveKYC(u.id, u.name)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve KYC Document
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerificationQueue;
