import { axiosClient } from './axiosClient';
import type { VerificationLog } from '../types';

export async function getLogs(): Promise<VerificationLog[]> {
  const response = await axiosClient.get<VerificationLog[]>('/logs');
  return response.data;
}
