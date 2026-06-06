import { useEffect, useState } from 'react';
import { getApiError } from './api/axiosClient';
import { getFiles } from './api/fileApi';
import { MainLayout } from './layouts/MainLayout';
import { AttackerSimulation } from './pages/AttackerSimulation';
import { ServerDashboard } from './pages/ServerDashboard';
import { UserDashboard } from './pages/UserDashboard';
import type { FileMetadata, LatestAttack, PageKey } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('user');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [latestAttack, setLatestAttack] = useState<LatestAttack | null>(null);
  const [error, setError] = useState('');

  async function refreshData() {
    try {
      setError('');
      const fileResponse = await getFiles();
      setFiles(fileResponse);
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
      {activePage === 'user' && <UserDashboard files={files} latestAttack={latestAttack} onRefresh={refreshData} />}
      {activePage === 'attacker' && <AttackerSimulation files={files} onAttackReady={setLatestAttack} onRefresh={refreshData} />}
      {activePage === 'server' && <ServerDashboard files={files} />}
    </MainLayout>
  );
}
