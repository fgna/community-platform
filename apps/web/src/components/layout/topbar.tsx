'use client';

import { Search, Menu } from 'lucide-react';
import { ThemeSwitcher } from './theme-switcher';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@community/shared';

interface TopbarProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user } = useAuth();

  const openPalette = () =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));

  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-[280px] z-30 flex items-center gap-3 px-4 lg:px-6 h-16"
      style={{
        background: 'rgba(9,13,22,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--theme-border)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="lg:hidden p-2 rounded-md hover:bg-white/5 flex-shrink-0"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} style={{ color: 'var(--theme-text-muted)' }} />
      </button>

      {title && (
        <h1 className="text-lg font-semibold mr-auto" style={{ color: 'var(--theme-text)' }}>
          {title}
        </h1>
      )}

      {/* Command palette trigger */}
      <button
        onClick={openPalette}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors flex-1 max-w-xs lg:max-w-sm"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--theme-border)',
          color: 'var(--theme-text-muted)',
        }}
      >
        <Search size={14} />
        <span className="flex-1 text-left text-sm hidden sm:inline">Search commands…</span>
        <kbd
          className="text-xs px-1.5 py-0.5 rounded font-mono hidden sm:inline"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--theme-text-muted)' }}
        >
          ⌘K
        </kbd>
      </button>

      <ThemeSwitcher />

      <NotificationBell />

      {/* User avatar */}
      <Avatar className="h-8 w-8 cursor-pointer flex-shrink-0">
        <AvatarImage src={user?.avatarUrl || undefined} />
        <AvatarFallback className="text-xs">{getInitials(user?.name || 'U')}</AvatarFallback>
      </Avatar>
    </header>
  );
}
