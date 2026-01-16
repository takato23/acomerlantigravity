/**
 * Auth utilities
 * Basic auth utilities for API routes
 */

import { NextRequest } from 'next/server';
import { getUser } from './auth/supabase-auth';

// Mock authOptions for development
export const authOptions = {
  providers: [],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session }: any) {
      return session;
    },
    async jwt({ token }: any) {
      return token;
    },
  },
};

export async function getServerSession() {
  const user = await getUser();
  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email
    }
  };
}

export async function requireAuth(request: NextRequest) {
  // Basic auth check - would implement proper auth in production
  const user = await getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  return { user };
}
