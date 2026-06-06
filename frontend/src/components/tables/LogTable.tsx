import type { VerificationLog } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

interface LogTableProps {
  logs: VerificationLog[];
}

export function LogTable({ logs }: LogTableProps) {
  if (logs.length === 0) {
    return <EmptyState title="Chưa có log xác minh" message="Kết quả xác minh và kiểm tra giả mạo hash sẽ xuất hiện ở đây." />;
  }

  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-line">
      <table className="min-w-[900px] w-full border-collapse bg-white text-sm">
        <thead className="bg-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">Thời gian</th>
            <th className="px-4 py-3">File</th>
            <th className="px-4 py-3">Kết quả</th>
            <th className="px-4 py-3">Block đổi</th>
            <th className="px-4 py-3">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-line">
              <td className="px-4 py-3">{log.created_at}</td>
              <td className="max-w-52 break-all px-4 py-3">{log.file_name}</td>
              <td className="px-4 py-3"><Badge status={log.result} /></td>
              <td className="px-4 py-3 font-mono text-xs">{log.changed_blocks.length ? log.changed_blocks.join(', ') : '-'}</td>
              <td className="max-w-80 px-4 py-3 text-slate-700">{log.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
