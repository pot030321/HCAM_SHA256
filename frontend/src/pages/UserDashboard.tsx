import { ArrowRight, RefreshCw, Server, ShieldCheck, Upload, UserRound, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { getApiError } from '../api/axiosClient';
import { registerFile } from '../api/fileApi';
import { verifyFile } from '../api/verifyApi';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { FileUploadBox } from '../components/common/FileUploadBox';
import { HashDisplay } from '../components/common/HashDisplay';
import { VerificationResultCard } from '../components/dashboard/VerificationResultCard';
import type { FileMetadata, LatestAttack, VerificationResult } from '../types';

interface UserDashboardProps {
  files: FileMetadata[];
  latestAttack: LatestAttack | null;
  onRefresh: () => Promise<void>;
}

export function UserDashboard({ files, latestAttack, onRefresh }: UserDashboardProps) {
  const [senderFile, setSenderFile] = useState<File | null>(null);
  const [receiverFile, setReceiverFile] = useState<File | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number>(files[0]?.id || 0);
  const [registeredResult, setRegisteredResult] = useState<FileMetadata | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const selectedOriginal = files.find((file) => file.id === (selectedFileId || files[0]?.id)) || registeredResult || files[0];

  async function handleRegister() {
    if (!senderFile) {
      setError('Nguoi gui A can chon file truoc khi tao ho so goc tren server.');
      return;
    }
    setLoading('register');
    setError('');
    try {
      const result = await registerFile(senderFile);
      setRegisteredResult(result);
      setSelectedFileId(result.id);
      setVerificationResult(null);
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
      setError('Chua co ho so goc tren server. Hay de nguoi gui A dang ky file truoc.');
      return;
    }
    if (!receiverFile) {
      setError('Nguoi nhan B can chon file nhan duoc de kiem tra.');
      return;
    }
    setLoading('verify');
    setError('');
    try {
      const result = await verifyFile(fileId, receiverFile);
      setVerificationResult(result);
      await onRefresh();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading('');
    }
  }

  function showLatestAttackResult() {
    if (!latestAttack) {
      setError('Chua co ket qua tan cong. Vao man Ke tan cong va bam Sua mot byte hoac Chen noi dung truoc.');
      return;
    }
    setError('');
    setSelectedFileId(latestAttack.file_id);
    setVerificationResult({
      result: latestAttack.result.result,
      old_sha256: latestAttack.result.original_sha256,
      new_sha256: latestAttack.result.attacker_sha256,
      old_merkle_root: latestAttack.result.original_merkle_root,
      new_merkle_root: latestAttack.result.attacker_merkle_root,
      changed_blocks: latestAttack.result.changed_blocks,
      note: latestAttack.result.note,
    });
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>}

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft md:p-5">
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
          Demo nay chay tren mot may local. A, B va attacker la cac vai tro logic trong mo phong, khong phai hai may that dang gui file qua Internet.
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
          <div className="rounded-md border border-cyan-200 bg-cyan-50 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-cyan-950">
              <UserRound className="h-5 w-5" />
              Nguoi gui A
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">Chon tai lieu goc va gui len server de tao ho so xac thuc.</p>
          </div>
          <div className="hidden items-center text-slate-400 md:flex">
            <ArrowRight className="h-5 w-5" />
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-950">
              <Server className="h-5 w-5" />
              Server
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">Luu SHA-256, Merkle Root, HMAC-SHA256. Server khong tu xac nhan B da nhan file.</p>
          </div>
          <div className="hidden items-center text-slate-400 md:flex">
            <ArrowRight className="h-5 w-5" />
          </div>
          <div className="rounded-md border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-violet-950">
              <UsersRound className="h-5 w-5" />
              Nguoi nhan B
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">Tai file minh nhan duoc len de server so sanh voi ho so goc.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Buoc 1: A tao ho so goc" subtitle="Day la buoc dang ky dau van tay tai lieu. No chua co nghia la B da nhan file.">
          <div className="space-y-4">
            <FileUploadBox label="A chon file goc" file={senderFile} onChange={setSenderFile} />
            <Button icon={<Upload className="h-4 w-4" />} onClick={handleRegister} disabled={loading === 'register'}>
              {loading === 'register' ? 'Dang tao ho so...' : 'Gui len server de tao ho so'}
            </Button>
            {registeredResult && (
              <div className="space-y-3">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
                  Server da luu ho so goc #{registeredResult.id}. Buoc tiep theo: B upload file nhan duoc de kiem tra.
                </div>
                <HashDisplay label="SHA-256 goc" value={registeredResult.sha256} />
                <HashDisplay label="Merkle Root goc" value={registeredResult.merkle_root} />
                <HashDisplay label="HMAC-SHA256 goc" value={registeredResult.hmac_sha256} />
              </div>
            )}
          </div>
        </Card>

        <Card title="Buoc 2: B kiem tra file nhan duoc" subtitle="B chon ho so goc tren server, roi upload file nhan duoc de xac minh.">
          <div className="space-y-4">
            {latestAttack && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-900">
                <div className="font-bold">Co ket qua tan cong vua tao</div>
                <div>
                  Muc tieu: #{latestAttack.file_id} {latestAttack.file_name}. Kieu tan cong: {latestAttack.attack_type}.
                </div>
                <Button className="mt-3" variant="danger" icon={<ShieldCheck className="h-4 w-4" />} onClick={showLatestAttackResult}>
                  Hien thi ket qua file attacker
                </Button>
              </div>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Ho so goc tren server</span>
              <select
                className="min-h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
                value={selectedFileId || files[0]?.id || ''}
                onChange={(event) => setSelectedFileId(Number(event.target.value))}
              >
                {files.length === 0 && <option value="">Chua co ho so goc nao</option>}
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    #{file.id} {file.original_name}
                  </option>
                ))}
              </select>
            </label>

            {selectedOriginal && (
              <div className="rounded-md border border-line bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                Dang so sanh voi ban goc: <span className="font-bold">#{selectedOriginal.id} {selectedOriginal.original_name}</span>
              </div>
            )}

            <FileUploadBox label="B chon file nhan duoc" file={receiverFile} onChange={setReceiverFile} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button icon={<ShieldCheck className="h-4 w-4" />} onClick={handleVerify} disabled={loading === 'verify'}>
                {loading === 'verify' ? 'Dang kiem tra...' : 'Kiem tra toan ven'}
              </Button>
              <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={onRefresh}>
                Lam moi ho so
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {verificationResult && <VerificationResultCard result={verificationResult} />}
    </div>
  );
}
