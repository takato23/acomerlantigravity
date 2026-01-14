'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'fresh' | 'warm' | 'rich' | 'golden';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      glow = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center rounded-xl font-medium',
      'transition-all duration-200 ease-glass',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'relative overflow-hidden',
      fullWidth ? 'w-full' : '',
    ];

    const variantClasses = {
      primary: [
        'bg-slate-700 text-white border border-slate-800',
        'hover:bg-slate-800 hover:shadow-lg',
        'focus:ring-slate-300',
        'active:bg-slate-900',
      ],
      secondary: [
        'bg-slate-100 text-slate-900 border border-slate-200',
        'hover:bg-slate-200 hover:shadow-md',
        'focus:ring-slate-300',
        'active:bg-slate-300',
      ],
      ghost: [
        'bg-transparent text-slate-700 border border-transparent',
        'hover:bg-slate-100 hover:text-slate-900',
        'focus:ring-slate-300',
      ],
      glass: [
        'glass-interactive text-slate-900',
        'hover:transform hover:-translate-y-0.5',
        'focus:ring-slate-300',
      ],
      fresh: [
        'glass-fresh text-food-fresh-700 border-food-fresh-200',
        'hover:bg-food-fresh-100 hover:text-food-fresh-800',
        'focus:ring-food-fresh-300',
      ],
      warm: [
        'glass-warm text-food-warm-700 border-food-warm-200',
        'hover:bg-food-warm-100 hover:text-food-warm-800',
        'focus:ring-food-warm-300',
      ],
      rich: [
        'glass-rich text-food-rich-700 border-food-rich-200',
        'hover:bg-food-rich-100 hover:text-food-rich-800',
        'focus:ring-food-rich-300',
      ],
      golden: [
        'glass-golden text-food-golden-700 border-food-golden-200',
        'hover:bg-food-golden-100 hover:text-food-golden-800',
        'focus:ring-food-golden-300',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
      xl: 'px-8 py-4 text-xl gap-3',
    };

    const glowClasses = glow
      ? {
          primary: 'glow-fresh',
          fresh: 'glow-fresh',
          warm: 'glow-warm',
          rich: 'glow-rich',
          golden: 'glow-golden',
          secondary: '',
          ghost: '',
          glass: '',
        }[variant] || ''
      : '';

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          glowClasses,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        <div className={cn('flex items-center gap-inherit', loading && 'opacity-0')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };