import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Ban,
  ShieldCheck,
  History,
  Loader2,
  Globe,
  Users,
  Layers,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import type { BusinessApprovalItem, AdminApprovalLogEntry, ApprovalStatus } from '../../types';
import { useToast } from '../../context/ToastContext';

type ApprovalAction = 'APPROVE' | 'REJECT' | 'SUSPEND';

const STATUS_BADGE: Record<ApprovalStatus, { label: string; classes: string }> = {
  PENDING: { label: 'PENDING', classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/30' },
  APPROVED: { label: 'APPROVED', classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' },
  REJECTED: { label: 'REJECTED', classes: 'bg-rose-500/10 text-rose-400 border border-rose-500/30' },
  SUSPENDED: { label: 'SUSPENDED', classes: 'bg-orange-500/10 text-orange-400 border border-orange-500/30' },
};

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;

const BusinessApprovals: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessApprovalItem[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<BusinessApprovalItem | null>(null);
  const [history, setHistory] = useState<AdminApprovalLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [actionReason, setActionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<false | ApprovalAction>(false);
  const toast = useToast();

  const loadBusinesses = async (currentFilter = filter) => {
    setIsLoading(true);
    try {
      const res = await adminApi.getBusinessApprovals(currentFilter === 'ALL' ? undefined : currentFilter);
      if (res.success && res.data) {
        setBusinesses(res.data);
      }
    } catch (err) {
      console.warn('Failed to load business approvals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (value: string) => {
    setFilter(value);
    loadBusinesses(value);
  };

  const openReview = async (business: BusinessApprovalItem) => {
    setSelected(business);
    setActionReason('');
    setHistoryLoading(true);
    try {
      const res = await adminApi.getBusinessApprovalHistory(business.id);
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.warn('Failed to load approval history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const confirmAction = async (action: ApprovalAction) => {
    if (!selected) return;
    if (action !== 'APPROVE' && !actionReason.trim()) {
      toast.error('Reason Required', 'Provide a reason for rejecting/suspending this business.');
      return;
    }
    setIsSubmitting(action);
    const res = await adminApi.updateBusinessApproval(selected.id, action, actionReason.trim() || undefined);
    setIsSubmitting(false);
    if (res.success) {
      toast.success('Approval Updated', `Business ${selected.companyName || selected.name} set to ${action}.`);
      const updated = { ...selected, approvalStatus: res.data?.approvalStatus || selected.approvalStatus };
      setSelected(null);
      setActionReason('');
      setBusinesses((prev) => prev.map((b) => (b.id === selected.id ? updated : b)));
    } else {
      toast.error('Update Failed', res.message || 'Could not update business approval status.');
    }
  };

  const pendingCount = businesses.filter((b) => b.approvalStatus === 'PENDING').length;

  const profile = selected?.companyProfile;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Business Account Approvals</h1>
        <p className="text-xs text-slate-400">
          Super Admin gate for business accounts. Approve to let companies publish tasks; reject or suspend to block them.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-purple-400" />
          Approval Queue ·{' '}
          <span className={pendingCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
            {pendingCount} pending
          </span>
        </span>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((v) => (
            <button
              key={v}
              onClick={() => handleFilter(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === v
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold">
            <tr>
              <th className="p-4">Business</th>
              <th className="p-4">Industry</th>
              <th className="p-4">KYC</th>
              <th className="p-4">Tasks</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Approval</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading business accounts...
                </td>
              </tr>
            ) : businesses.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No business accounts in this category.
                </td>
              </tr>
            ) : (
              businesses.map((b) => {
                const badge = STATUS_BADGE[b.approvalStatus];
                return (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {b.companyName || b.companyProfile?.companyName || b.name}
                      </div>
                      <div className="text-slate-500 text-[10px]">{b.email}</div>
                    </td>
                    <td className="p-4 text-slate-400">
                      {b.companyProfile?.industryType || '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          b.kycStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" /> {b.kycStatus}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{b.tasksCount}</td>
                    <td className="p-4 text-slate-400">{b.joinedDate}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openReview(b)}
                        className="px-3 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  {selected.companyName || profile?.companyName || selected.name}
                </h2>
                <p className="text-xs text-slate-400">{selected.email}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Industry
                </span>
                <p className="text-sm font-bold text-white mt-1">{profile?.industryType || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Users className="w-3 h-3" /> Team Size
                </span>
                <p className="text-sm font-bold text-white mt-1">{profile ? `${profile.companySize} people` : '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Website
                </span>
                <p className="text-sm font-bold text-white mt-1 break-all">
                  {profile?.websiteUrl || '—'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Services Needed</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(profile?.servicesNeeded || []).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-semibold">
                      {s}
                    </span>
                  ))}
                  {(!profile?.servicesNeeded || profile.servicesNeeded.length === 0) && (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Approval History</h3>
              </div>
              <div className="space-y-2">
                {historyLoading ? (
                  <p className="text-xs text-slate-500">Loading history...</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-slate-500">No approval actions recorded yet.</p>
                ) : (
                  history.map((h) => (
                    <div key={h.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="font-bold text-white">{h.action}</span>
                      <span className="text-slate-500 ml-2">
                        by {h.adminName} · {new Date(h.timestamp).toLocaleString()}
                      </span>
                      {h.reason && <p className="text-slate-400 mt-1">Reason: {h.reason}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Reason <span className="text-slate-500 font-normal">(required for reject / suspend)</span>
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Verification documents could not be confirmed..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => confirmAction('APPROVE')}
                  disabled={selected.approvalStatus === 'APPROVED' || isSubmitting !== false}
                  className="flex-1 min-w-[120px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting === 'APPROVE' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Approve
                </button>
                <button
                  onClick={() => confirmAction('REJECT')}
                  disabled={selected.approvalStatus === 'REJECTED' || isSubmitting !== false}
                  className="flex-1 min-w-[120px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting === 'REJECT' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Reject
                </button>
                <button
                  onClick={() => confirmAction('SUSPEND')}
                  disabled={selected.approvalStatus === 'SUSPENDED' || isSubmitting !== false}
                  className="flex-1 min-w-[120px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting === 'SUSPEND' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  Suspend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessApprovals;