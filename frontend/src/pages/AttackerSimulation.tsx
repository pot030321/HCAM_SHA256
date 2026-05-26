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
import type { AttackResult, FileMetadata } from '../types';

interface AttackerSimulationProps {
  files: FileMetadata[];
  onRefresh: () => Promise<void>;
}

export function AttackerSimulation({ files, onRefresh }: AttackerSimulationProps) {
  const [selectedFileId, setSelectedFileId] = useState<number>(files[0]?.id || 0);
  const [appendValue, setAppendValue] = useState(' attacker text');
  const [result, setResult] = useState<AttackResult | null>(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function runAttack(type: 'byte' | 'append' | 'fake') {
    const fileId = selectedFileId || files[0]?.id;
    if (!fileId) {
      setError('Register a file before running attacker simulations.');
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
      <Card title="Select Target File">
        <select
          className="min-h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
          value={selectedFileId || files[0]?.id || ''}
          onChange={(event) => setSelectedFileId(Number(event.target.value))}
        >
          {files.length === 0 && <option value="">No files registered</option>}
          {files.map((file) => (
            <option key={file.id} value={file.id}>
              #{file.id} {file.original_name}
            </option>
          ))}
        </select>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Attack Actions" subtitle="Each action changes content or tries to forge integrity metadata.">
          <div className="space-y-4">
            <Button icon={<Binary className="h-4 w-4" />} onClick={() => runAttack('byte')} disabled={loading === 'byte'}>
              {loading === 'byte' ? 'Modifying...' : 'Modify One Byte'}
            </Button>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Text to append</label>
              <textarea
                className="min-h-24 w-full rounded-md border border-line p-3 text-sm"
                value={appendValue}
                onChange={(event) => setAppendValue(event.target.value)}
              />
              <Button icon={<FilePlus2 className="h-4 w-4" />} onClick={() => runAttack('append')} disabled={loading === 'append'}>
                {loading === 'append' ? 'Appending...' : 'Append Text'}
              </Button>
            </div>
            <Button variant="danger" icon={<ShieldOff className="h-4 w-4" />} onClick={() => runAttack('fake')} disabled={loading === 'fake'}>
              {loading === 'fake' ? 'Testing...' : 'Fake Hash Attack'}
            </Button>
          </div>
        </Card>

        <Card title="Attack Result" actions={result ? <Badge status={result.result} /> : undefined}>
          {!result ? (
            <EmptyState title="No attack result" message="Choose a target file and run an attack action." />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">{result.note}</p>
              <div>
                <InfoRow label="Content changed" value={result.content_changed ? 'Yes' : 'No'} />
                <InfoRow label="HMAC verification" value={result.hmac_valid ? 'Passed' : 'Failed'} />
                {result.attacker_file_path && <InfoRow label="Attacker copy" value={result.attacker_file_path} />}
              </div>
              <HashDisplay label="Original SHA-256" value={result.original_sha256} />
              <HashDisplay label="Attacker SHA-256" value={result.attacker_sha256} />
            </div>
          )}
        </Card>
      </div>

      {result && (
        <Card title="Changed Blocks" subtitle="Merkle block hashes identify where the byte-level content changed.">
          <ChangedBlocksPanel blocks={result.changed_blocks} />
        </Card>
      )}
    </div>
  );
}
