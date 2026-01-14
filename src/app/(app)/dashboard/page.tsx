'use client';

import dynamic from 'next/dynamic';

// Lazy load the heavy dashboard component for better initial load
const UltraModernDashboard = dynamic(
  () => import('@/features/dashboard/UltraModernDashboard'),
  {
    ssr: true,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    )
  }
);

export default function DashboardPage() {
  return <UltraModernDashboard />;
}