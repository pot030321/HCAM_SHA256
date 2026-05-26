import { useEffect, useState } from 'react';
import { getApiError } from './api/axiosClient';
import { getFiles } from './api/fileApi';
import { getLogs } from './api/logApi';
import { MainLayout } from './layouts/MainLayout';
import { AttackerSimulation } from './pages/AttackerSimulation';
import { ServerDashboard } from './pages/ServerDashboard';
import { TheoryPage } from './pages/TheoryPage';
import { UserDashboard } from './pages/UserDashboard';
import type { FileMetadata, PageKey, VerificationLog } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('user');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [error, setError] = useState('');

  async function refreshData() {
    try {
      setError('');
      const [fileResponse, logResponse] = await Promise.all([getFiles(), getLogs()]);
      setFiles(fileResponse);
      setLogs(logResponse);
    } catch (err) {
      setError(getApiError(err));
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <MainLayout activePage={activePage} onPageChange={setActivePage}>
      {error && <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>}
      {activePage === 'user' && <UserDashboard files={files} onRefresh={refreshData} />}
      {activePage === 'server' && <ServerDashboard files={files} logs={logs} />}
      {activePage === 'attacker' && <AttackerSimulation files={files} onRefresh={refreshData} />}
      {activePage === 'theory' && <TheoryPage />}
    </MainLayout>
  );
}
