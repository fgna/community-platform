'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, GraduationCap, Calendar, Users, Settings, Shield, LogOut, ChevronRight, Mail, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@community/shared';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/feed', label: 'Community Feed', icon: MessageCircle },
  { href: '/courses', label: 'Learning Hub', icon: GraduationCap },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/messages', label: 'Messages', icon: Mail },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed left-0 top-0 h-full flex flex-col z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--theme-surface)',
        backdropFilter: 'blur(var(--theme-blur))',
        WebkitBackdropFilter: 'blur(var(--theme-blur))',
        borderRight: '1px solid var(--theme-border)',
      }}
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--theme-primary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--theme-background)">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <span className="font-bold text-base flex-1" style={{ color: 'var(--theme-text)' }}>
          Community
        </span>
        {/* Close button — mobile only */}
        <button
          className="lg:hidden p-1.5 rounded-md hover:bg-white/5"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} style={{ color: 'var(--theme-text-muted)' }} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
              style={{
                background: isActive ? 'rgba(197,168,128,0.12)' : 'transparent',
                color: isActive ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                border: isActive ? '1px solid rgba(197,168,128,0.2)' : '1px solid transparent',
              }}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}

        {user?.role === 'ADMIN' && (
          <>
            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }}>
                Admin
              </p>
            </div>
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: pathname.startsWith('/admin') ? 'rgba(197,168,128,0.12)' : 'transparent',
                color: pathname.startsWith('/admin') ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                border: pathname.startsWith('/admin') ? '1px solid rgba(197,168,128,0.2)' : '1px solid transparent',
              }}
            >
              <Shield size={18} className="flex-shrink-0" />
              <span className="flex-1">Admin Panel</span>
            </Link>
          </>
        )}
      </nav>

      {/* User profile */}
      <div className="p-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
        <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="text-xs">{getInitials(user?.name || 'U')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md transition-colors hover:bg-white/5"
            title="Logout"
          >
            <LogOut size={14} style={{ color: 'var(--theme-text-muted)' }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
