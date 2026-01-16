import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import type { Database } from './database.types';
import { mockSupabaseClient } from './mock-client';

/**
 * Creates a Supabase client for Server Components
 * Falls back to mock client if environment variables are not configured
 */
export const createClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>> | ReturnType<typeof cookies>
) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return mock client if credentials are missing
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase credentials for server component client. Using mock.');
    return mockSupabaseClient;
  }

  return createServerComponentClient<Database>(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl,
      supabaseKey,
    }
  );
};
