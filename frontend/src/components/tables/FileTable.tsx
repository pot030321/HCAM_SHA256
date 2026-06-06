import type { FileMetadata } from '../../types';
import { EmptyState } from '../common/EmptyState';

interface FileTableProps {
  files: FileMetadata[];
  selectedId?: number | null;
  onSelect?: (fileId: number) => void;
}

function shortHash(value: string) {
  return `${value.slice(0, 12)}...${value.slice(-8)}`;
}

export function FileTable({ files, selectedId, onSelect }: FileTableProps) {
  if (files.length === 0) {
    return <EmptyState title="Chưa có file gốc" message="Đăng ký một file gốc để tạo SHA-256, Merkle Root và metadata HMAC." />;
  }

  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-line">
      <table className="min-w-[860px] w-full border-collapse bg-white text-sm">
        <thead className="bg-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Tên file</th>
            <th className="px-4 py-3">Kích thước</th>
            <th className="px-4 py-3">SHA-256</th>
            <th className="px-4 py-3">Merkle Root</th>
            <th className="px-4 py-3">Thời điểm tạo</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr
              key={file.id}
              onClick={() => onSelect?.(file.id)}
              className={`border-t border-line ${onSelect ? 'cursor-pointer hover:bg-cyan-50' : ''} ${selectedId === file.id ? 'bg-cyan-50' : ''}`}
            >
              <td className="px-4 py-3 font-bold">{file.id}</td>
              <td className="max-w-56 break-all px-4 py-3">{file.original_name}</td>
              <td className="px-4 py-3">{file.file_size} B</td>
              <td className="px-4 py-3 font-mono text-xs">{shortHash(file.sha256)}</td>
              <td className="px-4 py-3 font-mono text-xs">{shortHash(file.merkle_root)}</td>
              <td className="px-4 py-3">{file.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
