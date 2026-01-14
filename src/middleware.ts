import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
      // In production, if config is missing, we shouldn't just let everyone in
      // Maybe redirect to a configuration error page? For now, we'll continue 
      // but the following createServerClient will likely fail safely.
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to home if accessing auth pages while logged in
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
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