import type { ReactNode } from 'react';

interface InfoRowProps {
  label: string;
  value: ReactNode;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className="break-all text-sm text-ink sm:max-w-[70%] sm:text-right">{value}</span>
    </div>
  );
}
