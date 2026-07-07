import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/health'];
const AUTH_PATHS = ['/login', '/register'];
const ADMIN_PATHS = ['/admin'];

// Middleware runs on the Edge runtime, where `Buffer` isn't part of the
// guaranteed API surface — use Web Crypto/btoa instead so this doesn't depend
// on a Node.js polyfill being present.
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// Nonce-based CSP: each request gets a fresh nonce, so script-src never needs
// 'unsafe-inline'. 'strict-dynamic' lets Next's own nonce-carrying bootstrap
// scripts load their child chunks without listing every host. 'unsafe-eval' is
// dev-only — Next's webpack HMR/fast-refresh relies on eval() for source maps;
// production builds don't need it.
function buildCspHeader(nonce: string): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (process.env.NODE_ENV !== 'production') {
    scriptSrc.push("'unsafe-eval'");
  }
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    // style-src keeps 'unsafe-inline': this app renders React inline `style={{...}}`
    // props pervasively for theme tokens (--theme-text, etc.), which produce actual
    // `style="..."` attributes. Nonces do not apply to style attributes (only
    // <style>/<link> tags), so there is no nonce-based alternative for this pattern.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://avatars.githubusercontent.com https://images.unsplash.com https://via.placeholder.com",
    `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = generateNonce();
  const cspHeader = buildCspHeader(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  function next(): NextResponse {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  function redirect(url: URL): NextResponse {
    const response = NextResponse.redirect(url);
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  if (pathname.startsWith('/api/')) {
    return next();
  }

  const authToken = request.cookies.get('auth-session')?.value;
  const userRole = request.cookies.get('user-role')?.value;

  const isPublicPath = PUBLIC_PATHS.some((p) =>
    p === '/' ? pathname === '/' : pathname.startsWith(p),
  );
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  // Authenticated users on landing or auth pages → dashboard
  if (authToken && (pathname === '/' || isAuthPath)) {
    return redirect(new URL('/dashboard', request.url));
  }

  if (!authToken && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return redirect(loginUrl);
  }

  // Admin routes require ADMIN role
  if (authToken && isAdminPath && userRole !== 'ADMIN') {
    return redirect(new URL('/dashboard', request.url));
  }

  return next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
