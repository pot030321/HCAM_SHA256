import type { SecurityEvent } from '../../types';
import { EmptyState } from '../common/EmptyState';

interface SecurityEventTableProps {
  events: SecurityEvent[];
}

function metadataText(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) {
    return '-';
  }
  return entries
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' | ');
}

function severityClass(severity: string) {
  if (severity === 'CRITICAL') return 'bg-red-100 text-red-900';
  if (severity === 'HIGH') return 'bg-orange-100 text-orange-900';
  if (severity === 'MEDIUM') return 'bg-amber-100 text-amber-900';
  return 'bg-slate-100 text-slate-800';
}

export function SecurityEventTable({ events }: SecurityEventTableProps) {
  if (events.length === 0) {
    return <EmptyState title="Chưa có sự kiện bảo mật" message="Tấn công và các lần xác minh đáng ngờ sẽ xuất hiện ở đây." />;
  }

  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-line">
      <table className="min-w-[980px] w-full border-collapse bg-white text-sm">
        <thead className="bg-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">Thời gian</th>
            <th className="px-4 py-3">Mức độ</th>
            <th className="px-4 py-3">Nhóm</th>
            <th className="px-4 py-3">Loại sự kiện</th>
            <th className="px-4 py-3">File</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Ghi chú</th>
            <th className="px-4 py-3">Metadata</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t border-line">
              <td className="px-4 py-3">{event.created_at}</td>
              <td className="px-4 py-3">
                <span className={`rounded px-2 py-1 text-xs font-black ${severityClass(event.severity)}`}>{event.severity}</span>
              </td>
              <td className="px-4 py-3">{event.category}</td>
              <td className="px-4 py-3 font-mono text-xs">{event.event_type}</td>
              <td className="max-w-52 break-all px-4 py-3">{event.file_name || '-'}</td>
              <td className="px-4 py-3">{event.actor}</td>
              <td className="max-w-80 px-4 py-3 text-slate-700">{event.note}</td>
              <td className="max-w-96 px-4 py-3 font-mono text-xs text-slate-600">{metadataText(event.metadata)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
