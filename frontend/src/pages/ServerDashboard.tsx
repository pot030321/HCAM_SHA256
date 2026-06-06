import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiError } from '../api/axiosClient';
import { getFileDetail } from '../api/fileApi';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { HashDisplay } from '../components/common/HashDisplay';
import { InfoRow } from '../components/common/InfoRow';
import { MetricCard } from '../components/dashboard/MetricCard';
import { FileTable } from '../components/tables/FileTable';
import type { FileDetail, FileMetadata } from '../types';

interface ServerDashboardProps {
  files: FileMetadata[];
}

export function ServerDashboard({ files }: ServerDashboardProps) {
  const [selectedId, setSelectedId] = useState<number | null>(files[0]?.id || null);
  const [detail, setDetail] = useState<FileDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDetail() {
      if (!selectedId) {
        setDetail(null);
        return;
      }
      try {
        setError('');
        const response = await getFileDetail(selectedId);
        setDetail(response);
      } catch (err) {
        setError(getApiError(err));
      }
    }
    loadDetail();
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId && files[0]) {
      setSelectedId(files[0].id);
    }
  }, [files, selectedId]);

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="File goc" value={files.length} icon={<FileText className="h-5 w-5" />} />
      </div>

      <Card title="File da dang ky" subtitle="May chu chi luu ho so hash cua file goc. Khong hien log tan cong o day.">
        <FileTable files={files} selectedId={selectedId} onSelect={setSelectedId} />
      </Card>

      <Card title="Chi tiet ho so hash">
        {!detail ? (
          <EmptyState title="Chua chon file" message="Dang ky hoac chon mot file de xem metadata." />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <InfoRow label="File ID" value={detail.id} />
                <InfoRow label="Ten file" value={detail.original_name} />
                <InfoRow label="Kich thuoc" value={`${detail.file_size} bytes`} />
                <InfoRow label="Thoi diem tao" value={detail.created_at} />
              </div>
              <div className="space-y-3">
                <HashDisplay label="SHA-256" value={detail.sha256} />
                <HashDisplay label="Merkle Root" value={detail.merkle_root} />
                <HashDisplay label="HMAC-SHA256" value={detail.hmac_sha256} />
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold">Hash tung block</h3>
              <div className="max-h-72 overflow-auto rounded-md border border-line bg-slate-50 p-3">
                {detail.block_hashes.map((hash, index) => (
                  <div key={`${index}-${hash}`} className="mb-2 grid grid-cols-[4rem_1fr] gap-3 text-xs last:mb-0">
                    <span className="font-bold text-slate-600">#{index}</span>
                    <span className="break-all font-mono">{hash}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
