import React from 'react';
import type { TaskStatus, SubmissionStatus } from '../../types';
import { getTaskStatusDetails, getSubmissionStatusDetails } from '../../lib/utils';

interface StatusBadgeProps {
  type?: 'task' | 'submission';
  status: TaskStatus | SubmissionStatus | string;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type = 'task', status, size = 'md' }) => {
  const details =
    type === 'task'
      ? getTaskStatusDetails(status as TaskStatus)
      : getSubmissionStatusDetails(status as SubmissionStatus);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-sm transition-all duration-300 ${sizeClasses} ${details.color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {details.label}
    </span>
  );
};

export default StatusBadge;
