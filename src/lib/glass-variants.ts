import { cva, type VariantProps } from 'class-variance-authority';

export const glassVariants = cva(
  'backdrop-blur-sm transition-all duration-200',
  {
    variants: {
      variant: {
        subtle: [
          'bg-white/60 dark:bg-white/5',
          'backdrop-blur-sm',
          'border border-gray-100 dark:border-white/10',
          'shadow-sm dark:shadow-black/20',
        ],
        medium: [
          'bg-white/80 dark:bg-white/10',
          'backdrop-blur-md',
          'border border-gray-200 dark:border-white/15',
          'shadow-md dark:shadow-black/30',
        ],
        strong: [
          'bg-white/90 dark:bg-white/15',
          'backdrop-blur-lg',
          'border border-gray-200 dark:border-white/20',
          'shadow-lg dark:shadow-black/40',
        ],
      },
      interactive: {
        true: [
          'cursor-pointer',
          'hover:bg-white/90 dark:hover:bg-white/20',
          'hover:border-gray-300 dark:hover:border-white/30',
          'hover:shadow-lg dark:hover:shadow-black/50',
          'hover:scale-[1.01] active:scale-[0.99]',
        ],
      },
      glow: {
        true: [
          'shadow-lg dark:shadow-black/40',
        ],
      },
    },
    defaultVariants: {
      variant: 'medium',
      interactive: false,
      glow: false,
    },
  }
);

export type GlassVariantsProps = VariantProps<typeof glassVariants>;

// Button specific glass variants - estilo minimalista del landing
export const glassButtonVariants = cva(
  'backdrop-blur-sm transition-all duration-200 font-bold rounded-xl px-4 py-2.5',
  {
    variants: {
      variant: {
        primary: [
          'bg-black dark:bg-white',
          'text-white dark:text-slate-900',
          'shadow-lg hover:shadow-xl dark:shadow-black/30',
          'hover:bg-gray-800 dark:hover:bg-gray-100',
        ],
        secondary: [
          'bg-gray-100 dark:bg-white/10',
          'border border-gray-200 dark:border-white/20',
          'text-gray-900 dark:text-white',
          'hover:bg-gray-200 dark:hover:bg-white/20',
        ],
        ghost: [
          'bg-transparent dark:bg-transparent',
          'border border-gray-200 dark:border-white/15',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-gray-50 dark:hover:bg-white/10',
          'hover:border-gray-300 dark:hover:border-white/25',
        ],
        accent: [
          'bg-orange-500 dark:bg-orange-500',
          'text-white',
          'shadow-lg hover:shadow-xl dark:shadow-orange-500/20',
          'hover:bg-orange-600 dark:hover:bg-orange-400',
        ],
      },
      size: {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2.5',
        lg: 'text-lg px-6 py-3',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export type GlassButtonVariantsProps = VariantProps<typeof glassButtonVariants>;
