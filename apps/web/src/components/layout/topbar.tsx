'use client';

import { useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { ThemeSwitcher } from './theme-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@community/shared';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');

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

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg transition-colors"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text)',
            outline: 'none',
          }}
        />
      </div>

      <ThemeSwitcher />

      {/* Notifications */}
      <button
        className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
        aria-label="Notifications"
      >
        <Bell size={18} style={{ color: 'var(--theme-text-muted)' }} />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: 'var(--theme-primary)' }}
        />
      </button>

      {/* User avatar */}
      <Avatar className="h-8 w-8 cursor-pointer">
        <AvatarImage src={user?.avatarUrl || undefined} />
        <AvatarFallback className="text-xs">{getInitials(user?.name || 'U')}</AvatarFallback>
      </Avatar>
    </header>
  );
}
