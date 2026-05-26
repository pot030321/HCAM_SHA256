import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
}

export function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <div className="rounded-md bg-cyan-50 p-3 text-cyan-800">{icon}</div>
      </div>
    </div>
  );
}
