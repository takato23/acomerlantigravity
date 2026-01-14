import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Modal container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                duration: 0.3,
                type: "spring",
                damping: 25,
                stiffness: 300
              }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative w-full pointer-events-auto",
                sizeStyles[size],
                className
              )}
            >
              {/* Multiple glass layers for depth */}
              <div className="relative">
                {/* Ambient shadow */}
                <div className="absolute inset-0 bg-slate-300/20 blur-3xl -z-10 translate-y-4" />

                {/* Main modal */}
                <div className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200 shadow-2xl">
                  {/* Glass layers */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

                  {/* Animated gradient background */}
                  <div className="absolute inset-0 opacity-[0.02]">
                    <div className="absolute inset-0 bg-slate-400 animate-gradient-xy" />
                  </div>
                  
                  {/* Noise texture */}
                  <div className="absolute inset-0 opacity-[0.015]" 
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                    }} 
                  />
                  
                  {/* Header */}
                  {(title || showCloseButton) && (
                    <div className="relative px-6 py-5 border-b border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          {title && (
                            <h2 className="text-xl font-bold text-slate-900">
                              {title}
                            </h2>
                          )}
                          {description && (
                            <p className="mt-1 text-sm text-slate-600">
                              {description}
                            </p>
                          )}
                        </div>

                        {showCloseButton && (
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="relative -mr-2 -mt-2 p-2 rounded-xl overflow-hidden group"
                          >
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-slate-100 transition-colors duration-300" />
                            <X className="relative w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="relative p-6">
                    {children}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};