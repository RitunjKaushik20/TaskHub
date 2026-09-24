import React from 'react';
import { Hourglass, XCircle, Ban, CheckCircle2 } from 'lucide-react';
import type { ApprovalStatus } from '../../types';
import { cn } from '../../lib/utils';

const STATUS_META: Record<
  ApprovalStatus,
  { label: string; description: string; classes: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Business Account Pending Approval',
    description:
      'Your business account is under review by a TaskHub admin. You will be able to publish tasks once your account is approved.',
    classes: 'bg-moss-sage/30 border-moss-sage text-moss-deep',
    icon: <Hourglass className="w-4 h-4" />,
  },
  REJECTED: {
    label: 'Business Account Rejected',
    description:
      'Your business account was not approved. Contact support if you believe this is a mistake.',
    classes: 'bg-moss-sage/30 border-moss-sage text-moss-deep',
    icon: <XCircle className="w-4 h-4" />,
  },
  SUSPENDED: {
    label: 'Business Account Suspended',
    description:
      'Your business account has been suspended. Task publishing is disabled until this is resolved.',
    classes: 'bg-moss-sage/30 border-moss-sage text-moss-deep',
    icon: <Ban className="w-4 h-4" />,
  },
  APPROVED: {
    label: 'Business Account Approved',
    description: 'Your business account is approved and ready to publish tasks.',
    classes: 'bg-moss-sage border-moss-sage text-moss-deep',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
};

interface ApprovalBannerProps {
  status: ApprovalStatus | null | undefined;
  className?: string;
}

const ApprovalBanner: React.FC<ApprovalBannerProps> = ({ status, className }) => {
  if (!status || status === 'APPROVED') return null;
  const meta = STATUS_META[status];
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-2xl border shadow-sm animate-in fade-in-50 duration-300',
        meta.classes,
        className
      )}
      role="alert"
    >
      <div className="mt-0.5 flex-shrink-0">{meta.icon}</div>
      <div className="space-y-0.5">
        <p className="text-sm font-bold">{meta.label}</p>
        <p className="text-xs opacity-90">{meta.description}</p>
      </div>
    </div>
  );
};

export default ApprovalBanner;