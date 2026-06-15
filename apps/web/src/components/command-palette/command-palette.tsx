'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Home, MessageCircle, GraduationCap, Calendar, Users, Settings, Shield,
  Mail, Search, ArrowRight, LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  adminOnly?: boolean;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const allCommands: Command[] = useMemo(() => [
    { id: 'home', label: 'Dashboard', description: 'Go to dashboard', icon: Home, action: () => navigate('/dashboard') },
    { id: 'feed', label: 'Community Feed', description: 'View and create posts', icon: MessageCircle, action: () => navigate('/feed') },
    { id: 'courses', label: 'Learning Hub', description: 'Browse courses', icon: GraduationCap, action: () => navigate('/courses') },
    { id: 'events', label: 'Events', description: 'Upcoming events', icon: Calendar, action: () => navigate('/events') },
    { id: 'members', label: 'Members', description: 'Browse members', icon: Users, action: () => navigate('/members') },
    { id: 'messages', label: 'Messages', description: 'Direct messages', icon: Mail, action: () => navigate('/messages') },
    { id: 'settings', label: 'Settings', description: 'Account preferences', icon: Settings, action: () => navigate('/settings') },
    { id: 'admin', label: 'Admin Panel', description: 'Manage the platform', icon: Shield, action: () => navigate('/admin'), adminOnly: true },
    { id: 'analytics', label: 'Analytics', description: 'Platform analytics', icon: Search, action: () => navigate('/admin/analytics'), adminOnly: true },
    { id: 'logout', label: 'Sign out', description: 'Log out of your account', icon: LogOut, action: () => { setOpen(false); logout(); }, keywords: ['logout', 'signout'] },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [logout]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allCommands.filter(cmd => {
      if (cmd.adminOnly && user?.role !== 'ADMIN') return false;
      if (!q) return true;
      return (
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.keywords?.some(k => k.includes(q))
      );
    });
  }, [query, allCommands, user?.role]);

  useEffect(() => {
    setActiveIdx(0);
  }, [filtered.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      filtered[activeIdx]?.action();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4"
          style={{ borderBottom: '1px solid var(--theme-border)' }}
        >
          <Search size={16} style={{ color: 'var(--theme-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands…"
            className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:opacity-50"
            style={{ color: 'var(--theme-text)' }}
          />
          <kbd
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="py-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              No commands found
            </p>
          )}
          {filtered.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isActive = idx === activeIdx;
            return (
              <button
                key={cmd.id}
                onClick={cmd.action}
                onMouseEnter={() => setActiveIdx(idx)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                style={{
                  background: isActive ? 'rgba(197,168,128,0.1)' : 'transparent',
                  color: 'var(--theme-text)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isActive ? 'rgba(197,168,128,0.15)' : 'var(--theme-surface)',
                  }}
                >
                  <Icon size={15} style={{ color: isActive ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cmd.label}</p>
                  {cmd.description && (
                    <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{cmd.description}</p>
                  )}
                </div>
                {isActive && <ArrowRight size={14} style={{ color: 'var(--theme-primary)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 flex items-center gap-4 text-xs"
          style={{ borderTop: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
        >
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">⌘K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
