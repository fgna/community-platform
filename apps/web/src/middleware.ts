import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/health'];
const AUTH_PATHS = ['/login', '/register'];
const ADMIN_PATHS = ['/admin'];

function withRequestId(response: NextResponse, request: NextRequest): NextResponse {
  // crypto.randomUUID() is available globally in the Edge Runtime (Web Crypto API)
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  response.headers.set('x-request-id', requestId);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    return withRequestId(NextResponse.next(), request);
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
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!authToken && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes require ADMIN role
  if (authToken && isAdminPath && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return withRequestId(NextResponse.next(), request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
