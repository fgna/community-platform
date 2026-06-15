'use client';

import { Search } from 'lucide-react';
import { ThemeSwitcher } from './theme-switcher';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@community/shared';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useAuth();

  const openPalette = () =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center gap-4 px-6 h-16"
      style={{
        left: 'var(--sidebar-width)',
        background: 'rgba(9,13,22,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--theme-border)',
      }}
    >
      {title && (
        <h1 className="text-lg font-semibold mr-auto" style={{ color: 'var(--theme-text)' }}>
          {title}
        </h1>
      )}

      {/* Command palette trigger */}
      <button
        onClick={openPalette}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors flex-1 max-w-sm"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--theme-border)',
          color: 'var(--theme-text-muted)',
        }}
      >
        <Search size={14} />
        <span className="flex-1 text-left text-sm">Search commands…</span>
        <kbd
          className="text-xs px-1.5 py-0.5 rounded font-mono"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--theme-text-muted)' }}
        >
          ⌘K
        </kbd>
      </button>

      <ThemeSwitcher />

      <NotificationBell />

      {/* User avatar */}
      <Avatar className="h-8 w-8 cursor-pointer">
        <AvatarImage src={user?.avatarUrl || undefined} />
        <AvatarFallback className="text-xs">{getInitials(user?.name || 'U')}</AvatarFallback>
      </Avatar>
    </header>
  );
}
