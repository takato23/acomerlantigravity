'use client';

import { usePathname } from 'next/navigation';
import { AuroraMeshGradient } from './AuroraMeshGradient';
import { FloatingFoodSilhouettes } from './FloatingFoodSilhouettes';

type PageType = 'landing' | 'dashboard' | 'work';

function getPageType(pathname: string): PageType {
  // Landing page - full decorations
  if (pathname === '/') return 'landing';

  // Dashboard-like pages - subtle decorations
  if (
    pathname === '/dashboard' ||
    pathname.startsWith('/planificador') ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/settings')
  ) {
    return 'dashboard';
  }

  // Work pages - minimal decorations
  return 'work';
}

export function ThemeBackground() {
  const pathname = usePathname();
  const pageType = getPageType(pathname);

  switch (pageType) {
    case 'landing':
      return (
        <>
          <AuroraMeshGradient intensity="full" />
          <FloatingFoodSilhouettes density="medium" />
        </>
      );
    case 'dashboard':
      return (
        <>
          <AuroraMeshGradient intensity="subtle" />
          <FloatingFoodSilhouettes density="sparse" />
        </>
      );
    case 'work':
    default:
      return <AuroraMeshGradient intensity="minimal" />;
  }
}
