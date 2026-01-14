import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface GlassTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  glowColor?: string;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ className, label, error, glowColor, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        
        <motion.div
          animate={{
            boxShadow: isFocused && glowColor
              ? `0 0 20px ${glowColor}`
              : '0 0 0px rgba(0,0,0,0)'
          }}
          transition={{ duration: 0.3 }}
          className="relative rounded-xl"
        >
          <textarea
            ref={ref}
            className={cn(
              "w-full px-4 py-3 rounded-xl",
              "bg-white/80",
              "backdrop-blur-md",
              "border border-slate-200",
              "text-slate-900",
              "placeholder-slate-500",
              "transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-slate-400/30",
              "hover:bg-white/90 hover:border-slate-300",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "resize-none",
              "scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent",
              error && "border-red-500/50",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {/* Glass effect overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        </motion.div>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

GlassTextarea.displayName = 'GlassTextarea';