import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Star, ExternalLink, FileText, Check, CircleDollarSign } from 'lucide-react';
import { submissionsApi } from '../../api/submissions';
import { formatCurrency } from '../../lib/utils';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import type { Submission } from '../../types';
import { getSocket } from '../../lib/socket';

const SubmissionsReview: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('Exemplary execution, verified proof.');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const toast = useToast();

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const res = await submissionsApi.getSubmissions();
        if (res.success && res.data) {
          setSubmissions(res.data);
          if (res.data.length > 0) {
            setSelectedSubId(res.data[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load submissions:', err);
      }
    };
    loadSubmissions();

    const socket = getSocket();
    const handleSubmissionUpdated = (updatedSub: any) => {
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === updatedSub.id ? { ...sub, ...updatedSub } : sub))
      );
    };

    socket.on('submission-updated', handleSubmissionUpdated);
    return () => {
      socket.off('submission-updated', handleSubmissionUpdated);
    };
  }, []);

  const selectedSub = submissions.find((s) => s.id === selectedSubId);

  const handleApprove = async () => {
    if (!selectedSub) return;
    const res = await submissionsApi.reviewSubmission(selectedSub.id, {
      status: 'APPROVED',
      qualityScore,
      feedback,
    });

    if (res.success && res.data) {
      setSubmissions(submissions.map((s) => (s.id === selectedSub.id ? res.data! : s)));
      toast.success(
        'Submission Approved!',
        `Quality Score: ${qualityScore}/5 stars. Reward is now payable — track it under Spending & Billing.`
      );
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedSub) return;
    const res = await submissionsApi.markPaid(selectedSub.id);
    if (res.success && res.data) {
      setSubmissions(submissions.map((s) => (s.id === selectedSub.id ? res.data! : s)));
      toast.success(
        'Payment Marked as Paid',
        `${formatCurrency(selectedSub.rewardAmount)} marked as paid for "${selectedSub.taskTitle}". Your Total Spending has been updated.`
      );
    } else {
      toast.error('Failed to Mark as Paid', res.message || 'Could not mark this submission as paid.');
    }
  };

  const handleReject = async () => {
    if (!selectedSub || !rejectionReason.trim()) {
      toast.error('Rejection Reason Required', 'Please explain why the submission was rejected.');
      return;
    }

    const res = await submissionsApi.reviewSubmission(selectedSub.id, {
      status: 'REJECTED',
      rejectionReason,
    });

    if (res.success && res.data) {
      setSubmissions(submissions.map((s) => (s.id === selectedSub.id ? res.data! : s)));
      toast.info('Submission Rejected', 'Feedback submitted to worker.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-text">Worker Submission Review & Rating</h1>
        <p className="text-xs text-ink-muted">Inspect deliverable proofs, assign star quality scores, and confirm payments once settled off-platform.</p>
      </div>

      {submissions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-paper-bg border border-hairline shadow-sm text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-moss-sage border border-moss-sage text-moss-deep flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink-text">No Submissions Pending Review</h3>
            <p className="text-xs text-ink-muted mt-1">
              When workers complete assigned tasks and upload proofs, their deliverables will appear here for grading and reward payout.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-ink-text uppercase tracking-wider">Submissions Queue</h3>
            {submissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => setSelectedSubId(sub.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm ${
                  selectedSubId === sub.id
                    ? 'bg-moss-sage border-moss-primary text-ink-text ring-1 ring-moss-primary/30'
                    : 'bg-paper-bg border-hairline text-ink-text hover:bg-paper-bg hover:border-moss-sage'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge type="submission" status={sub.status} size="sm" />
                  <span className="text-xs font-extrabold text-moss-deep">{formatCurrency(sub.rewardAmount)}</span>
                </div>
                <h4 className="text-xs font-bold truncate text-ink-text">{sub.taskTitle}</h4>
                <p className="text-[10px] text-ink-muted mt-1">Worker: {sub.workerName}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-paper-bg border border-hairline shadow-sm space-y-6">
            {selectedSub ? (
              <>
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <div>
                    <span className="text-[10px] text-moss-deep font-bold uppercase tracking-wider">Sub ID: {selectedSub.id}</span>
                    <h2 className="text-lg font-bold text-ink-text mt-0.5">{selectedSub.taskTitle}</h2>
                    <p className="text-xs text-ink-muted">Worker: <span className="font-semibold text-ink-text">{selectedSub.workerName}</span> ({selectedSub.workerId})</p>
                  </div>
                  <StatusBadge type="submission" status={selectedSub.status} />
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-ink-text uppercase tracking-wider">Submitted Deliverable Proof</h3>
                  <div className="p-5 rounded-2xl bg-paper-bg border border-hairline space-y-3 text-xs">
                    <p className="text-ink-text leading-relaxed whitespace-pre-wrap">{selectedSub.proofContent}</p>
                    
                    {selectedSub.fileUrl && (
                      <div className="pt-1">
                        <a
                          href={selectedSub.fileUrl.startsWith('http') ? selectedSub.fileUrl : `http://localhost:8000${selectedSub.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-moss-sage text-moss-deep border border-moss-sage hover:bg-moss-sage font-bold text-xs transition-all shadow-sm"
                        >
                          <FileText className="w-4 h-4 text-moss-deep" /> View Uploaded Proof File ({selectedSub.fileUrl})
                        </a>
                      </div>
                    )}

                    {selectedSub.linkUrl && (
                      <div className="pt-1">
                        <a
                          href={selectedSub.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-moss-sage text-moss-deep border border-moss-sage font-bold text-xs transition-all shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-moss-deep" /> View Deliverable Link ({selectedSub.linkUrl})
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-paper-bg border border-hairline space-y-3">
                  <label className="block text-xs font-bold text-ink-text">
                    Assign Quality Score (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setQualityScore(star)}
                        className={`p-2 rounded-xl border transition-all ${
                          qualityScore >= star
                            ? 'text-moss-deep bg-moss-sage/30 border-moss-sage shadow-sm'
                            : 'text-ink-muted bg-paper-bg border-hairline hover:text-moss-primary hover:border-moss-sage'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-ink-text ml-2">{qualityScore} / 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-text mb-1.5">Feedback / Rejection Reason</label>
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => {
                      setFeedback(e.target.value);
                      setRejectionReason(e.target.value);
                    }}
                    placeholder="Feedback notes for the worker..."
                    className="w-full glass-input text-xs text-ink-text placeholder:text-ink-muted/70 bg-paper-bg border border-moss-sage"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
                  <button
                    onClick={handleReject}
                    className="px-5 py-2.5 rounded-xl bg-moss-sage/30 hover:bg-moss-sage text-moss-deep border border-moss-sage font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <XCircle className="w-4 h-4" /> Reject Deliverable
                  </button>
                  {selectedSub.status === 'APPROVED' && selectedSub.paymentStatus === 'MARKED_PAID' ? (
                    <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-moss-sage text-moss-deep border border-moss-sage font-bold text-xs">
                      <CircleDollarSign className="w-4 h-4" /> Paid — {formatCurrency(selectedSub.rewardAmount)}
                    </span>
                  ) : (
                    <>
                      {selectedSub.status === 'APPROVED' && (
                        <button
                          onClick={handleMarkPaid}
                          className="px-6 py-2.5 rounded-xl bg-moss-deep hover:bg-moss-deep text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                        >
                          <CircleDollarSign className="w-4 h-4" /> Mark as Paid {formatCurrency(selectedSub.rewardAmount)}
                        </button>
                      )}
                      <button
                        onClick={handleApprove}
                        className="px-6 py-2.5 rounded-xl bg-moss-primary hover:bg-moss-deep text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve {formatCurrency(selectedSub.rewardAmount)}
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center p-8 text-ink-muted text-xs">
                Select a submission from the queue to view and grade deliverables.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsReview;
