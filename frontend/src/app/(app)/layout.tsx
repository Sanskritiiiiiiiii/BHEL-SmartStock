'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar, TopBar } from '@/components/layout/Sidebar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/materials': 'Material Master',
  '/inventory': 'Inventory Management',
  '/srv': 'Store Receipt Vouchers',
  '/siv': 'Store Issue Vouchers',
  '/suppliers': 'Suppliers',
  '/bidding': 'Bidding Desk',
  '/forecasting': 'Demand Forecasting',
  '/reports': 'Reports',
  '/users': 'User Management',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas dark:bg-canvas-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-gray-900 font-bold text-xs">M</span>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const title = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] || 'MMIS';

  return (
    <div className="flex h-screen overflow-hidden bg-canvas dark:bg-canvas-dark">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="animate-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
