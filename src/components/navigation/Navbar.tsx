'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, LayoutGroup } from 'framer-motion';
import { logger } from '@/services/logger';
import {
  Bell,
  User,
  Menu,
  ChevronDown,
  Home,
  BookOpen,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  Calendar,
  Sun,
  Moon
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useUser, useAppStore } from '@/store';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

import { CommandPalette } from './CommandPalette';
import { Logo } from '@/components/ui/Logo';
import { LogIn } from 'lucide-react';


interface NavItem {
  label: string;
  href: string;
  icon?: React.ElementType;
  children?: NavItem[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Planificador',
    href: '/planificador',
    icon: Calendar,
  },
  {
    label: 'Recetas',
    href: '/recetas',
    icon: BookOpen,
    children: [
      { label: 'Explorar', href: '/recetas' },
      { label: 'Mis Recetas', href: '/recetas/mis-recetas' },
      { label: 'Favoritas', href: '/recetas/favoritas' },
      { label: 'Generar con IA', href: '/recetas/generar' },
    ],
  },
  {
    label: 'Despensa',
    href: '/despensa',
    icon: Package,
    children: [
      { label: 'Mi Despensa', href: '/despensa' },
      { label: 'Agregar Items', href: '/despensa/agregar' },
      { label: 'Escanear', href: '/despensa/escanear' },
      { label: 'Alertas', href: '/despensa/alertas' },
    ],
  },
  {
    label: 'Compras',
    href: '/lista-compras',
    icon: ShoppingCart,
    badge: 5,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const storeUser = useUser();
  const { effectiveTheme, toggleTheme } = useTheme();
  const { user: authUser, signOut, loading: authLoading } = useAuth();

  // State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Handle scroll for floating effect
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50 && !isScrolled) {
      setIsScrolled(true);
    } else if (latest <= 50 && isScrolled) {
      setIsScrolled(false);
    }
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className={cn(
        "fixed left-0 right-0 z-50 flex justify-center transition-all duration-300 pointer-events-none",
        isScrolled ? "top-4" : "top-0 md:top-6"
      )}>
        <motion.nav
          initial={false}
          animate={{
            width: isScrolled ? "90%" : "95%",
            maxWidth: isScrolled ? "1000px" : "1280px",
            y: isScrolled ? 0 : 0,
            borderRadius: isScrolled ? "9999px" : "24px",
          }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 100
          }}
          className={cn(
            "relative pointer-events-auto",
            "bg-white/70 dark:bg-gray-950/85 backdrop-blur-2xl",
            "border border-white/20 dark:border-white/15",
            "shadow-xl dark:shadow-black/40",
            "ring-1 ring-black/5 dark:ring-white/10",
            isScrolled ? "px-4" : "px-4 sm:px-6 lg:px-8"
          )}
        >
          <div className="flex justify-between items-center h-16">

            {/* Logo Section */}
            <div className="flex items-center">
              <Link href="/" className="mr-8 group relative z-10">
                <LogoVariant isScrolled={isScrolled} />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1" ref={dropdownRef}>
                <LayoutGroup id="navbar">
                  {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <div key={item.href} className="relative z-10">
                        {item.children ? (
                          <div className="relative">
                            <div className="flex items-center">
                              <Link
                                href={item.href}
                                className={cn(
                                  "relative px-3 py-2 rounded-l-full text-sm font-bold transition-colors duration-200 flex items-center gap-1.5",
                                  active ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-gray-200"
                                )}
                              >
                                {active && (
                                  <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-full -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                                )}
                                {item.icon && <item.icon className="w-4 h-4" />}
                                <span>{item.label}</span>
                              </Link>
                              <button
                                onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                                className={cn(
                                  "relative px-2 py-2 rounded-r-full text-sm font-bold transition-colors duration-200 flex items-center outline-none ring-0 focus:ring-0",
                                  active ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-gray-200"
                                )}
                              >
                                <ChevronDown className={cn(
                                  "w-3 h-3 transition-transform duration-200 opacity-50",
                                  activeDropdown === item.label && "rotate-180"
                                )} />
                              </button>
                            </div>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                              {activeDropdown === item.label && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  transition={{ type: "spring", duration: 0.4 }}
                                  className="absolute top-full left-0 mt-3 w-56 p-1.5 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-black/50 backdrop-blur-3xl z-[60]"
                                >
                                  {item.children.map((child) => (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      onClick={() => setActiveDropdown(null)}
                                      className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-all"
                                    >
                                      {child.label}
                                    </Link>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              "relative px-4 py-2 rounded-full text-sm font-bold transition-colors duration-200 flex items-center gap-2",
                              active ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white"
                            )}
                          >
                            {active && (
                              <motion.div
                                layoutId="active-pill"
                                className="absolute inset-0 bg-lime-500/10 dark:bg-lime-400/10 text-lime-600 dark:text-lime-400 rounded-full -z-10 ring-1 ring-lime-500/20 dark:ring-lime-400/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                            {item.icon && <item.icon className="w-4 h-4" />}
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </LayoutGroup>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle theme={effectiveTheme} toggle={toggleTheme} />
              <NotificationBtn
                isOpen={notificationsOpen}
                setIsOpen={setNotificationsOpen}
              />
              <UserMenu
                isOpen={userMenuOpen}
                setIsOpen={setUserMenuOpen}
                router={router}
                user={authUser}
                signOut={signOut}
                loading={authLoading}
              />

              {/* Mobile menu button */}
              <button className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </motion.nav>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}

// Sub-components for cleaner code

function LogoVariant({ isScrolled }: { isScrolled: boolean }) {
  return (
    <motion.div
      layout
      className="flex items-center gap-2"
    >
      <Logo className={isScrolled ? "scale-90" : "scale-100"} />
    </motion.div>
  );
}

function ThemeToggle({ theme, toggle }: { theme: string | null, toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full transition-all duration-200 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
      aria-label="Toggle theme"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </motion.div>
    </button>
  );
}

function NotificationBtn({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) {
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full transition-all duration-200",
          isOpen
            ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
        )}
      >
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="absolute right-0 mt-3 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 shadow-2xl dark:shadow-black/40 z-[9999] overflow-hidden backdrop-blur-3xl"
          >
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Notificaciones</h3>
              <span className="text-xs font-medium text-orange-500">marcar leídas</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              <div className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors flex gap-3">
                <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Nueva receta disponible</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tarta de Manzana y Canela ha sido añadida a sugerencias.</p>
                </div>
              </div>
              {/* Mas items... */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface UserMenuProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  router: any;
  user: any;
  signOut: () => Promise<void>;
  loading: boolean;
}

function UserMenu({ isOpen, setIsOpen, router, user, signOut, loading }: UserMenuProps) {
  // Show login button if not authenticated
  if (!user && !loading) {
    return (
      <Link
        href="/login"
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ml-1",
          "bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700",
          "text-white font-medium text-sm shadow-md hover:shadow-lg"
        )}
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Iniciar Sesión</span>
      </Link>
    );
  }

  // Show loading skeleton while checking auth
  if (loading) {
    return (
      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse ml-1" />
    );
  }

  // Get display name from user metadata or email
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const displayEmail = user?.email || '';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-1 pl-2 pr-3 rounded-full transition-all duration-200 border ml-1",
          isOpen
            ? "bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/20"
            : "bg-white/0 hover:bg-slate-100 dark:hover:bg-white/10 border-transparent hover:border-slate-200 dark:hover:border-white/10 text-slate-700 dark:text-slate-300"
        )}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-lime-400 to-green-600 rounded-full flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200 opacity-60",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="absolute right-0 mt-3 w-56 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 shadow-2xl dark:shadow-black/40 z-[9999] backdrop-blur-3xl"
          >
            <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5 mb-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
            </div>

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Mi Perfil</span>
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Configuración</span>
            </Link>

            <div className="h-px bg-gray-100 dark:bg-white/10 my-1 mx-2" />

            <button
              onClick={async () => {
                setIsOpen(false);
                try {
                  await signOut();
                  // Also clear local store
                  const { logout } = useAppStore.getState();
                  logout();
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('kecarajo-store');
                    sessionStorage.clear();
                  }
                  toast.success('Sesión cerrada exitosamente');
                  router.push('/');
                } catch (error) {
                  logger.error('Error al cerrar sesión:', 'Navbar', error);
                }
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
