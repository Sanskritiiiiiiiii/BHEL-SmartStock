'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  FileInput,
  FileOutput,
  Users,
  TrendingUp,
  BarChart3,
  LogOut,
  ShoppingBag,
  ChevronLeft,
  Menu,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  {
    href: '/materials',
    label: 'Material Master',
    icon: <Package size={18} />,
    roles: ['ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER', 'PROCUREMENT_OFFICER'],
  },
  {
    href: '/inventory',
    label: 'Inventory',
    icon: <Warehouse size={18} />,
    roles: ['ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER'],
  },
  {
    href: '/srv',
    label: 'SRV',
    icon: <FileInput size={18} />,
    roles: ['ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER', 'PROCUREMENT_OFFICER'],
  },
  {
    href: '/siv',
    label: 'SIV',
    icon: <FileOutput size={18} />,
    roles: ['ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER'],
  },
  {
    href: '/suppliers',
    label: 'Suppliers',
    icon: <Users size={18} />,
    roles: ['ADMIN', 'STORE_MANAGER'],
  },
  { href: '/bidding', label: 'Bidding Desk', icon: <ShoppingBag size={18} /> },
  {
    href: '/forecasting',
    label: 'Forecasting',
    icon: <TrendingUp size={18} />,
    roles: ['ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER', 'PROCUREMENT_OFFICER'],
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: <BarChart3 size={18} />,
    roles: ['ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER', 'PROCUREMENT_OFFICER'],
  },
  {
    href: '/users',
    label: 'User Management',
    icon: <UserCog size={18} />,
    roles: ['ADMIN'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrator',
    STORE_MANAGER: 'Store Manager',
    INVENTORY_OFFICER: 'Inventory Officer',
    PROCUREMENT_OFFICER: 'Procurement Officer',
    VENDOR: 'Vendor',
  };

  return (
    <aside
      className={cn(
        'h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 sticky top-0 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">MMIS</h1>
              <p className="text-xs text-gray-400 leading-none">Material Management</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ml-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{roleLabel[user.role] || user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 py-2.5 mx-2 rounded-lg transition-all text-sm',
                collapsed ? 'justify-center px-2' : 'px-3',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-2 border-t border-gray-800">
        {collapsed && user && (
          <div className="flex justify-center mb-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 py-2.5 w-full rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all text-sm',
            collapsed ? 'justify-center px-2' : 'px-3'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
