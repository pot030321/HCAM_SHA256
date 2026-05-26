import { RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { useState } from 'react';
import { getApiError } from '../api/axiosClient';
import { registerFile } from '../api/fileApi';
import { verifyFile } from '../api/verifyApi';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { FileUploadBox } from '../components/common/FileUploadBox';
import { HashDisplay } from '../components/common/HashDisplay';
import { VerificationResultCard } from '../components/dashboard/VerificationResultCard';
import type { FileMetadata, VerificationResult } from '../types';

interface UserDashboardProps {
  files: FileMetadata[];
  onRefresh: () => Promise<void>;
}

export function UserDashboard({ files, onRefresh }: UserDashboardProps) {
  const [registerUpload, setRegisterUpload] = useState<File | null>(null);
  const [verifyUpload, setVerifyUpload] = useState<File | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number>(files[0]?.id || 0);
  const [registeredResult, setRegisteredResult] = useState<FileMetadata | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function handleRegister() {
    if (!registerUpload) {
      setError('Choose a file before registering.');
      return;
    }
    setLoading('register');
    setError('');
    try {
      const result = await registerFile(registerUpload);
      setRegisteredResult(result);
      setSelectedFileId(result.id);
      await onRefresh();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading('');
    }
  }

  async function handleVerify() {
    const fileId = selectedFileId || files[0]?.id;
    if (!fileId) {
      setError('Register a file before verifying.');
      return;
    }
    if (!verifyUpload) {
      setError('Choose a file to verify.');
      return;
    }
    setLoading('verify');
    setError('');
    try {
      const result = await verifyFile(fileId, verifyUpload);
      setVerificationResult(result);
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Register Original File" subtitle="The server hashes actual file bytes, splits blocks, builds the Merkle Root, and signs metadata with HMAC.">
          <div className="space-y-4">
            <FileUploadBox label="Upload original file" file={registerUpload} onChange={setRegisterUpload} />
            <Button icon={<Upload className="h-4 w-4" />} onClick={handleRegister} disabled={loading === 'register'}>
              {loading === 'register' ? 'Registering...' : 'Register'}
            </Button>
            {registeredResult && (
              <div className="space-y-3">
                <HashDisplay label="SHA-256" value={registeredResult.sha256} />
                <HashDisplay label="Merkle Root" value={registeredResult.merkle_root} />
                <HashDisplay label="HMAC-SHA256" value={registeredResult.hmac_sha256} />
              </div>
            )}
          </div>
        </Card>

        <Card title="Verify File" subtitle="A matching file returns VALID. Same name with different content returns MODIFIED.">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Registered file</span>
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
            </label>
            <FileUploadBox label="Upload file to verify" file={verifyUpload} onChange={setVerifyUpload} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button icon={<ShieldCheck className="h-4 w-4" />} onClick={handleVerify} disabled={loading === 'verify'}>
                {loading === 'verify' ? 'Verifying...' : 'Verify'}
              </Button>
              <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={onRefresh}>
                Refresh
              </Button>
            </div>
          </div>
        </Card>
      </div>
      {verificationResult && <VerificationResultCard result={verificationResult} />}
    </div>
  );
}
