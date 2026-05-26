import { BookOpen, Database, Menu, ShieldCheck, Skull, X } from 'lucide-react';
import { useState } from 'react';
import type { PageKey } from '../types';

interface MainLayoutProps {
  activePage: PageKey;
  onPageChange: (page: PageKey) => void;
  children: React.ReactNode;
}

const navItems = [
  { key: 'user' as PageKey, label: 'User Dashboard', icon: ShieldCheck },
  { key: 'server' as PageKey, label: 'Server Dashboard', icon: Database },
  { key: 'attacker' as PageKey, label: 'Attacker Simulation', icon: Skull },
  { key: 'theory' as PageKey, label: 'Theory', icon: BookOpen },
];

const titles: Record<PageKey, string> = {
  user: 'User Dashboard',
  server: 'Server Dashboard',
  attacker: 'Attacker Simulation',
  theory: 'Theory',
};

export function MainLayout({ activePage, onPageChange, children }: MainLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function selectPage(page: PageKey) {
    onPageChange(page);
    setMenuOpen(false);
  }

  const navigation = (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = activePage === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => selectPage(item.key)}
            className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
              active ? 'bg-cyan-700 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#edf1f5]">
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-72 border-r border-line bg-white p-5 lg:block">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wide text-cyan-800">Master InfoSec Demo</p>
          <h1 className="mt-2 text-xl font-black leading-tight">Document Integrity System</h1>
        </div>
        {navigation}
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-800">InfoSec Demo</p>
            <h1 className="text-base font-black">{titles[activePage]}</h1>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-line"
            title="Toggle navigation"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && <div className="mt-4">{navigation}</div>}
      </header>

      <main className="w-full px-4 py-5 md:px-6 lg:ml-72 lg:w-[calc(100%-18rem)] lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 hidden lg:block">
            <h1 className="text-2xl font-black">{titles[activePage]}</h1>
            <p className="mt-1 text-sm text-slate-600">SHA-256 integrity, Merkle block detection, and HMAC authenticity in one local demo.</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
