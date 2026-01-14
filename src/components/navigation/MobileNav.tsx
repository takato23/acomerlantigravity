'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';
import {
  Home,
  BookOpen,
  Calendar,
  ShoppingCart,
  MoreHorizontal,
  Search,
  User,
  Package,
  LogOut
} from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

import { cn } from '@/lib/utils';
import { useUser, useAppStore } from '@/store';
import { useAuth } from '@/components/auth/AuthProvider';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Cocinar',
    href: '/recetas',
    icon: BookOpen,
  },
  {
    label: 'Planificar',
    href: '/planificador',
    icon: Calendar,
  },
  {
    label: 'Comprar',
    href: '/lista-compras',
    icon: ShoppingCart,
    badge: 5,
  },
];

const moreItems: NavItem[] = [
  {
    label: 'Despensa',
    href: '/despensa',
    icon: Package,
  },
  {
    label: 'Perfil',
    href: '/perfil',
    icon: User,
  },
  {
    label: 'Buscar',
    href: '/buscar',
    icon: Search,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const storeUser = useUser();
  const { user: authUser, signOut } = useAuth();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Update active tab based on pathname
  useEffect(() => {
    const index = navItems.findIndex(item => pathname.startsWith(item.href));
    if (index !== -1) {
      setActiveTab(index);
    }
  }, [pathname]);

  // Swipe handlers for tab navigation
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab < navItems.length - 1) {
        setActiveTab(activeTab + 1);
      }
    },
    onSwipedRight: () => {
      if (activeTab > 0) {
        setActiveTab(activeTab - 1);
      }
    },
    trackMouse: false,
  });

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  // Haptic feedback simulation
  const triggerHaptic = (pattern: number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleTabPress = (index: number) => {
    setActiveTab(index);
    triggerHaptic([0, 10, 50, 10]);
  };

  return (
    <>
      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
        <nav
          className="relative rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-black/20 transition-colors duration-300"
        >
          <div className="relative" {...handlers}>
            {/* Active tab indicator */}
            <motion.div
              className="absolute top-0 h-0.5 bg-black dark:bg-white"
              animate={{
                left: `${(activeTab / navItems.length) * 100}%`,
                width: `${100 / navItems.length}%`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            <div className="flex justify-around items-center h-16 px-4">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleTabPress(index)}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 py-2 px-1 relative",
                    "transition-all duration-200",
                    isActive(item.href)
                      ? "text-black dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    <item.icon className={cn(
                      "w-6 h-6 transition-all duration-200",
                      isActive(item.href) && "transform scale-110"
                    )} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                  <span className={cn(
                    "text-xs mt-1 transition-all duration-200",
                    isActive(item.href) ? "font-bold" : "font-medium"
                  )}>
                    {item.label}
                  </span>
                </Link>
              ))}

              {/* More button */}
              <button
                onClick={() => {
                  setMoreMenuOpen(!moreMenuOpen);
                  triggerHaptic([0, 30]);
                }}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 px-1 relative",
                  "transition-all duration-200",
                  moreMenuOpen
                    ? "text-black dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  animate={{ rotate: moreMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MoreHorizontal className="w-6 h-6" />
                </motion.div>
                <span className="text-xs mt-1 font-medium">Más</span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* More menu overlay */}
      <AnimatePresence>
        {moreMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/30 dark:bg-black/50 z-40"
              onClick={() => setMoreMenuOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-24 left-4 right-4 z-50 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-black/40"
            >
              <div className="p-4">
                <div className="w-12 h-1 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-4" />
                <div className="grid grid-cols-3 gap-4">
                  {moreItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setMoreMenuOpen(false);
                        triggerHaptic([0, 10, 100, 20]);
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <item.icon className="w-8 h-8 text-gray-700 dark:text-gray-300 mb-2" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Logout/Login button based on auth state */}
                {authUser ? (
                  <button
                    onClick={async () => {
                      setMoreMenuOpen(false);
                      triggerHaptic([0, 10, 100, 20]);
                      try {
                        // Sign out from Supabase
                        await signOut();
                        // Also clear local store
                        const { logout } = useAppStore.getState();
                        logout();

                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('kecarajo-store');
                          sessionStorage.clear();
                        }

                        router.push('/');
                      } catch (error) {
                        logger.error('Error al cerrar sesión:', 'MobileNav', error);
                      }
                    }}
                    className="mt-4 w-full flex items-center justify-center space-x-2 p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      Cerrar Sesión
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      triggerHaptic([0, 10, 100, 20]);
                    }}
                    className="mt-4 w-full flex items-center justify-center space-x-2 p-4 rounded-xl bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 transition-colors"
                  >
                    <User className="w-5 h-5 text-white" />
                    <span className="text-sm font-bold text-white">
                      Iniciar Sesión
                    </span>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
