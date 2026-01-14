import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ProfileHub } from '@/components/profile/ProfileHub';

// Enhanced loading component
function ProfileLoadingFallback() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Loading Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-2">
            Profile Hub
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Loading your culinary profile...
          </p>
        </div>

        {/* Loading Component */}
        <div className="max-w-4xl mx-auto">
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-slate-600">Preparing your personalized culinary experience...</p>
              <p className="text-sm text-slate-400">Loading preferences, dietary restrictions and settings</p>
            </div>
          </div>
        </div>

        {/* Loading Tips */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 italic">
            Tip: Make sure you have a good internet connection while we load
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Profile Hub Page Component
 *
 * Complete profile management interface with:
 * - Gamification and achievements
 * - Household management
 * - Preferences and dietary settings
 */
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingFallback />}>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-2">
              Profile Hub
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Complete profile management with gamification, preferences, and household settings
            </p>
          </div>

          {/* Profile Hub Component */}
          <ProfileHub />

          {/* Quick Navigation */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Want a simplified view? Check out the{' '}
              <a
                href="/perfil"
                className="text-orange-500 hover:text-orange-600 underline"
              >
                Spanish profile page
              </a>
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

// Static metadata for SEO
export const metadata: Metadata = {
  title: 'Profile Hub | KeCarajoComer',
  description: 'Complete profile management with gamification, preferences, and household settings',
  keywords: ['profile', 'preferences', 'gamification', 'dietary', 'cooking'],
  openGraph: {
    title: 'Profile Hub | KeCarajoComer',
    description: 'Manage your complete culinary profile with achievements, preferences, and family settings',
    type: 'website',
  },
  alternates: {
    canonical: '/profile',
    languages: {
      'en': '/profile',
      'es': '/perfil'
    }
  }
};
