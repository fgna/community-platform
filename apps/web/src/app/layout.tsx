import type { Metadata } from 'next';
import { ThemeProvider } from '@/lib/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/toast';
import { CookieBanner } from '@/components/gdpr/cookie-banner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Community Platform',
    template: '%s | Community Platform',
  },
  description: 'A premium community and learning platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            {children}
            <Toaster />
            <CookieBanner />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
