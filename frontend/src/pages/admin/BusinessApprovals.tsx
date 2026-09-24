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
  PENDING: { label: 'PENDING', classes: 'bg-moss-sage text-moss-deep border border-moss-sage' },
  APPROVED: { label: 'APPROVED', classes: 'bg-moss-primary/10 text-moss-deep border border-moss-primary/30' },
  REJECTED: { label: 'REJECTED', classes: 'bg-moss-sage/30 text-moss-deep border border-moss-deep/30' },
  SUSPENDED: { label: 'SUSPENDED', classes: 'bg-moss-sage/30 text-moss-deep border border-moss-sage' },
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
        <h1 className="text-2xl font-extrabold text-ink-text">Business Account Approvals</h1>
        <p className="text-xs text-ink-muted">
          Super Admin gate for business accounts. Approve to let companies publish tasks; reject or suspend to block them.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-hairline">
        <span className="text-xs font-semibold text-ink-muted flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-moss-primary" />
          Approval Queue ·{' '}
          <span className={pendingCount > 0 ? 'text-moss-primary font-bold' : 'text-ink-muted'}>
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
                  ? 'bg-moss-primary text-white shadow-md'
                  : 'bg-moss-sage text-ink-text hover:bg-moss-sage border border-hairline'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl glass-panel border border-hairline">
        <table className="w-full text-left text-xs text-ink-muted">
          <thead className="bg-moss-sage text-ink-muted border-b border-hairline uppercase font-semibold">
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
          <tbody className="divide-y divide-hairline">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-muted">
                  <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading business accounts...
                </td>
              </tr>
            ) : businesses.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-muted">
                  No business accounts in this category.
                </td>
              </tr>
            ) : (
              businesses.map((b) => {
                const badge = STATUS_BADGE[b.approvalStatus];
                return (
                  <tr key={b.id} className="hover:bg-paper-bg transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-ink-text flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-ink-muted" />
                        {b.companyName || b.companyProfile?.companyName || b.name}
                      </div>
                      <div className="text-ink-muted text-[10px]">{b.email}</div>
                    </td>
                    <td className="p-4 text-ink-muted">
                      {b.companyProfile?.industryType || '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          b.kycStatus === 'VERIFIED' ? 'text-moss-deep' : 'text-moss-primary'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" /> {b.kycStatus}
                      </span>
                    </td>
                    <td className="p-4 text-ink-muted">{b.tasksCount}</td>
                    <td className="p-4 text-ink-muted">{b.joinedDate}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openReview(b)}
                        className="px-3 py-1 rounded-lg text-[10px] font-bold bg-moss-sage text-ink-text hover:bg-moss-sage border border-hairline transition-all"
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
        <div className="fixed inset-0 z-50 bg-moss-deep/60 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-paper-bg border border-hairline shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-ink-text flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-moss-primary" />
                  {selected.companyName || profile?.companyName || selected.name}
                </h2>
                <p className="text-xs text-ink-muted">{selected.email}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-ink-muted hover:text-ink-text text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-paper-bg border border-hairline">
                <span className="text-[10px] font-bold text-ink-muted uppercase flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Industry
                </span>
                <p className="text-sm font-bold text-ink-text mt-1">{profile?.industryType || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-paper-bg border border-hairline">
                <span className="text-[10px] font-bold text-ink-muted uppercase flex items-center gap-1">
                  <Users className="w-3 h-3" /> Team Size
                </span>
                <p className="text-sm font-bold text-ink-text mt-1">{profile ? `${profile.companySize} people` : '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-paper-bg border border-hairline sm:col-span-2">
                <span className="text-[10px] font-bold text-ink-muted uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Website
                </span>
                <p className="text-sm font-bold text-ink-text mt-1 break-all">
                  {profile?.websiteUrl || '—'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-paper-bg border border-hairline sm:col-span-2">
                <span className="text-[10px] font-bold text-ink-muted uppercase">Services Needed</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(profile?.servicesNeeded || []).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-moss-primary/10 border border-moss-primary/30 text-moss-deep text-[10px] font-semibold">
                      {s}
                    </span>
                  ))}
                  {(!profile?.servicesNeeded || profile.servicesNeeded.length === 0) && (
                    <span className="text-xs text-ink-muted">—</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-ink-muted" />
                <h3 className="text-xs font-extrabold text-ink-muted uppercase tracking-wider">Approval History</h3>
              </div>
              <div className="space-y-2">
                {historyLoading ? (
                  <p className="text-xs text-ink-muted">Loading history...</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-ink-muted">No approval actions recorded yet.</p>
                ) : (
                  history.map((h) => (
                    <div key={h.id} className="p-3 rounded-xl bg-paper-bg border border-hairline text-xs">
                      <span className="font-bold text-ink-text">{h.action}</span>
                      <span className="text-ink-muted ml-2">
                        by {h.adminName} · {new Date(h.timestamp).toLocaleString()}
                      </span>
                      {h.reason && <p className="text-ink-muted mt-1">Reason: {h.reason}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1.5">
                  Reason <span className="text-ink-muted font-normal">(required for reject / suspend)</span>
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Verification documents could not be confirmed..."
                  className="w-full bg-moss-sage border border-moss-sage rounded-xl px-3 py-2 text-xs text-ink-text placeholder:text-ink-muted focus:border-moss-primary focus:ring-2 focus:ring-moss-primary/20 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => confirmAction('APPROVE')}
                  disabled={selected.approvalStatus === 'APPROVED' || isSubmitting !== false}
                  className="flex-1 min-w-[120px] px-4 py-2 rounded-xl bg-moss-primary hover:bg-moss-deep disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting === 'APPROVE' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Approve
                </button>
                <button
                  onClick={() => confirmAction('REJECT')}
                  disabled={selected.approvalStatus === 'REJECTED' || isSubmitting !== false}
                  className="flex-1 min-w-[120px] px-4 py-2 rounded-xl bg-moss-deep hover:bg-moss-deep disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting === 'REJECT' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Reject
                </button>
                <button
                  onClick={() => confirmAction('SUSPEND')}
                  disabled={selected.approvalStatus === 'SUSPENDED' || isSubmitting !== false}
                  className="flex-1 min-w-[120px] px-4 py-2 rounded-xl bg-moss-primary hover:bg-moss-deep disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
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