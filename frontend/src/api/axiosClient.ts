import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  timeout: 15000,
});

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.detail) {
      return String(error.response.data.detail);
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'The backend is not available or returned an unexpected response.';
}
