// ============================================================
// AutoApply AI — App Shell Layout
// ============================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Link2, Activity, Brain,
  LogOut, Settings, HelpCircle, User as UserIcon
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Guard routing logic
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Loading session context...
      </div>
    );
  }

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Assets', path: '/assets', icon: FileText },
    { label: 'Aggregators', path: '/aggregators', icon: Link2 },
    { label: 'Activity Feed', path: '/activity', icon: Activity },
    { label: 'AI Insights', path: '/insights', icon: Brain },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-neutral-900 bg-neutral-950 flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            ✦ AutoApply AI
          </Link>

          {/* Nav list */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-400 border-l-2 border-primary-500'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col gap-4">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              pathname === '/settings'
                ? 'bg-primary-500/10 text-primary-400'
                : 'text-neutral-400 hover:bg-neutral-900'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-950/20 transition-all cursor-pointer text-left w-full"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>

          {/* Profile Card */}
          <div className="flex items-center gap-3 border-t border-neutral-900 pt-4 mt-2">
            <div className="h-8 w-8 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold truncate">{user.name}</span>
              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{user.tier} plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Wrapper ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-neutral-900 bg-neutral-950 px-8 flex items-center justify-between">
          <h1 className="text-lg font-bold capitalize">
            {pathname.split('/')[1] || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
              ● API connected
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-neutral-900/10">
          {children}
        </main>
      </div>
    </div>
  );
}
