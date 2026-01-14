'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  ShoppingCart, 
  Calendar, 
  Package, 
  User,
  Settings,
  Search,
  LogOut,
  Sparkles,
  Camera,
  Timer,
  TrendingUp,
  Heart,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  HelpCircle
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  color: string;
  description?: string;
  badge?: string | number;
  exact?: boolean;
}

interface ModernSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({ 
  isCollapsed: controlledCollapsed, 
  onToggle 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  const isCollapsed = controlledCollapsed ?? localCollapsed;
  const toggleSidebar = onToggle ?? (() => setLocalCollapsed(!localCollapsed));

  const mainNavigation: NavItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      exact: true,
      color: 'bg-slate-800',
      description: 'Panel principal'
    },
    {
      id: 'recipes',
      name: 'Recetas',
      href: '/recipes',
      icon: BookOpen,
      color: 'bg-green-600',
      description: 'Explora y crea'
    },
    {
      id: 'scanner',
      name: 'Escáner',
      href: '/scanner',
      icon: Camera,
      color: 'bg-slate-700',
      description: '¿Qué es esto?',
      badge: 'NEW'
    },
    {
      id: 'meal-planner',
      name: 'Planificador',
      href: '/planificador',
      icon: Calendar,
      color: 'bg-slate-700',
      description: 'Organiza tu semana'
    },
    {
      id: 'pantry',
      name: 'Despensa',
      href: '/pantry',
      icon: Package,
      color: 'bg-slate-600',
      description: 'Tu inventario',
      badge: 12
    },
    {
      id: 'shopping',
      name: 'Compras',
      href: '/shopping',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      description: 'Lista del súper',
      badge: 5
    },
  ];

  const quickActions = [
    {
      id: 'magic-chef',
      name: 'Chef IA',
      icon: Sparkles,
      color: 'bg-black',
      action: () => router.push('/recipes/generate')
    },
    {
      id: 'timer',
      name: 'Timer',
      icon: Timer,
      color: 'bg-orange-500',
      action: () => router.push('/timer')
    },
    {
      id: 'nutrition',
      name: 'Nutrición',
      icon: TrendingUp,
      color: 'bg-green-600',
      action: () => router.push('/nutrition')
    },
    {
      id: 'favorites',
      name: 'Favoritos',
      icon: Heart,
      color: 'bg-red-500',
      action: () => router.push('/favorites')
    }
  ];

  const bottomNavigation = [
    {
      id: 'stats',
      name: 'Estadísticas',
      icon: BarChart3,
      href: '/stats',
      color: 'bg-slate-700'
    },
    {
      id: 'help',
      name: 'Ayuda',
      icon: HelpCircle,
      href: '/help',
      color: 'bg-slate-500'
    },
    {
      id: 'settings',
      name: 'Ajustes',
      icon: Settings,
      href: '/settings',
      color: 'bg-slate-600'
    }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
  };

  return (
    <motion.aside
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        'hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40',
        'bg-white/80 backdrop-blur-xl',
        'border-r border-slate-200/50',
        'shadow-xl'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
        <motion.div
          className="flex items-center gap-3"
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-black rounded-xl blur-lg opacity-30" />
            <div className="relative bg-black p-2.5 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold text-slate-900">
            KeCaraJoComer
          </span>
        </motion.div>

        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-slate-200/50">
        <motion.div
          className="flex items-center gap-3"
          animate={{ flexDirection: isCollapsed ? 'column' : 'row' }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-slate-800 p-0.5">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <User className="w-6 h-6 text-slate-700" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1"
              >
                <p className="font-medium text-sm">Santiago B.</p>
                <p className="text-xs text-slate-500">Nivel 12 Chef</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {mainNavigation.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredItem(item.id)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <button
                onClick={() => router.push(item.href)}
                className={cn(
                  "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                  active
                    ? "text-white shadow-lg"
                    : "hover:bg-slate-100 text-slate-700",
                  active && item.color
                )}
              >
                <div className={cn(
                  "flex-shrink-0",
                  !active && "p-2 rounded-lg bg-slate-100"
                )}>
                  <item.icon className={cn("w-5 h-5", active && "text-white")} />
                </div>
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1 text-left"
                    >
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.description && !active && (
                        <p className="text-xs text-slate-500">{item.description}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {item.badge && !isCollapsed && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold",
                    active
                      ? "bg-white/20 text-white"
                      : typeof item.badge === 'string'
                        ? "bg-black text-white"
                        : "bg-red-500 text-white"
                  )}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && hoveredItem === item.id && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg whitespace-nowrap z-50"
                  >
                    {item.name}
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                )}
              </button>
            </motion.div>
          );
        })}

        {/* Quick Actions */}
        {!isCollapsed && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3">
                Acciones Rápidas
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.action}
                  className="p-3 rounded-xl bg-gradient-to-br hover:shadow-lg transition-all duration-300 group"
                  style={{
                    background: `linear-gradient(135deg, ${action.color.split(' ')[1]} 0%, ${action.color.split(' ')[3]} 100%)`
                  }}
                >
                  <action.icon className="w-5 h-5 text-white mx-auto mb-1" />
                  <p className="text-xs text-white font-medium">{action.name}</p>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-200/50 p-4 space-y-2">
        {bottomNavigation.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
          >
            <item.icon className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm">{item.name}</span>}
          </button>
        ))}

        <button
          onClick={() => {/* logout logic */}}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-red-600"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm">Cerrar Sesión</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default ModernSidebar;