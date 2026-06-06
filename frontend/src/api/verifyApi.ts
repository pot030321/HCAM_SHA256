import { axiosClient } from './axiosClient';
import type { VerificationResult } from '../types';

export async function verifyFile(fileId: number, file: File): Promise<VerificationResult> {
  const formData = new FormData();
  formData.append('uploaded_file', file);
  const response = await axiosClient.post<VerificationResult>(`/verify/${fileId}`, formData);
  return response.data;
}

export async function verifyAttackerCopy(fileId: number, attackerFilePath: string): Promise<VerificationResult> {
  const formData = new FormData();
  formData.append('attacker_file_path', attackerFilePath);
  const response = await axiosClient.post<VerificationResult>(`/verify/attacker-copy/${fileId}`, formData);
  return response.data;
}
