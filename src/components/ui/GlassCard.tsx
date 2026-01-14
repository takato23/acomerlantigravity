'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { glassVariants, glassButtonVariants, type GlassVariantsProps, type GlassButtonVariantsProps } from '@/lib/glass-variants';

interface GlassCardProps extends GlassVariantsProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'medium',
  interactive = false,
  glow = false,
  className,
  as: Component = 'div',
  onClick
}) => {
  return (
    <Component
      className={cn(
        'rounded-2xl',
        glassVariants({ variant, interactive, glow }),
        className
      )}
      onClick={onClick}
    >
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
};

interface GlassRecipeCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  prepTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  rating?: number;
  tags?: string[];
  matchPercentage?: number; // New prop
  onClick?: () => void;
  className?: string;
}

export const GlassRecipeCard: React.FC<GlassRecipeCardProps> = ({
  title,
  description,
  imageUrl,
  prepTime,
  difficulty,
  rating,
  tags = [],
  matchPercentage,
  onClick,
  className
}) => {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-orange-100 text-orange-700 border-orange-200',
    hard: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'bg-white dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-black/20 overflow-hidden cursor-pointer',
        'hover:shadow-xl dark:hover:shadow-black/30 transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {/* Image Section */}
      {imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-center justify-between text-white">
              {rating && (
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                </div>
              )}
              {prepTime && (
                <div className="flex items-center space-x-1 text-sm font-medium">
                  <span>🕐</span>
                  <span>{prepTime} min</span>
                </div>
              )}
            </div>
          </div>
          {/* Match Percentage Overlay */}
          {matchPercentage !== undefined && matchPercentage > 0 && (
            <div className="absolute top-3 right-3 z-20">
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm",
                matchPercentage >= 80 ? "bg-green-100/90 text-green-700 border-green-200" :
                  matchPercentage >= 50 ? "bg-yellow-100/90 text-yellow-700 border-yellow-200" :
                    "bg-red-100/90 text-red-700 border-red-200"
              )}>
                {matchPercentage}% Match
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
            {title}
          </h3>
          {difficulty && (
            <span className={cn(
              'px-2 py-1 rounded-full text-xs font-bold border',
              difficultyColors[difficulty]
            )}>
              {difficulty}
            </span>
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | null;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  blur?: boolean;
  className?: string;
  contentClassName?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  blur = true,
  className,
  contentClassName
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute inset-0 bg-black/30',
              blur && 'backdrop-blur-sm'
            )}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative w-full bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-black/40 overflow-hidden',
              sizeClasses[size],
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className={cn('p-6', contentClassName)}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface GlassButtonProps extends GlassButtonVariantsProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  onClick,
  className,
  type = 'button'
}) => {
  return (
    <motion.button
      type={type}
      whileHover={{
        scale: disabled ? 1 : 1.02,
        y: disabled ? 0 : -1,
      }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
      className={cn(
        glassButtonVariants({ variant, size }),
        'flex items-center justify-center space-x-2',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <span>{children}</span>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </motion.button>
  );
};

interface GlassInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  icon,
  error,
  disabled = false,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-white/10 rounded-xl',
            'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 focus:ring-0',
            'transition-colors duration-200',
            icon && 'pl-10',
            error && 'border-red-500 focus:border-red-500',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-900'
          )}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
};
