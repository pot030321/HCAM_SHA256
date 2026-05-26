import { Upload } from 'lucide-react';

interface FileUploadBoxProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

export function FileUploadBox({ label, file, onChange }: FileUploadBoxProps) {
  return (
    <label className="flex min-h-36 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-panel p-4 text-center transition hover:border-cyan-700 hover:bg-cyan-50 md:min-h-44">
      <Upload className="mb-3 h-7 w-7 text-cyan-700" />
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-2 max-w-full break-all text-xs text-slate-600">{file ? file.name : 'Choose a local document'}</span>
      <input
        className="sr-only"
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
    </label>
  );
}
