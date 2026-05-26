import { axiosClient } from './axiosClient';
import type { FileDetail, FileMetadata } from '../types';

export async function registerFile(file: File): Promise<FileMetadata> {
  const formData = new FormData();
  formData.append('uploaded_file', file);
  const response = await axiosClient.post<FileMetadata>('/files/register', formData);
  return response.data;
}

export async function getFiles(): Promise<FileMetadata[]> {
  const response = await axiosClient.get<FileMetadata[]>('/files');
  return response.data;
}

export async function getFileDetail(fileId: number): Promise<FileDetail> {
  const response = await axiosClient.get<FileDetail>(`/files/${fileId}`);
  return response.data;
}
