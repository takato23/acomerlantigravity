import { NextResponse, type NextRequest } from 'next/server'

const BASE64_PREFIX = 'base64-';

// Helper to check if we have valid Supabase credentials
const isValidSupabaseConfig = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return false
  if (url.includes('your_') || key.includes('your_')) return false

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const getSupabaseStorageKey = (): string | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    const projectRef = new URL(url).hostname.split('.')[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
};

const decodeBase64Url = (value: string): string | null => {
  if (typeof atob !== 'function') return null;

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  try {
    return atob(padded);
  } catch {
    return null;
  }
};

const getChunkedCookieValue = (cookies: Array<{ name: string; value: string }>, key: string): string | null => {
  const direct = cookies.find((cookie) => cookie.name === key);
  if (direct) return direct.value;

  const prefix = `${key}.`;
  const chunks = cookies
    .filter((cookie) => cookie.name.startsWith(prefix))
    .sort((a, b) => {
      const aIndex = Number(a.name.slice(prefix.length));
      const bIndex = Number(b.name.slice(prefix.length));
      return aIndex - bIndex;
    });

  if (chunks.length === 0) return null;
  return chunks.map((chunk) => chunk.value).join('');
};

const parseSupabaseSession = (raw: string | null): { access_token?: string; expires_at?: number } | null => {
  if (!raw) return null;

  let decoded = raw;
  if (raw.startsWith(BASE64_PREFIX)) {
    const base64Decoded = decodeBase64Url(raw.slice(BASE64_PREFIX.length));
    if (!base64Decoded) return null;
    decoded = base64Decoded;
  }

  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const hasValidSession = (cookies: Array<{ name: string; value: string }>): boolean => {
  const storageKey = getSupabaseStorageKey();
  if (!storageKey) return false;

  const rawSession = getChunkedCookieValue(cookies, storageKey);
  const session = parseSupabaseSession(rawSession);

  if (!session?.access_token) return false;
  if (typeof session.expires_at === 'number') {
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at <= now) return false;
  }

  return true;
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip API routes - let them handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Special case: Shared plans are public
  if (pathname.startsWith('/shared/')) {
    return NextResponse.next()
  }

  // Protected routes - require authentication
  const protectedPaths = [
    '/planificador',
    '/dashboard',
    '/historial',
    '/settings',
    '/perfil',
    '/profile',
    '/despensa',
    '/lista-compras',
    '/shopping-list',
    '/notifications',
    '/notificaciones',
  ]

  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  )

  // If Supabase is not configured, warn and bypass in development ONLY
  if (!isValidSupabaseConfig()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Supabase not configured - auth checks bypassed for development')
      return NextResponse.next()
    } else {
      console.error('CRITICAL: Supabase not configured in production environment!')
      return NextResponse.next()
    }
  }

  const isAuthenticated = hasValidSession(request.cookies.getAll());

  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to home if accessing auth pages while logged in
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
