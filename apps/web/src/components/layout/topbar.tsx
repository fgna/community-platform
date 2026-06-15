'use client';

import { Bell, Search, Palette } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Topbar({ title }: { title?: string }) {
  const { themes, setTheme, theme } = useTheme();

  return (
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: 'var(--theme-surface)',
        backdropFilter: 'blur(var(--theme-blur))',
        borderBottom: '1px solid var(--theme-border)',
      }}
    >
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-base font-semibold" style={{ color: 'var(--theme-text)' }}>
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-lg text-sm"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <Search size={14} />
          <span className="text-xs">Search...</span>
          <kbd
            className="hidden sm:inline-flex text-xs px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--theme-border)',
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Notifications */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--theme-text-muted)' }}
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--theme-primary)' }}
          />
        </button>

        {/* Theme picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
              aria-label="Change theme"
            >
              <Palette size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {themes.map((t) => (
              <DropdownMenuItem
                key={t.name}
                onClick={() => setTheme(t.name)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: t.colors.primary }}
                />
                <span>{t.displayName}</span>
                {t.name === theme.name && (
                  <span className="ml-auto text-xs" style={{ color: 'var(--theme-primary)' }}>
                    ✓
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
