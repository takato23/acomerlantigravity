import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import { HeroProps } from '../../types';
import { GlassHeroCard } from '../ui/GlassCard';
import { CTAButton, SecondaryButton } from '../ui/GradientButton';
import { HeroIllustration } from '../ui/FlatIllustrations';

const slateColors = {
  primary: '#1e293b',
  secondary: '#334155',
  accent: '#f97316'
};

export function Hero({
  title,
  subtitle,
  description,
  cta,
  stats,
  illustration,
  background,
  className,
  ...props
}: HeroProps) {
  return (
    <section
      className={cn(
        'relative min-h-screen flex items-center justify-center',
        'bg-slate-900',
        'overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Overlay */}
        <div className={cn(
          'absolute inset-0',
          background.gradient || 'bg-slate-800/50'
        )} />
        
        {/* Animated Background Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-slate-700/30 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        <motion.div
          className="absolute top-3/4 right-1/4 w-80 h-80 rounded-full bg-slate-600/20 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        <motion.div
          className="absolute top-1/2 left-3/4 w-72 h-72 rounded-full bg-slate-700/20 blur-3xl"
          animate={{
            x: [0, -60, 0],
            y: [0, 40, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium">
                {subtitle}
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            >
              <span className="text-white">
                {title}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              {description}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              {cta.map((button, index) => (
                button.variant === 'primary' ? (
                  <CTAButton
                    key={button.id}
                    href={button.href}
                    onClick={button.onClick}
                    className="group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {button.icon}
                      {button.text}
                    </span>
                  </CTAButton>
                ) : (
                  <SecondaryButton
                    key={button.id}
                    href={button.href}
                    onClick={button.onClick}
                    size={button.size}
                    className="group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {button.icon}
                      {button.text}
                    </span>
                  </SecondaryButton>
                )
              ))}
            </motion.div>

            {/* Stats */}
            {stats && stats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl sm:text-3xl font-bold text-white">
                      {stat.value}
                      {stat.suffix && <span className="text-sm">{stat.suffix}</span>}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Right Column - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <GlassHeroCard
              className="max-w-md lg:max-w-lg xl:max-w-xl"
              gradient="bg-slate-800/50"
              hover={true}
            >
              <div className="p-8">
                {illustration || (
                  <HeroIllustration
                    colors={slateColors}
                    size="xl"
                    animated={true}
                  />
                )}
              </div>
            </GlassHeroCard>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center space-y-2 text-slate-400"
        >
          <span className="text-sm font-medium">Scroll to explore</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}

// Specialized Hero variants for different use cases
export function ProductHero({
  title,
  subtitle,
  description,
  cta,
  stats,
  ...props
}: Omit<HeroProps, 'illustration' | 'background'>) {
  return (
    <Hero
      title={title}
      subtitle={subtitle}
      description={description}
      cta={cta}
      stats={stats}
      illustration={
        <HeroIllustration
          colors={slateColors}
          size="xl"
          animated={true}
        />
      }
      background={{
        gradient: 'bg-slate-800/50',
        overlay: 'bg-black/10'
      }}
      {...props}
    />
  );
}

export function AppHero({
  title,
  subtitle,
  description,
  cta,
  ...props
}: Omit<HeroProps, 'illustration' | 'background' | 'stats'>) {
  return (
    <Hero
      title={title}
      subtitle={subtitle}
      description={description}
      cta={cta}
      stats={[
        { label: 'Happy Users', value: '50K+' },
        { label: 'Recipes Created', value: '1M+' },
        { label: 'Time Saved', value: '2hrs', suffix: '/week' },
        { label: 'Food Waste', value: '40%', suffix: ' less' }
      ]}
      illustration={
        <HeroIllustration
          colors={slateColors}
          size="xl"
          animated={true}
        />
      }
      background={{
        gradient: 'bg-slate-800/50',
        overlay: 'bg-black/10'
      }}
      {...props}
    />
  );
}

export function LandingHero({
  ...props
}: Partial<HeroProps>) {
  return (
    <AppHero
      title="Transform Your Kitchen Into a Smart Culinary Assistant"
      subtitle="AI-Powered Meal Planning"
      description="Experience the future of cooking with our intelligent meal planning system. Generate personalized recipes, optimize your pantry, and reduce food waste with cutting-edge AI technology."
      cta={[
        {
          id: 'get-started',
          text: 'Start Cooking Smarter',
          href: '/signup',
          variant: 'primary',
          size: 'lg',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )
        },
        {
          id: 'watch-demo',
          text: 'Watch Demo',
          href: '#demo',
          variant: 'secondary',
          size: 'lg',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 100-5H9v5zm0 0v6m3-3a6 6 0 110-12 6 6 0 010 12z" />
            </svg>
          )
        }
      ]}
      {...props}
    />
  );
}