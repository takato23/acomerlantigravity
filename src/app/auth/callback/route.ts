import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { logger } from '@/services/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Si hay un error del auth, redirigir al login con mensaje de error
  if (error) {
    logger.error('Auth callback error', 'AuthCallback', {
      error,
      errorDescription,
      url: request.url
    });

    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  // Si no hay código, es una solicitud inválida
  if (!code) {
    logger.warn('Auth callback without code', 'AuthCallback', { url: request.url });

    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'Link inválido o expirado');
    return NextResponse.redirect(redirectUrl);
  }

  // Crear response para redirect
  const redirectUrl = new URL(next, request.url);
  let response = NextResponse.redirect(redirectUrl);

  try {
    // Crear cliente SSR con manejo de cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Intercambiar el código por una sesión
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      throw exchangeError;
    }

    if (!data.session) {
      throw new Error('No se pudo crear la sesión');
    }

    logger.info('Magic link auth successful', 'AuthCallback', {
      userId: data.user?.id,
      email: data.user?.email
    });

    return response;

  } catch (error: any) {
    logger.error('Magic link exchange failed', 'AuthCallback', error);

    let errorMessage = 'Error al procesar el link de acceso';

    if (error.message?.includes('expired')) {
      errorMessage = 'El link ha expirado. Solicitá uno nuevo.';
    } else if (error.message?.includes('invalid')) {
      errorMessage = 'Link inválido. Verificá tu email e intentá de nuevo.';
    } else if (error.message?.includes('used')) {
      errorMessage = 'Este link ya fue usado. Solicitá uno nuevo.';
    }

    const errorRedirectUrl = new URL('/login', request.url);
    errorRedirectUrl.searchParams.set('error', errorMessage);
    return NextResponse.redirect(errorRedirectUrl);
  }
}