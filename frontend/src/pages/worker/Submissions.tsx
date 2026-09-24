import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Link as LinkIcon, Upload, CheckCircle2, FileText, CircleDollarSign } from 'lucide-react';
import { submissionsApi } from '../../api/submissions';
import { tasksApi } from '../../api/tasks';
import type { Submission, Task } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { getSocket } from '../../lib/socket';

const submissionSchema = z.object({
  taskId: z.string().min(1, 'Please select a task'),
  proofType: z.enum(['FILE', 'LINK', 'TEXT', 'HYBRID']),
  proofContent: z.string().min(10, 'Proof explanation must be at least 10 characters'),
  linkUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

const Submissions: React.FC = () => {
  const [submissionsList, setSubmissionsList] = useState<Submission[]>([]);
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      taskId: '',
      proofType: 'LINK',
      proofContent: '',
      linkUrl: '',
    },
  });

  const selectedProofType = useWatch({ control, name: 'proofType' });

  useEffect(() => {
    // Load tasks and submissions from API
    const loadData = async () => {
      try {
        const [tasksRes, subsRes] = await Promise.all([
          tasksApi.getTasks(),
          submissionsApi.getSubmissions(),
        ]);
        if (tasksRes.success && tasksRes.data && tasksRes.data.length > 0) {
          setTasksList(tasksRes.data);
          setValue('taskId', tasksRes.data[0].id);
        }
        if (subsRes.success && subsRes.data) {
          setSubmissionsList(subsRes.data);
        }
      } catch (err) {
        console.warn('Failed to load submissions or tasks:', err);
      }
    };
    loadData();

    const socket = getSocket();
    const handleSubmissionUpdated = (updatedSub: any) => {
      setSubmissionsList((prev) =>
        prev.map((sub) => (sub.id === updatedSub.id ? { ...sub, ...updatedSub } : sub))
      );
      toast.info(
        `Submission ${updatedSub.status}!`,
        `Your deliverable for "${updatedSub.taskTitle || 'Task'}" has been ${updatedSub.status.toLowerCase()}.`
      );
    };

    socket.on('submission-updated', handleSubmissionUpdated);
    return () => {
      socket.off('submission-updated', handleSubmissionUpdated);
    };
  }, [setValue, toast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await submissionsApi.uploadProofFile(file);
      if (res.success && res.data) {
        setUploadedFileUrl(res.data.fileUrl);
        setUploadedFileName(file.name);
        toast.success('Proof File Uploaded', `File uploaded to ${res.data.fileUrl}`);
      } else {
        toast.error('Upload Failed', res.message || 'Could not upload file');
      }
    } catch {
      toast.error('Upload Error', 'Network error while uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: SubmissionFormValues) => {
    const response = await submissionsApi.submitProof({
      taskId: data.taskId,
      proofType: data.proofType,
      proofContent: data.proofContent,
      linkUrl: data.linkUrl || undefined,
      fileUrl: uploadedFileUrl || undefined,
    });

    if (response.success && response.data) {
      setSubmissionsList([response.data, ...submissionsList]);
      toast.success('Proof Submitted Successfully!', 'Your proof is now under business review for direct reward payout.');
      setUploadedFileUrl('');
      setUploadedFileName('');
      reset();
    } else {
      toast.error('Submission Failed', response.message || 'Failed to submit proof');
    }
  };

  const handleMarkPaid = async (sub: Submission) => {
    const response = await submissionsApi.markPaid(sub.id);
    if (response.success && response.data) {
      setSubmissionsList((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, ...response.data } : s))
      );
      toast.success('Payment Marked as Paid', `Reward for "${sub.taskTitle}" confirmed. Your Total Earnings now reflect this payment.`);
    } else {
      toast.error('Failed to Mark as Paid', response.message || 'Could not mark this submission as paid.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-text">Task Proof Submissions</h1>
        <p className="text-xs text-ink-muted">Submit deliverables via link, file upload (/uploads), or text proof for verification and direct payout.</p>
      </div>

      {/* Submission Form */}
      <div className="p-6 rounded-3xl glass-panel border border-hairline space-y-5">
        <h2 className="text-lg font-bold text-ink-text flex items-center gap-2">
          <Send className="w-5 h-5 text-moss-primary" /> Submit New Task Proof
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Select Active Task</label>
              <select {...register('taskId')} className="w-full glass-input text-xs">
                {tasksList.length > 0 ? (
                  tasksList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({formatCurrency(t.reward)})
                    </option>
                  ))
                ) : (
                  <option value="tsk_901">Annotate 500 Image Masking Boundaries ($45.00)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Proof Format</label>
              <select {...register('proofType')} className="w-full glass-input text-xs">
                <option value="FILE">File Attachment Upload (/uploads)</option>
                <option value="LINK">External Link (GitHub, Google Drive, Loom)</option>
                <option value="TEXT">Text Summary / Markdown Code</option>
                <option value="HYBRID">Hybrid (Link + File + Notes)</option>
              </select>
            </div>
          </div>

          {(selectedProofType === 'FILE' || selectedProofType === 'HYBRID') && (
            <div className="p-4 rounded-2xl bg-moss-light/40 border border-hairline space-y-2">
              <label className="block text-xs font-semibold text-ink-muted">
                Upload Deliverable File
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-moss-primary hover:bg-moss-deep text-xs font-semibold text-white flex items-center gap-2 transition-all">
                  <Upload className="w-4 h-4 text-moss-primary" />
                  {isUploading ? 'Uploading...' : 'Choose File (/uploads)'}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                {uploadedFileUrl && (
                  <div className="flex items-center gap-2 text-xs text-moss-deep font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{uploadedFileName || uploadedFileUrl}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Proof URL / Deliverable Link</label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none z-10" />
              <input
                type="text"
                {...register('linkUrl')}
                placeholder="https://github.com/username/project-proof"
                className="w-full glass-input !pl-11 !pr-4 text-xs"
              />
            </div>
            {errors.linkUrl && <p className="text-[10px] text-moss-deep mt-1">{errors.linkUrl.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Proof Explanation & Execution Notes</label>
            <textarea
              rows={3}
              {...register('proofContent')}
              placeholder="Describe what was completed and highlight key deliverables..."
              className="w-full glass-input text-xs"
            />
            {errors.proofContent && <p className="text-[10px] text-moss-deep mt-1">{errors.proofContent.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-moss-deep to-moss-primary hover:opacity-95 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting Proof...' : 'Submit Proof to Business'} <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Submission History Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-ink-text">Submission History</h2>
        <div className="overflow-x-auto rounded-2xl glass-panel border border-hairline">
          <table className="w-full text-left text-xs text-ink-muted">
            <thead className="bg-moss-sage text-moss-deep font-semibold border-b border-hairline uppercase">
              <tr>
                <th className="p-4">Task Title</th>
                <th className="p-4">Proof Content</th>
                <th className="p-4">Deliverable Asset</th>
                <th className="p-4">Submitted Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Reward</th>
                <th className="p-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/60">
              {submissionsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-muted">
                    No deliverables submitted yet. Accepted task submissions will appear here for reward payout tracking.
                  </td>
                </tr>
              ) : (
                submissionsList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-paper-bg transition-colors">
                    <td className="p-4 font-semibold text-ink-text max-w-xs truncate">{sub.taskTitle}</td>
                    <td className="p-4 max-w-xs truncate text-ink-muted">{sub.proofContent}</td>
                    <td className="p-4 text-xs">
                      {sub.fileUrl ? (
                        <a
                          href={sub.fileUrl.startsWith('http') ? sub.fileUrl : `http://localhost:8000${sub.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-moss-deep hover:underline font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" /> File Upload
                        </a>
                      ) : sub.linkUrl ? (
                        <a
                          href={sub.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-moss-deep hover:underline truncate max-w-[150px] inline-block"
                        >
                          {sub.linkUrl}
                        </a>
                      ) : (
                        <span className="text-ink-muted">Text Only</span>
                      )}
                    </td>
                    <td className="p-4 text-ink-muted">{formatDate(sub.submittedAt)}</td>
                    <td className="p-4">
                      <StatusBadge type="submission" status={sub.status} size="sm" />
                    </td>
                    <td className="p-4 text-right font-bold text-moss-deep">{formatCurrency(sub.rewardAmount)}</td>
                    <td className="p-4">
                      {sub.status === 'APPROVED' && sub.paymentStatus === 'MARKED_PAID' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-moss-primary/15 text-moss-deep font-bold text-[10px] uppercase tracking-wide">
                          <CircleDollarSign className="w-3.5 h-3.5" /> Paid
                        </span>
                      ) : sub.status === 'APPROVED' ? (
                        <button
                          onClick={() => handleMarkPaid(sub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-moss-deep hover:bg-moss-deep text-white text-[11px] font-bold transition-colors"
                        >
                          <CircleDollarSign className="w-3.5 h-3.5" /> Mark as Paid
                        </button>
                      ) : (
                        <span className="text-ink-muted text-[10px] uppercase tracking-wide">—</span>
                      )}
                    </td>
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

export default Submissions;
