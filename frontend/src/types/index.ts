export type Status = 'VALID' | 'MODIFIED' | 'FORGED' | 'UNKNOWN';

export type PageKey = 'user' | 'server' | 'attacker';

export interface FileMetadata {
  id: number;
  original_name: string;
  file_size: number;
  sha256: string;
  merkle_root: string;
  hmac_sha256: string;
  created_at: string;
}

export interface FileDetail extends FileMetadata {
  block_hashes: string[];
}

export interface VerificationResult {
  result: Status;
  old_sha256: string | null;
  new_sha256: string | null;
  old_merkle_root: string | null;
  new_merkle_root: string | null;
  changed_blocks: number[];
  note: string;
}

export interface AttackResult {
  result: Status;
  original_sha256: string | null;
  attacker_sha256: string | null;
  original_merkle_root: string | null;
  attacker_merkle_root: string | null;
  changed_blocks: number[];
  content_changed: boolean;
  hmac_valid: boolean;
  note: string;
  attacker_file_path: string | null;
}

export interface LatestAttack {
  file_id: number;
  file_name: string;
  attack_type: string;
  result: AttackResult;
}

export interface VerificationLog {
  id: number;
  file_id: number | null;
  file_name: string;
  result: Status;
  old_sha256: string | null;
  new_sha256: string | null;
  old_merkle_root: string | null;
  new_merkle_root: string | null;
  changed_blocks: number[];
  note: string;
  created_at: string;
}

export interface SecurityEvent {
  id: number;
  category: string;
  event_type: string;
  severity: string;
  file_id: number | null;
  file_name: string | null;
  actor: string;
  source: string | null;
  note: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
