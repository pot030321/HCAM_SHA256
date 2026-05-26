import { FileSearch } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-panel p-6 text-center">
      <FileSearch className="mx-auto h-8 w-8 text-slate-500" />
      <h3 className="mt-3 text-sm font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
    </div>
  );
}
