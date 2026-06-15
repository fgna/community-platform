'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, Calendar, Shield, Flag, ClipboardList, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

const adminNav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/moderation', label: 'Moderation', icon: Flag },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ClipboardList },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--theme-background)' }}>
      {/* Admin Sidebar */}
      <aside
        className="fixed left-0 top-0 h-full flex flex-col z-40 w-64"
        style={{
          background: 'rgba(10, 5, 20, 0.92)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        {/* Header */}
        <div className="p-5" style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-red-400" />
            <span className="font-bold text-white text-sm tracking-wide">ADMIN PANEL</span>
            <Badge variant="destructive" className="text-xs ml-auto">Admin</Badge>
          </div>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{user?.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href) && href !== '/admin';
            const isExactActive = exact && pathname === href;
            const isActive = isExactActive || (!exact && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
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
        <div className="p-4" style={{ borderTop: '1px solid rgba(239,68,68,0.1)' }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <ArrowLeft size={14} />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 pl-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
