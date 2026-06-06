import { Binary, FilePlus2, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { appendText, fakeHash, modifyByte } from '../api/attackerApi';
import { getApiError } from '../api/axiosClient';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { HashDisplay } from '../components/common/HashDisplay';
import { InfoRow } from '../components/common/InfoRow';
import { ChangedBlocksPanel } from '../components/dashboard/ChangedBlocksPanel';
import type { AttackResult, FileMetadata, LatestAttack } from '../types';

interface AttackerSimulationProps {
  files: FileMetadata[];
  onAttackReady: (attack: LatestAttack) => void;
  onRefresh: () => Promise<void>;
}

export function AttackerSimulation({ files, onAttackReady, onRefresh }: AttackerSimulationProps) {
  const [selectedFileId, setSelectedFileId] = useState<number>(files[0]?.id || 0);
  const [appendValue, setAppendValue] = useState(' nội dung bị kẻ tấn công chèn thêm');
  const [result, setResult] = useState<AttackResult | null>(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function runAttack(type: 'byte' | 'append' | 'fake') {
    const fileId = selectedFileId || files[0]?.id;
    if (!fileId) {
      setError('Cần đăng ký file gốc trước khi chạy mô phỏng tấn công.');
      return;
    }
    setLoading(type);
    setError('');
    try {
      let response: AttackResult;
      if (type === 'byte') {
        response = await modifyByte(fileId);
      } else if (type === 'append') {
        response = await appendText(fileId, appendValue);
      } else {
        response = await fakeHash(fileId);
      }
      setResult(response);
      const targetFile = files.find((file) => file.id === fileId);
      onAttackReady({
        file_id: fileId,
        file_name: targetFile?.original_name || `File #${fileId}`,
        attack_type: type === 'byte' ? 'Sửa một byte' : type === 'append' ? 'Chèn nội dung' : 'Giả mạo hash/HMAC',
        result: response,
      });
      await onRefresh();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading('');
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>}
      <Card title="Chọn tài liệu mục tiêu">
        <select
          className="min-h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
          value={selectedFileId || files[0]?.id || ''}
          onChange={(event) => setSelectedFileId(Number(event.target.value))}
        >
          {files.length === 0 && <option value="">Chưa có file nào</option>}
          {files.map((file) => (
            <option key={file.id} value={file.id}>
              #{file.id} {file.original_name}
            </option>
          ))}
        </select>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Hành động tấn công" subtitle="Mỗi hành động sẽ sửa nội dung file hoặc thử giả mạo metadata xác thực.">
          <div className="space-y-4">
            <Button icon={<Binary className="h-4 w-4" />} onClick={() => runAttack('byte')} disabled={loading === 'byte'}>
              {loading === 'byte' ? 'Đang sửa byte...' : 'Sửa một byte'}
            </Button>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Nội dung chèn vào file</label>
              <textarea
                className="min-h-24 w-full rounded-md border border-line p-3 text-sm"
                value={appendValue}
                onChange={(event) => setAppendValue(event.target.value)}
              />
              <Button icon={<FilePlus2 className="h-4 w-4" />} onClick={() => runAttack('append')} disabled={loading === 'append'}>
                {loading === 'append' ? 'Đang chèn...' : 'Chèn nội dung'}
              </Button>
            </div>
            <Button variant="danger" icon={<ShieldOff className="h-4 w-4" />} onClick={() => runAttack('fake')} disabled={loading === 'fake'}>
              {loading === 'fake' ? 'Đang kiểm tra...' : 'Giả mạo hash/HMAC'}
            </Button>
          </div>
        </Card>

        <Card title="Kết quả tấn công" actions={result ? <Badge status={result.result} /> : undefined}>
          {!result ? (
            <EmptyState title="Chưa có kết quả" message="Chọn file mục tiêu và chạy một hành động tấn công." />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">{result.note}</p>
              <div>
                <InfoRow label="Nội dung bị đổi" value={result.content_changed ? 'Có' : 'Không'} />
                <InfoRow label="Kiểm tra HMAC" value={result.hmac_valid ? 'Hợp lệ' : 'Thất bại'} />
                {result.attacker_file_path && <InfoRow label="Bản sao attacker" value={result.attacker_file_path} />}
              </div>
              <HashDisplay label="SHA-256 bản gốc" value={result.original_sha256} />
              <HashDisplay label="SHA-256 bản bị tấn công" value={result.attacker_sha256} />
            </div>
          )}
        </Card>
      </div>

      {result && (
        <Card title="Block bị thay đổi" subtitle="Merkle block hash giúp xác định vị trí nội dung bị sửa ở mức block.">
          <ChangedBlocksPanel blocks={result.changed_blocks} />
        </Card>
      )}
    </div>
  );
}
