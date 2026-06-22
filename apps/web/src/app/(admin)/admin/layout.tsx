'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, Calendar, Shield, Flag, ClipboardList, ArrowLeft, BarChart2, Settings, Mail, Menu, X, FileDown, Newspaper, Lightbulb } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

const adminNav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/moderation', label: 'Moderation', icon: Flag },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ClipboardList },
  { href: '/admin/reports', label: 'Reports', icon: FileDown },
  { href: '/admin/invites', label: 'Invites', icon: Mail },
  { href: '/admin/digests', label: 'Digests', icon: Newspaper },
  { href: '/admin/journal-prompts', label: 'Journal Prompts', icon: Lightbulb },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {/* Header */}
      <div className="p-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={18} className="text-red-400" />
          <span className="font-bold text-white text-sm tracking-wide">ADMIN PANEL</span>
          <Badge variant="destructive" className="text-xs ml-auto">Admin</Badge>
          {onClose && (
            <button onClick={onClose} className="ml-2 text-white/60 hover:text-white lg:hidden">
              <X size={18} />
            </button>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{user?.email}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {adminNav.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                color: isActive ? '#ffffff' : 'var(--theme-text-muted)',
                background: isActive ? 'rgba(239,68,68,0.15)' : 'transparent',
                borderLeft: isActive ? '2px solid #ef4444' : '2px solid transparent',
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Back to app */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(239,68,68,0.1)' }}>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2 text-xs transition-colors"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <ArrowLeft size={14} />
          Back to App
        </Link>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--theme-background)' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full flex-col z-40 w-64"
        style={{
          background: 'rgba(10, 5, 20, 0.92)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed left-0 top-0 h-full flex flex-col z-50 w-72 transition-transform duration-200 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'rgba(10, 5, 20, 0.98)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Content */}
      <main className="flex-1 lg:pl-64 min-h-screen">
        {/* Mobile top bar */}
        <div
          className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
          style={{
            background: 'rgba(10, 5, 20, 0.92)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-red-400" />
            <span className="text-sm font-bold text-white tracking-wide">ADMIN PANEL</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
