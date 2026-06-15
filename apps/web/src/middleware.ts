import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/api/health'];
const AUTH_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Get auth state from cookie — set server-side on login
  const authToken = request.cookies.get('auth-session')?.value;

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // If user has auth token and tries to visit auth pages, redirect to dashboard
  if (authToken && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If no auth token and trying to access protected routes
  if (!authToken && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
