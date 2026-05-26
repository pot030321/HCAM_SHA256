import { AlertTriangle, Database, FileCheck, FileText, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getApiError } from '../api/axiosClient';
import { getFileDetail } from '../api/fileApi';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { HashDisplay } from '../components/common/HashDisplay';
import { InfoRow } from '../components/common/InfoRow';
import { MetricCard } from '../components/dashboard/MetricCard';
import { FileTable } from '../components/tables/FileTable';
import { LogTable } from '../components/tables/LogTable';
import type { FileDetail, FileMetadata, VerificationLog } from '../types';

interface ServerDashboardProps {
  files: FileMetadata[];
  logs: VerificationLog[];
}

export function ServerDashboard({ files, logs }: ServerDashboardProps) {
  const [selectedId, setSelectedId] = useState<number | null>(files[0]?.id || null);
  const [detail, setDetail] = useState<FileDetail | null>(null);
  const [error, setError] = useState('');

  const metrics = useMemo(() => {
    return {
      totalFiles: files.length,
      totalLogs: logs.length,
      valid: logs.filter((log) => log.result === 'VALID').length,
      modified: logs.filter((log) => log.result === 'MODIFIED').length,
      forged: logs.filter((log) => log.result === 'FORGED').length,
    };
  }, [files, logs]);

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Files" value={metrics.totalFiles} icon={<FileText className="h-5 w-5" />} />
        <MetricCard label="Logs" value={metrics.totalLogs} icon={<Database className="h-5 w-5" />} />
        <MetricCard label="Valid" value={metrics.valid} icon={<FileCheck className="h-5 w-5" />} />
        <MetricCard label="Modified" value={metrics.modified} icon={<AlertTriangle className="h-5 w-5" />} />
        <MetricCard label="Forged" value={metrics.forged} icon={<ShieldAlert className="h-5 w-5" />} />
      </div>

      <Card title="Registered Files" subtitle="Click a row to inspect full metadata and block hashes.">
        <FileTable files={files} selectedId={selectedId} onSelect={setSelectedId} />
      </Card>

      <Card title="File Detail Panel">
        {!detail ? (
          <EmptyState title="No file selected" message="Register or select a file to inspect stored integrity metadata." />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <InfoRow label="File ID" value={detail.id} />
                <InfoRow label="Name" value={detail.original_name} />
                <InfoRow label="Size" value={`${detail.file_size} bytes`} />
                <InfoRow label="Created" value={detail.created_at} />
              </div>
              <div className="space-y-3">
                <HashDisplay label="Full SHA-256" value={detail.sha256} />
                <HashDisplay label="Full Merkle Root" value={detail.merkle_root} />
                <HashDisplay label="Full HMAC-SHA256" value={detail.hmac_sha256} />
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold">Block Hashes</h3>
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

      <Card title="Verification Logs">
        <LogTable logs={logs} />
      </Card>
    </div>
  );
}
