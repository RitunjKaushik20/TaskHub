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
      return { label: 'Available', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    case 'ASSIGNED':
      return { label: 'Assigned', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
    case 'SUBMITTED':
      return { label: 'Submitted', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    case 'UNDER_REVIEW':
      return { label: 'Under Review', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    case 'APPROVED':
      return { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    case 'REJECTED':
      return { label: 'Rejected', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    case 'PAID':
      return { label: 'Paid Out', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
    case 'COMPLETED':
      return { label: 'Completed', color: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    default:
      return { label: status, color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
  }
}

export function getSubmissionStatusDetails(status: SubmissionStatus) {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending Review', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    case 'UNDER_REVIEW':
      return { label: 'Under Review', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    case 'APPROVED':
      return { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    case 'REJECTED':
      return { label: 'Rejected', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    default:
      return { label: status, color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
  }
}
