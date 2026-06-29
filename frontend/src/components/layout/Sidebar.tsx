'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, Warehouse, FileInput, FileOutput,
  Users, TrendingUp, BarChart3, LogOut, ShoppingBag,
  ChevronLeft, Menu, UserCog, Moon, Sun, Bell, X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/materials', label: 'Material Master', icon: <Package size={17} />, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER','PROCUREMENT_OFFICER'] },
      { href: '/inventory', label: 'Inventory', icon: <Warehouse size={17} />, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER'] },
      { href: '/srv', label: 'Store Receipt (SRV)', icon: <FileInput size={17} />, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER','PROCUREMENT_OFFICER'] },
      { href: '/siv', label: 'Store Issue (SIV)', icon: <FileOutput size={17} />, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER'] },
    ],
  },
  {
    label: 'Procurement',
    items: [
      { href: '/suppliers', label: 'Suppliers', icon: <Users size={17} />, roles: ['ADMIN','STORE_MANAGER'] },
      { href: '/bidding', label: 'Bidding Desk', icon: <ShoppingBag size={17} /> },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/forecasting', label: 'Forecasting', icon: <TrendingUp size={17} />, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER','PROCUREMENT_OFFICER'] },
      { href: '/reports', label: 'Reports', icon: <BarChart3 size={17} />, roles: ['ADMIN','STORE_MANAGER','INVENTORY_OFFICER','PROCUREMENT_OFFICER'] },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/users', label: 'User Management', icon: <UserCog size={17} />, roles: ['ADMIN'] },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ collapsed, onMobileClose }: { collapsed: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrator', STORE_MANAGER: 'Store Manager',
    INVENTORY_OFFICER: 'Inventory Officer', PROCUREMENT_OFFICER: 'Procurement Officer', VENDOR: 'Vendor',
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'from-red-500 to-rose-600', STORE_MANAGER: 'from-blue-500 to-blue-600',
    INVENTORY_OFFICER: 'from-emerald-500 to-green-600', PROCUREMENT_OFFICER: 'from-violet-500 to-purple-600',
    VENDOR: 'from-amber-500 to-orange-600',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center px-4 py-5 border-b border-white/10', collapsed ? 'justify-center' : 'gap-3')}>
        {!collapsed && (
          <>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/40 flex-shrink-0">
              <Package size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wider">MMIS</p>
              <p className="text-blue-400 text-xs">Material Management</p>
            </div>
          </>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
        )}
      </div>

      {/* User card */}
      {!collapsed && user && (
        <div className="mx-3 my-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg', roleColors[user.role] || 'from-blue-500 to-blue-600')}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.name}</p>
              <p className="text-blue-400 text-xs truncate">{roleLabel[user.role]}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-5 px-2">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (!('roles' in item) || !item.roles) return true;
            if (!user) return false;
            return item.roles.includes(user.role);
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-3 mb-1">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                        collapsed ? 'justify-center px-2.5' : 'px-3',
                        isActive
                          ? 'text-white bg-blue-600 shadow-lg shadow-blue-900/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/8'
                      )}
                      style={!isActive ? {} : {}}
                    >
                      <span className={cn('flex-shrink-0 transition-colors', isActive ? 'text-white' : 'text-gray-400')}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={toggleTheme}
          className={cn('flex items-center gap-3 py-2 rounded-xl w-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all', collapsed ? 'justify-center px-2' : 'px-3')}
          title={collapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={logout}
          className={cn('flex items-center gap-3 py-2 rounded-xl w-full text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all', collapsed ? 'justify-center px-2' : 'px-3')}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={17} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-72 z-50 transition-transform duration-300 lg:hidden',
        'bg-gray-950',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <button onClick={onMobileClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
          <X size={18} />
        </button>
        <SidebarContent collapsed={false} onMobileClose={onMobileClose} />
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300 bg-gray-950',
        collapsed ? 'w-16' : 'w-64'
      )}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white z-10 transition-all hover:bg-gray-700"
        >
          <ChevronLeft size={12} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
        <SidebarContent collapsed={collapsed} />
      </aside>
    </>
  );
}

export function TopBar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-none">{user.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{user.role.replace(/_/g, ' ')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
