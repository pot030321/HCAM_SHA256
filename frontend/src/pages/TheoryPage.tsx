import { Fingerprint, GitBranch, KeyRound, LockKeyhole, ShieldCheck, Zap } from 'lucide-react';
import { Card } from '../components/common/Card';

const items = [
  {
    icon: Fingerprint,
    title: 'SHA-256',
    text: 'SHA-256 is a one-way cryptographic hash function. The system hashes actual file content, not the file name.',
  },
  {
    icon: LockKeyhole,
    title: 'Not Encryption',
    text: 'SHA-256 is not encryption because there is no decrypt operation. A hash can be compared, not reversed.',
  },
  {
    icon: ShieldCheck,
    title: 'Integrity',
    text: 'Data integrity means checking whether the bytes are the same as the trusted original version.',
  },
  {
    icon: Zap,
    title: 'Avalanche Effect',
    text: 'A tiny input change, such as one byte, creates a completely different hash output.',
  },
  {
    icon: GitBranch,
    title: 'Merkle Tree',
    text: 'Block hashes are paired and hashed upward into one root. Changed block indexes show where content changed.',
  },
  {
    icon: KeyRound,
    title: 'HMAC-SHA256',
    text: 'HMAC adds authenticity with a server-side secret key. An attacker can recalculate SHA-256, but cannot create the server HMAC.',
  },
];

export function TheoryPage() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title}>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-800">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.text}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
