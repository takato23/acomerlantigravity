'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'fresh' | 'warm' | 'rich' | 'golden' | 'neutral' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  outline?: boolean;
  pill?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      outline = false,
      pill = false,
      removable = false,
      onRemove,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center gap-1.5 font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      pill ? 'rounded-full' : 'rounded-lg',
    ];

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    const variantClasses = outline
      ? {
          default: [
            'bg-transparent border border-slate-300 text-slate-700',
          ],
          fresh: [
            'bg-transparent border border-food-fresh-300 text-food-fresh-700',
          ],
          warm: [
            'bg-transparent border border-food-warm-300 text-food-warm-700',
          ],
          rich: [
            'bg-transparent border border-food-rich-300 text-food-rich-700',
          ],
          golden: [
            'bg-transparent border border-food-golden-300 text-food-golden-700',
          ],
          neutral: [
            'bg-transparent border border-slate-300 text-slate-700',
          ],
          success: [
            'bg-transparent border border-success-300 text-success-700',
          ],
          warning: [
            'bg-transparent border border-warning-300 text-warning-700',
          ],
          error: [
            'bg-transparent border border-error-300 text-error-700',
          ],
          info: [
            'bg-transparent border border-info-300 text-info-700',
          ],
        }
      : {
          default: [
            'bg-slate-100 text-slate-800 border border-slate-200',
          ],
          fresh: [
            'bg-food-fresh-100 text-food-fresh-800 border border-food-fresh-200',
          ],
          warm: [
            'bg-food-warm-100 text-food-warm-800 border border-food-warm-200',
          ],
          rich: [
            'bg-food-rich-100 text-food-rich-800 border border-food-rich-200',
          ],
          golden: [
            'bg-food-golden-100 text-food-golden-800 border border-food-golden-200',
          ],
          neutral: [
            'bg-slate-100 text-slate-800 border border-slate-200',
          ],
          success: [
            'bg-success-50 text-success-700 border border-success-200',
          ],
          warning: [
            'bg-warning-50 text-warning-700 border border-warning-200',
          ],
          error: [
            'bg-error-50 text-error-700 border border-error-200',
          ],
          info: [
            'bg-info-50 text-info-700 border border-info-200',
          ],
        };

    const iconSizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {leftIcon && (
          <span className={cn('flex-shrink-0', iconSizeClasses[size])}>
            {leftIcon}
          </span>
        )}
        
        {children}
        
        {rightIcon && !removable && (
          <span className={cn('flex-shrink-0', iconSizeClasses[size])}>
            {rightIcon}
          </span>
        )}
        
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              'flex-shrink-0 rounded-full p-0.5 hover:bg-black/10',
              'focus:outline-none focus:ring-1 focus:ring-current',
              iconSizeClasses[size]
            )}
          >
            <svg
              className="w-full h-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };