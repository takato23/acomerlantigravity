'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

type Density = 'sparse' | 'medium' | 'dense';

interface FloatingFoodSilhouettesProps {
  density?: Density;
  className?: string;
}

// Food silhouette SVG paths
const foodShapes = [
  // Apple
  {
    path: 'M12 2C11.5 2 11 2.2 10.6 2.6C10.2 2.2 9.5 2 9 2C7 2 5.5 3.5 5.5 5.5C5.5 6.4 5.8 7.2 6.3 7.8C4.3 9 3 11.3 3 14C3 18.4 6.6 22 11 22H13C17.4 22 21 18.4 21 14C21 11.3 19.7 9 17.7 7.8C18.2 7.2 18.5 6.4 18.5 5.5C18.5 3.5 17 2 15 2C14.5 2 14 2.2 13.6 2.6C13.2 2.2 12.5 2 12 2Z',
    viewBox: '0 0 24 24',
  },
  // Carrot
  {
    path: 'M16 3L13.5 5.5L14.5 6.5L17 4L16 3ZM11.5 7.5L10 9L11 10L12.5 8.5L11.5 7.5ZM8.5 10.5L6 13L7 14L9.5 11.5L8.5 10.5ZM4 15L2 21L8 19L4 15Z',
    viewBox: '0 0 24 24',
  },
  // Tomato
  {
    path: 'M12 4C12 4 10 2 8 2C6 2 4 4 4 6C4 8 6 10 8 10C8 10 6 8 8 6C10 4 12 4 12 4ZM12 6C8 6 4 10 4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14C20 10 16 6 12 6Z',
    viewBox: '0 0 24 24',
  },
  // Leaf/Herb
  {
    path: 'M17 8C8 10 5.9 16.2 5.9 20C5.9 20 9.2 15.7 17 14.4V8ZM17 2C17 2 12 4 12 10C12 13 14 15 17 15V2Z',
    viewBox: '0 0 24 24',
  },
  // Fork/Utensil
  {
    path: 'M5 3V12H7V3H5ZM9 3V8C9 9.7 7.7 11 6 11V22H8V14C9.7 14 11 12.7 11 11V3H9ZM17 3V9H15V3H13V9H17V3ZM15 11V22H17V11H15Z',
    viewBox: '0 0 24 24',
  },
  // Pot/Pan
  {
    path: 'M8 2V4H3C2.4 4 2 4.4 2 5V7C2 7.6 2.4 8 3 8H21C21.6 8 22 7.6 22 7V5C22 4.4 21.6 4 21 4H16V2H8ZM4 10V18C4 20.2 5.8 22 8 22H16C18.2 22 20 20.2 20 18V10H4Z',
    viewBox: '0 0 24 24',
  },
  // Bread/Croissant
  {
    path: 'M22 12C22 10 21 9 19 9C17 9 16 8 14 8C12 8 10 9 10 11C10 11 8 10 6 11C4 12 3 14 4 16C5 18 7 19 10 19H18C20 19 22 17 22 15C22 14 22 13 22 12Z',
    viewBox: '0 0 24 24',
  },
  // Egg
  {
    path: 'M12 2C8.1 2 5 7.4 5 13C5 18.5 8.1 22 12 22C15.9 22 19 18.5 19 13C19 7.4 15.9 2 12 2Z',
    viewBox: '0 0 24 24',
  },
];

const densityConfigs: Record<Density, number> = {
  sparse: 4,
  medium: 8,
  dense: 12,
};

function generateElements(count: number) {
  const elements = [];
  for (let i = 0; i < count; i++) {
    const shape = foodShapes[i % foodShapes.length];
    elements.push({
      ...shape,
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      scale: 0.5 + Math.random() * 1,
      rotation: Math.random() * 360,
      duration: 20 + Math.random() * 20,
      delay: Math.random() * 10,
    });
  }
  return elements;
}

export function FloatingFoodSilhouettes({ density = 'sparse', className = '' }: FloatingFoodSilhouettesProps) {
  const { effectiveTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  // Only show in dark mode
  if (effectiveTheme !== 'dark') return null;

  const count = densityConfigs[density];
  const elements = generateElements(count);

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {elements.map((element) => (
        <motion.svg
          key={element.id}
          viewBox={element.viewBox}
          className="absolute w-12 h-12 fill-white/[0.04]"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            transform: `scale(${element.scale}) rotate(${element.rotation}deg)`,
          }}
          initial={{ opacity: 0 }}
          animate={
            shouldReduceMotion
              ? { opacity: 0.04 }
              : {
                  opacity: [0.02, 0.05, 0.02],
                  y: [0, -30, 0],
                  x: [0, 15, 0],
                  rotate: [element.rotation, element.rotation + 10, element.rotation],
                }
          }
          transition={{
            duration: element.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: element.delay,
          }}
        >
          <path d={element.path} />
        </motion.svg>
      ))}
    </div>
  );
}
