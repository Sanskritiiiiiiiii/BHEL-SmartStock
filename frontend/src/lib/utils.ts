import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStockStatus(current: number, minimum: number) {
  if (current === 0) return 'out';
  if (current <= minimum) return 'low';
  return 'ok';
}

export function getStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case 'APPROVED':
    case 'OK':
    case 'AWARDED':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'PENDING':
    case 'OPEN':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'REJECTED':
    case 'CLOSED':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

export const DEPARTMENTS = [
  'Production',
  'Maintenance',
  'Engineering',
  'Quality Control',
  'Administration',
  'R&D',
  'Safety',
  'Logistics',
];
