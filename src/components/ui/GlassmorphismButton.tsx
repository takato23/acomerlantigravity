'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type MealTheme = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'neutral';

interface GlassmorphismButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  mealTheme?: MealTheme;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  onHover?: (isHovering: boolean) => void;
}

const variantStyles = {
  primary: {
    base: 'bg-orange-500 border-orange-400/30 text-white',
    hover: 'hover:bg-orange-600 hover:border-orange-500/40',
    glow: 'shadow-lg shadow-orange-500/20'
  },
  secondary: {
    base: 'bg-slate-100 border-slate-200 text-slate-700',
    hover: 'hover:bg-slate-200 hover:border-slate-300',
    glow: 'shadow-lg shadow-black/5'
  },
  accent: {
    base: 'bg-slate-700 border-slate-600 text-white',
    hover: 'hover:bg-slate-800 hover:border-slate-700',
    glow: 'shadow-lg shadow-slate-500/20'
  },
  success: {
    base: 'bg-green-500 border-green-400/30 text-white',
    hover: 'hover:bg-green-600 hover:border-green-500/40',
    glow: 'shadow-lg shadow-green-500/20'
  },
  warning: {
    base: 'bg-amber-500 border-amber-400/30 text-white',
    hover: 'hover:bg-amber-600 hover:border-amber-500/40',
    glow: 'shadow-lg shadow-amber-500/20'
  },
  danger: {
    base: 'bg-red-500 border-red-400/30 text-white',
    hover: 'hover:bg-red-600 hover:border-red-500/40',
    glow: 'shadow-lg shadow-red-500/20'
  },
  ghost: {
    base: 'bg-transparent border-transparent text-slate-600',
    hover: 'hover:bg-slate-100 hover:border-slate-200',
    glow: ''
  }
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-6 py-3 text-base font-semibold',
  xl: 'px-8 py-4 text-lg font-bold'
};

const mealThemeStyles = {
  desayuno: {
    base: 'bg-amber-100 border-amber-200 text-amber-800',
    hover: 'hover:bg-amber-200 hover:border-amber-300',
    glow: 'shadow-lg shadow-amber-500/20'
  },
  almuerzo: {
    base: 'bg-slate-100 border-slate-200 text-slate-700',
    hover: 'hover:bg-slate-200 hover:border-slate-300',
    glow: 'shadow-lg shadow-slate-500/20'
  },
  merienda: {
    base: 'bg-green-100 border-green-200 text-green-800',
    hover: 'hover:bg-green-200 hover:border-green-300',
    glow: 'shadow-lg shadow-green-500/20'
  },
  cena: {
    base: 'bg-slate-200 border-slate-300 text-slate-800',
    hover: 'hover:bg-slate-300 hover:border-slate-400',
    glow: 'shadow-lg shadow-slate-500/20'
  },
  neutral: {
    base: 'bg-slate-100 border-slate-200 text-slate-700',
    hover: 'hover:bg-slate-200 hover:border-slate-300',
    glow: 'shadow-lg shadow-black/5'
  }
};

export function GlassmorphismButton({
  children,
  variant = 'secondary',
  size = 'md',
  mealTheme,
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  onClick,
  onHover
}: GlassmorphismButtonProps) {
  // Use meal theme styles if provided, otherwise use variant styles
  const styles = mealTheme ? mealThemeStyles[mealTheme] : variantStyles[variant];

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onHoverStart={() => onHover?.(true)}
      onHoverEnd={() => onHover?.(false)}
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        // Base glassmorphism styling
        "relative overflow-hidden rounded-xl backdrop-blur-[12px] border transition-all duration-300",
        "flex items-center justify-center gap-2",
        "focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-transparent",
        
        // Size styles
        sizeStyles[size],
        
        // Theme styles
        styles.base,
        styles.hover,
        styles.glow,
        
        // State styles
        disabled && "opacity-50 cursor-not-allowed",
        loading && "cursor-wait",
        fullWidth && "w-full",
        
        // Custom className
        className
      )}
    >
      {/* Inner glow effect */}
      <div className={cn(
        "absolute inset-[1px] rounded-xl border transition-all duration-300",
        "border-white/[0.05]"
      )} />

      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        whileHover={{ opacity: [0, 1, 0], x: [-100, 200] }}
        transition={{ duration: 0.6 }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        {/* Loading spinner */}
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}

        {/* Left icon */}
        {Icon && iconPosition === 'left' && !loading && (
          <Icon className={cn(
            "transition-transform duration-300",
            size === 'sm' ? "w-3 h-3" : 
            size === 'md' ? "w-4 h-4" : 
            size === 'lg' ? "w-5 h-5" : "w-6 h-6"
          )} />
        )}

        {/* Children content */}
        <span className="relative z-10">
          {children}
        </span>

        {/* Right icon */}
        {Icon && iconPosition === 'right' && !loading && (
          <Icon className={cn(
            "transition-transform duration-300",
            size === 'sm' ? "w-3 h-3" : 
            size === 'md' ? "w-4 h-4" : 
            size === 'lg' ? "w-5 h-5" : "w-6 h-6"
          )} />
        )}
      </div>

      {/* Background animation for special states */}
      {(variant === 'primary' || mealTheme) && (
        <motion.div
          className="absolute inset-0 opacity-0 bg-gradient-to-r from-current/5 via-current/10 to-current/5"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}

// Specialized meal-themed button variants
export function DesayunoButton({ children, ...props }: Omit<GlassmorphismButtonProps, 'mealTheme'>) {
  return (
    <GlassmorphismButton mealTheme="desayuno" {...props}>
      {children}
    </GlassmorphismButton>
  );
}

export function AlmuerzoButton({ children, ...props }: Omit<GlassmorphismButtonProps, 'mealTheme'>) {
  return (
    <GlassmorphismButton mealTheme="almuerzo" {...props}>
      {children}
    </GlassmorphismButton>
  );
}

export function MeriendaButton({ children, ...props }: Omit<GlassmorphismButtonProps, 'mealTheme'>) {
  return (
    <GlassmorphismButton mealTheme="merienda" {...props}>
      {children}
    </GlassmorphismButton>
  );
}

export function CenaButton({ children, ...props }: Omit<GlassmorphismButtonProps, 'mealTheme'>) {
  return (
    <GlassmorphismButton mealTheme="cena" {...props}>
      {children}
    </GlassmorphismButton>
  );
}

// AI-themed button for meal generation
export function AIGenerateButton({ children, ...props }: Omit<GlassmorphismButtonProps, 'variant' | 'className'>) {
  return (
    <GlassmorphismButton
      variant="accent"
      className="bg-slate-700 border-slate-600 hover:bg-slate-800 text-white font-semibold"
      {...props}
    >
      {children}
    </GlassmorphismButton>
  );
}