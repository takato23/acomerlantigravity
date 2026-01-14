'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

type Intensity = 'full' | 'subtle' | 'minimal';

interface AuroraMeshGradientProps {
  intensity?: Intensity;
  className?: string;
}

const orbConfigs = {
  full: [
    { color: 'bg-purple-500/30', size: 'w-96 h-96', position: 'top-0 -left-48', blur: 'blur-3xl', duration: 20 },
    { color: 'bg-pink-500/25', size: 'w-80 h-80', position: 'top-1/4 right-0', blur: 'blur-3xl', duration: 18 },
    { color: 'bg-cyan-500/20', size: 'w-72 h-72', position: 'bottom-0 left-1/4', blur: 'blur-3xl', duration: 22 },
    { color: 'bg-orange-500/25', size: 'w-64 h-64', position: 'bottom-1/4 right-1/4', blur: 'blur-3xl', duration: 15 },
  ],
  subtle: [
    { color: 'bg-purple-500/20', size: 'w-64 h-64', position: 'top-0 -right-32', blur: 'blur-3xl', duration: 25 },
    { color: 'bg-orange-500/15', size: 'w-48 h-48', position: 'bottom-0 -left-24', blur: 'blur-3xl', duration: 20 },
  ],
  minimal: [
    { color: 'bg-purple-500/10', size: 'w-48 h-48', position: 'top-1/2 -right-24', blur: 'blur-3xl', duration: 30 },
  ],
};

export function AuroraMeshGradient({ intensity = 'subtle', className = '' }: AuroraMeshGradientProps) {
  const { effectiveTheme } = useTheme();

  // Only show in dark mode
  if (effectiveTheme !== 'dark') return null;

  const orbs = orbConfigs[intensity];

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full ${orb.color} ${orb.size} ${orb.position} ${orb.blur}`}
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ willChange: 'transform, opacity' }}
        />
      ))}

      {/* Base gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />
    </div>
  );
}
