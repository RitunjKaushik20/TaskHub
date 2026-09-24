import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TaskStatus, SubmissionStatus } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const isINR = currency?.toUpperCase() === 'INR' || currency === '₹';
  if (isINR) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getTaskStatusDetails(status: TaskStatus) {
  switch (status) {
    case 'AVAILABLE':
      return { label: 'Available', color: 'bg-moss-primary/10 text-moss-deep border-moss-primary/30' };
    case 'ASSIGNED':
      return { label: 'Assigned', color: 'bg-moss-sage text-moss-deep border-moss-sage' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', color: 'bg-moss-sage text-moss-deep border-moss-sage' };
    case 'SUBMITTED':
      return { label: 'Submitted', color: 'bg-moss-sage text-moss-deep border-moss-sage' };
    case 'UNDER_REVIEW':
      return { label: 'Under Review', color: 'bg-moss-sage/30 text-moss-deep border-moss-sage' };
    case 'APPROVED':
      return { label: 'Approved', color: 'bg-moss-primary/10 text-moss-deep border-moss-primary/30' };
    case 'REJECTED':
      return { label: 'Rejected', color: 'bg-moss-sage/30 text-moss-deep border-moss-deep/30' };
    case 'PAID':
      return { label: 'Paid Out', color: 'bg-moss-sage text-moss-deep border-moss-sage' };
    case 'COMPLETED':
      return { label: 'Completed', color: 'bg-moss-sage text-ink-text border-moss-sage' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'bg-moss-sage/30 text-moss-deep border-moss-deep/30' };
    default:
      return { label: status, color: 'bg-moss-sage text-ink-text border-moss-sage' };
  }
}

export function getSubmissionStatusDetails(status: SubmissionStatus) {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending Review', color: 'bg-moss-sage/30 text-moss-deep border-moss-sage' };
    case 'UNDER_REVIEW':
      return { label: 'Under Review', color: 'bg-moss-sage text-moss-deep border-moss-sage' };
    case 'APPROVED':
      return { label: 'Approved', color: 'bg-moss-primary/10 text-moss-deep border-moss-primary/30' };
    case 'REJECTED':
      return { label: 'Rejected', color: 'bg-moss-sage/30 text-moss-deep border-moss-deep/30' };
    default:
      return { label: status, color: 'bg-moss-sage text-ink-text border-moss-sage' };
  }
}
