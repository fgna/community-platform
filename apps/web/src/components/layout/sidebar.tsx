'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Rss,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/feed', icon: Rss, label: 'Feed' },
  { href: '/courses', icon: BookOpen, label: 'Courses' },
  { href: '/events', icon: Calendar, label: 'Events' },
  { href: '/members', icon: Users, label: 'Members' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 relative"
      style={{
        width: collapsed ? '68px' : 'var(--sidebar-width)',
        background: 'var(--theme-surface)',
        backdropFilter: 'blur(var(--theme-blur))',
        borderRight: '1px solid var(--theme-border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 h-16">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--theme-primary)' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="var(--theme-background)"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm truncate" style={{ color: 'var(--theme-text)' }}>
            Community
          </span>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center' : '',
              )}
              style={{
                color: isActive ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                background: isActive ? 'rgba(197,168,128,0.1)' : 'transparent',
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User area */}
      <div className="p-3">
        {user && (
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg',
              collapsed ? 'justify-center' : '',
            )}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--theme-text)' }}
                >
                  {user.name}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {user.role}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="flex-shrink-0 p-1 rounded-md hover:bg-white/5 transition-colors"
                style={{ color: 'var(--theme-text-muted)' }}
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-colors hover:opacity-90"
        style={{
          background: 'var(--theme-primary)',
          color: 'var(--theme-background)',
          border: '2px solid var(--theme-background)',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
