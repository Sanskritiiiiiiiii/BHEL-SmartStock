'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, Warehouse, FileInput, FileOutput,
  Users, TrendingUp, BarChart3, LogOut, ShoppingBag,
  Menu, UserCog, Moon, Sun, X, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useState } from 'react';

const navGroups = [
  { label: 'Overview', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Operations', items: [
    { href: '/materials', label: 'Material Master', icon: Package, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER','PROCUREMENT_OFFICER'] },
    { href: '/inventory', label: 'Inventory', icon: Warehouse, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER'] },
    { href: '/srv', label: 'Store Receipt (SRV)', icon: FileInput, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER','PROCUREMENT_OFFICER'] },
    { href: '/siv', label: 'Store Issue (SIV)', icon: FileOutput, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER'] },
  ]},
  { label: 'Procurement', items: [
    { href: '/suppliers', label: 'Suppliers', icon: Users, roles: ['ADMIN','STORE_MANAGER'] },
    { href: '/bidding', label: 'Bidding Desk', icon: ShoppingBag },
  ]},
  { label: 'Analytics', items: [
    { href: '/forecasting', label: 'Forecasting', icon: TrendingUp, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER','PROCUREMENT_OFFICER'] },
    { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER','PROCUREMENT_OFFICER'] },
  ]},
  { label: 'Admin', items: [
    { href: '/users', label: 'User Management', icon: UserCog, roles: ['ADMIN'] },
  ]},
];

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrator', STORE_MANAGER: 'Store Manager',
  INVENTORY_OFFICER: 'Inventory Officer', PROCUREMENT_OFFICER: 'Procurement Officer', VENDOR: 'Vendor',
};
const roleDot: Record<string, string> = {
  ADMIN: 'bg-red-500', STORE_MANAGER: 'bg-blue-500',
  INVENTORY_OFFICER: 'bg-emerald-500', PROCUREMENT_OFFICER: 'bg-violet-500', VENDOR: 'bg-amber-500',
};

function SidebarContent({ collapsed, onItemClick }: { collapsed: boolean; onItemClick?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-gray-100 dark:border-gray-800/80 flex-shrink-0', collapsed ? 'justify-center' : 'gap-2.5')}>
        <div className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
          <Package size={16} className="text-white dark:text-gray-900" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-gray-900 dark:text-white font-bold text-sm leading-none">MMIS</p>
            <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5">Material Management</p>
          </div>
        )}
      </div>

      {/* User */}
      {!collapsed && user && (
        <div className="mx-3 mt-3 mb-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{user.name}</p>
            <div className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', roleDot[user.role])} />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{roleLabel[user.role]}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-4 px-2.5 mt-1">
        {navGroups.map(group => {
          const visible = group.items.filter(item => !('roles' in item) || !item.roles || (user && item.roles.includes(user.role)));
          if (!visible.length) return null;
          return (
            <div key={group.label}>
              {!collapsed && <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest px-2.5 mb-1">{group.label}</p>}
              <div className="space-y-0.5">
                {visible.map(item => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={onItemClick} title={collapsed ? item.label : undefined}
                      className={cn('flex items-center gap-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                        collapsed ? 'justify-center px-2' : 'px-2.5',
                        isActive ? 'bg-gray-900 dark:bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                      )}>
                      <Icon size={16} className="flex-shrink-0" strokeWidth={2} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2.5 border-t border-gray-100 dark:border-gray-800/80 space-y-0.5 flex-shrink-0">
        <button onClick={logout} title={collapsed ? 'Logout' : undefined}
          className={cn('flex items-center gap-3 py-2 rounded-lg w-full text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors', collapsed ? 'justify-center px-2' : 'px-2.5')}>
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

interface SidebarProps { mobileOpen: boolean; onMobileClose: () => void; }
export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={onMobileClose} />}

      <aside className={cn('fixed top-0 left-0 h-full w-72 z-50 transition-transform duration-300 lg:hidden bg-white dark:bg-[#0f1216] border-r border-gray-100 dark:border-gray-800', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <button onClick={onMobileClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 z-10">
          <X size={18} />
        </button>
        <SidebarContent collapsed={false} onItemClick={onMobileClose} />
      </aside>

      <aside className={cn('hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300 bg-white dark:bg-[#0f1216] border-r border-gray-100 dark:border-gray-800', collapsed ? 'w-[68px]' : 'w-64')}>
        <SidebarContent collapsed={collapsed} />
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-3 -right-3 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shadow-sm hover:shadow transition-all">
          {collapsed ? <ChevronsRight size={11} /> : <ChevronsLeft size={11} />}
        </button>
      </aside>
    </>
  );
}

export function TopBar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0b0d11]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/80 px-4 lg:px-6 h-16 flex items-center flex-shrink-0">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Menu size={20} />
          </button>
          <h1 className="text-[15px] font-bold text-gray-900 dark:text-white">{title}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {user && (
            <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-none">{user.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{user.role.replace(/_/g,' ')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
