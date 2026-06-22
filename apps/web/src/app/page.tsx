import Link from 'next/link';
import { Users, BookOpen, Calendar, MessageSquare, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Member Community',
    description: 'Connect with peers, share knowledge, and build meaningful professional relationships.',
  },
  {
    icon: BookOpen,
    title: 'Learning Hub',
    description: 'Structured courses with modules, progress tracking, and completion certificates.',
  },
  {
    icon: Calendar,
    title: 'Events & Calendar',
    description: 'Virtual and in-person events with RSVP, capacity limits, and calendar integration.',
  },
  {
    icon: MessageSquare,
    title: 'Private Messaging',
    description: 'Direct conversations between members for deeper one-on-one collaboration.',
  },
  {
    icon: Shield,
    title: 'GDPR Compliant',
    description: 'Full data export, account deletion, cookie consent, and privacy controls built in.',
  },
  {
    icon: Zap,
    title: 'Self-Hosted',
    description: 'Deploy on your own infrastructure. No vendor lock-in, full data ownership.',
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--theme-background)', color: 'var(--theme-text)' }}
    >
      {/* Background gradients */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 30%, rgba(197,168,128,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(99,102,241,0.05) 0%, transparent 50%)',
        }}
      />

      {/* Nav */}
      <header className="relative z-10 w-full border-b" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <span className="text-lg font-semibold">Community Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Your Premium
            <br />
            <span style={{ color: 'var(--theme-primary)' }}>Learning Community</span>
          </h1>
          <p
            className="mt-6 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            A self-hosted platform for teams and organizations to learn, connect, and grow together.
            Courses, events, discussions, and more — all under your control.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 text-base font-semibold rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
            >
              Join the Community
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 text-base font-semibold rounded-xl border transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
            >
              Sign In
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Everything you need to build a thriving community
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl p-6 transition-all hover:scale-[1.02]"
                style={{
                  background: 'var(--theme-card)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: 'rgba(197,168,128,0.1)', color: 'var(--theme-primary)' }}
                >
                  <feature.icon size={20} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-16 text-center">
          <div
            className="rounded-2xl p-12"
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="mb-8" style={{ color: 'var(--theme-text-muted)' }}>
              Create your account and join the community in seconds.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 text-base font-semibold rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
            >
              Create Free Account
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t py-8" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          <span>&copy; {new Date().getFullYear()} Community Platform</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:opacity-80 transition-opacity">Sign In</Link>
            <Link href="/register" className="hover:opacity-80 transition-opacity">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
