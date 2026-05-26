import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface HashDisplayProps {
  label: string;
  value?: string | null;
}

export function HashDisplay({ label, value }: HashDisplayProps) {
  const [copied, setCopied] = useState(false);
  const displayValue = value || 'Not available';

  async function copyValue() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
        {value && (
          <button
            type="button"
            onClick={copyValue}
            className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-cyan-800 hover:bg-cyan-50"
            title={`Copy ${label}`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div className="max-w-full overflow-x-auto rounded-md border border-line bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-800">
        <span className="break-all">{displayValue}</span>
      </div>
    </div>
  );
}
