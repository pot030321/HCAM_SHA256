import { axiosClient } from './axiosClient';
import type { SecurityEvent, VerificationLog } from '../types';

export async function getLogs(): Promise<VerificationLog[]> {
  const response = await axiosClient.get<VerificationLog[]>('/logs');
  return response.data;
}

export async function getSecurityLogs(): Promise<SecurityEvent[]> {
  const response = await axiosClient.get<SecurityEvent[]>('/logs/security');
  return response.data;
}
