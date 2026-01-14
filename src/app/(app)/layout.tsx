'use client';

import { Navbar } from '@/components/navigation/Navbar';
import { MobileNav } from '@/components/navigation/MobileNav';
import { ClientProviders } from '@/app/client-providers';
import { ThemeBackground } from '@/components/backgrounds';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ClientProviders>
      <div className="min-h-screen bg-white dark:bg-slate-950 relative transition-colors duration-300">
        {/* Aurora background for dark mode */}
        <ThemeBackground />

        {/* Professional Navigation */}
        <Navbar />

        {/* Main Content */}
        <main className="pt-24 pb-20 lg:pb-0 relative z-10">
          {children}
        </main>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </ClientProviders>
  );
}