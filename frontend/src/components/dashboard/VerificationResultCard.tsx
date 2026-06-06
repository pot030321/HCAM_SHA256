import type { VerificationResult } from '../../types';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { HashDisplay } from '../common/HashDisplay';
import { ChangedBlocksPanel } from './ChangedBlocksPanel';

interface VerificationResultCardProps {
  result: VerificationResult;
}

function explainResult(result: VerificationResult) {
  if (result.result === 'VALID') {
    return 'Server trả về VALID: file B upload khớp bản gốc đã đăng ký. Có thể tin rằng nội dung không bị thay đổi.';
  }
  if (result.result === 'MODIFIED') {
    return 'Server trả về MODIFIED: file B upload khác bản gốc. SHA-256 hoặc Merkle Root không khớp, nên tài liệu đã bị sửa trên đường truyền hoặc sau khi nhận.';
  }
  if (result.result === 'FORGED') {
    return 'Server trả về FORGED: metadata xác thực bị giả mạo hoặc HMAC không hợp lệ. Attacker có thể sửa hash, nhưng không có khóa bí mật để tạo HMAC đúng.';
  }
  return 'Server chưa xác định được trạng thái của file.';
}

export function VerificationResultCard({ result }: VerificationResultCardProps) {
  return (
    <Card title="Server trả kết quả kiểm tra" actions={<Badge status={result.result} />}>
      <div className="space-y-4">
        <div className="rounded-md border border-line bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-slate-900">{explainResult(result)}</p>
          <p className="mt-2">{result.note}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <HashDisplay label="SHA-256 bản gốc server lưu" value={result.old_sha256} />
          <HashDisplay label="SHA-256 file B upload" value={result.new_sha256} />
          <HashDisplay label="Merkle Root bản gốc server lưu" value={result.old_merkle_root} />
          <HashDisplay label="Merkle Root file B upload" value={result.new_merkle_root} />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold">Block bị thay đổi theo Merkle Tree</h3>
          <ChangedBlocksPanel blocks={result.changed_blocks} />
        </div>
      </div>
    </Card>
  );
}
