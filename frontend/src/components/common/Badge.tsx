import type { Status } from '../../types';

interface BadgeProps {
  status?: Status;
  children?: string;
}

export function Badge({ status, children }: BadgeProps) {
  const label = children || status || 'UNKNOWN';
  const styles: Record<string, string> = {
    VALID: 'bg-green-100 text-green-800 border-green-200',
    MODIFIED: 'bg-orange-100 text-orange-800 border-orange-200',
    FORGED: 'bg-red-100 text-red-800 border-red-200',
    UNKNOWN: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles[label] || styles.UNKNOWN}`}>
      {label}
    </span>
  );
}
