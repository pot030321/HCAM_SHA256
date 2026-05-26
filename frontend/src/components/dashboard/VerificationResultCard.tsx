import type { VerificationResult } from '../../types';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { HashDisplay } from '../common/HashDisplay';
import { ChangedBlocksPanel } from './ChangedBlocksPanel';

interface VerificationResultCardProps {
  result: VerificationResult;
}

export function VerificationResultCard({ result }: VerificationResultCardProps) {
  return (
    <Card title="Verification Result" actions={<Badge status={result.result} />}>
      <div className="space-y-4">
        <p className="text-sm text-slate-700">{result.note}</p>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <HashDisplay label="Old SHA-256" value={result.old_sha256} />
          <HashDisplay label="New SHA-256" value={result.new_sha256} />
          <HashDisplay label="Old Merkle Root" value={result.old_merkle_root} />
          <HashDisplay label="New Merkle Root" value={result.new_merkle_root} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold">Changed Blocks</h3>
          <ChangedBlocksPanel blocks={result.changed_blocks} />
        </div>
      </div>
    </Card>
  );
}
