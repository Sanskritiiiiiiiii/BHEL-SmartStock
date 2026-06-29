import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export function Button({ className, variant = 'default', size = 'md', children, ...props }: ButtonProps) {
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-600/20',
    outline: 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
    ghost: 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-sm gap-2',
    icon: 'p-2',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
export function Input({ className, label, error, id, icon, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
          id={inputId}
          className={cn(
            'w-full py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-150',
            'border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            icon ? 'pl-10 pr-3' : 'px-3.5',
            error && 'border-red-400 focus:ring-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11} />{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}
export function Select({ className, label, error, id, options, placeholder, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={selectId} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</label>}
      <select
        id={selectId}
        className={cn(
          'w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-150',
          'border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error && 'border-red-400', className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string;
}
export function Textarea({ className, label, error, id, ...props }: TextareaProps) {
  const tid = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={tid} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</label>}
      <textarea
        id={tid}
        className={cn(
          'w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-150 resize-y min-h-[80px]',
          'border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error && 'border-red-400', className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps { className?: string; children: React.ReactNode; onClick?: () => void; }
export function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800',
        'shadow-[0_1px_3px_rgba(0,0,0,.04),0_1px_2px_rgba(0,0,0,.03)]',
        'dark:shadow-[0_1px_3px_rgba(0,0,0,.2)]',
        onClick && 'cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}
export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('px-6 py-4 border-b border-gray-100 dark:border-gray-800', className)}>{children}</div>;
}
export function CardTitle({ className, children }: CardProps) {
  return <h3 className={cn('text-sm font-bold text-gray-900 dark:text-white tracking-tight', className)}>{children}</h3>;
}
export function CardContent({ className, children }: CardProps) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps { className?: string; children: React.ReactNode; variant?: 'default'|'success'|'warning'|'danger'|'info'|'purple'; }
export function Badge({ className, children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400',
    danger:  'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400',
    info:    'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400',
    purple:  'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { variant: BadgeProps['variant']; dot: string }> = {
    PENDING: { variant: 'warning', dot: 'bg-amber-500' },
    APPROVED: { variant: 'success', dot: 'bg-emerald-500' },
    REJECTED: { variant: 'danger', dot: 'bg-red-500' },
    OPEN: { variant: 'info', dot: 'bg-blue-500' },
    CLOSED: { variant: 'default', dot: 'bg-gray-400' },
    AWARDED: { variant: 'success', dot: 'bg-emerald-500' },
  };
  const c = configs[status] || { variant: 'default' as const, dot: 'bg-gray-400' };
  const labels: Record<string,string> = { PENDING:'Pending', APPROVED:'Approved', REJECTED:'Rejected', OPEN:'Open', CLOSED:'Closed', AWARDED:'Awarded' };
  return (
    <Badge variant={c.variant}>
      <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
      {labels[status] || status}
    </Badge>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('overflow-x-auto', className)}><table className="w-full text-sm">{children}</table></div>;
}
export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-gray-100 dark:border-gray-800">{children}</thead>;
}
export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80">{children}</tbody>;
}
export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors group', className)}>{children}</tr>;
}
export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/80 dark:bg-gray-800/50', className)}>{children}</th>;
}
export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3.5 text-gray-700 dark:text-gray-300', className)}>{children}</td>;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <div className={cn('animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-blue-600', className || 'h-5 w-5')} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ title, description, icon, action }: { title: string; description?: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      {icon && <div className="mb-4 text-gray-300 dark:text-gray-600 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">{icon}</div>}
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-gray-400 dark:text-gray-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm'|'md'|'lg'|'xl'; }
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative bg-white dark:bg-gray-900 w-full sm:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,.25)] flex flex-col',
        'max-h-[95vh] sm:max-h-[90vh]',
        'rounded-t-2xl sm:rounded-2xl',
        sizes[size]
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps { page: number; totalPages: number; total?: number; onPageChange: (p: number) => void; }
export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {total !== undefined ? `${total} total records · ` : ''}Page <span className="font-semibold text-gray-600 dark:text-gray-300">{page}</span> of <span className="font-semibold text-gray-600 dark:text-gray-300">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className={cn('w-7 h-7 text-xs rounded-lg font-medium transition-colors', p === page ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps { title: string; value: string | number; icon: React.ReactNode; color?: string; subtitle?: string; trend?: { value: number; label: string }; }
export function StatCard({ title, value, icon, color = 'blue', subtitle, trend }: StatCardProps) {
  const colorMap: Record<string, { bg: string; icon: string; trend: string }> = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-950/50',    icon: 'text-blue-600 dark:text-blue-400',    trend: 'text-blue-600' },
    green:  { bg: 'bg-emerald-50 dark:bg-emerald-950/50', icon: 'text-emerald-600 dark:text-emerald-400', trend: 'text-emerald-600' },
    yellow: { bg: 'bg-amber-50 dark:bg-amber-950/50',   icon: 'text-amber-600 dark:text-amber-400',   trend: 'text-amber-600' },
    red:    { bg: 'bg-red-50 dark:bg-red-950/50',       icon: 'text-red-600 dark:text-red-400',       trend: 'text-red-600' },
    purple: { bg: 'bg-violet-50 dark:bg-violet-950/50', icon: 'text-violet-600 dark:text-violet-400', trend: 'text-violet-600' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-950/50', icon: 'text-orange-600 dark:text-orange-400', trend: 'text-orange-600' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{title}</p>
            <p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
            {trend && (
              <p className={cn('mt-1 text-xs font-semibold', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn('p-2.5 rounded-xl flex-shrink-0', c.bg)}>
            <span className={c.icon}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmProps { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; cancelLabel?: string; variant?: 'danger'|'warning'|'default'; }
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default' }: ConfirmProps) {
  if (!open) return null;
  const icons = { danger: '🗑️', warning: '⚠️', default: '✓' };
  const btnColors = { danger: 'bg-red-600 hover:bg-red-700 text-white', warning: 'bg-amber-600 hover:bg-amber-700 text-white', default: 'bg-blue-600 hover:bg-blue-700 text-white' };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,.25)] w-full max-w-sm p-6 animate-in">
        <div className="flex items-start gap-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0', variant === 'danger' ? 'bg-red-50 dark:bg-red-950' : variant === 'warning' ? 'bg-amber-50 dark:bg-amber-950' : 'bg-blue-50 dark:bg-blue-950')}>
            {icons[variant]}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {cancelLabel}
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className={cn('px-4 py-2 text-sm font-semibold rounded-xl transition-colors', btnColors[variant])}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
