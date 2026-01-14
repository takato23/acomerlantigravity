import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  default: {
    base: 'bg-slate-100/80 dark:bg-white/10 text-slate-900 dark:text-white',
    hover: 'hover:bg-slate-200/80 dark:hover:bg-white/20',
    glow: 'rgba(148, 163, 184, 0.3)'
  },
  primary: {
    base: 'bg-slate-700 dark:bg-white text-white dark:text-slate-900',
    hover: 'hover:bg-slate-800 dark:hover:bg-white/90',
    glow: 'rgba(71, 85, 105, 0.4)'
  },
  secondary: {
    base: 'bg-slate-500 dark:bg-slate-600 text-white',
    hover: 'hover:bg-slate-600 dark:hover:bg-slate-500',
    glow: 'rgba(100, 116, 139, 0.4)'
  },
  danger: {
    base: 'bg-red-500 text-white',
    hover: 'hover:bg-red-600',
    glow: 'rgba(239, 68, 68, 0.4)'
  },
  success: {
    base: 'bg-green-500 text-white',
    hover: 'hover:bg-green-600',
    glow: 'rgba(34, 197, 94, 0.4)'
  },
  ghost: {
    base: 'bg-transparent text-slate-700 dark:text-gray-300',
    hover: 'hover:bg-slate-100/50 dark:hover:bg-white/10',
    glow: 'transparent'
  }
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5'
};

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(({
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'left',
  glow = true,
  children,
  className,
  disabled,
  ...props
}, ref) => {
  const styles = variantStyles[variant];
  
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        // Base styles
        "relative inline-flex items-center justify-center font-medium rounded-xl",
        "transition-all duration-300 overflow-hidden",
        "backdrop-blur-xl border border-slate-200/50 dark:border-white/10",
        "shadow-lg",
        
        // Size
        sizeStyles[size],
        
        // Variant
        styles.base,
        styles.hover,
        
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed",
        
        // Custom classes
        className
      )}
      disabled={disabled}
      {...props}
    >
      {/* Glow effect */}
      {glow && !disabled && variant !== 'ghost' && (
        <motion.div
          className="absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10"
          style={{ backgroundColor: styles.glow }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/5 to-white/10 pointer-events-none" />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        animate={{
          x: ['-200%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 1
        }}
      />
      
      {/* Content */}
      <span className="relative flex items-center gap-inherit">
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </span>
    </motion.button>
  );
});

GlassButton.displayName = 'GlassButton';