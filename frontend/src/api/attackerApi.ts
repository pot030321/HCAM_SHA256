import { axiosClient } from './axiosClient';
import type { AttackResult } from '../types';

export async function modifyByte(fileId: number): Promise<AttackResult> {
  const response = await axiosClient.post<AttackResult>(`/attacker/modify-byte/${fileId}`);
  return response.data;
}

export async function appendText(fileId: number, text: string): Promise<AttackResult> {
  const formData = new FormData();
  formData.append('text', text);
  const response = await axiosClient.post<AttackResult>(`/attacker/append-text/${fileId}`, formData);
  return response.data;
}

export async function fakeHash(fileId: number): Promise<AttackResult> {
  const response = await axiosClient.post<AttackResult>(`/attacker/fake-hash/${fileId}`);
  return response.data;
}
