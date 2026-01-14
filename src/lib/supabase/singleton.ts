import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './database.types';
import { mockSupabaseClient } from './mock-client';

let supabaseInstance: any = null;

export function getSupabaseInstance() {
  if (typeof window === 'undefined') return mockSupabaseClient;

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials missing. Using mock client.');
      supabaseInstance = mockSupabaseClient;
    } else {
      try {
        supabaseInstance = createClientComponentClient<Database>({
          supabaseUrl,
          supabaseKey,
        });
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        supabaseInstance = mockSupabaseClient;
      }
    }
  }
  return supabaseInstance;
}