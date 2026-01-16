import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import { HeroProps } from '../../types';
import { GlassHeroCard } from '../ui/GlassCard';
import { CTAButton, SecondaryButton } from '../ui/GradientButton';
import { HeroIllustration } from '../ui/FlatIllustrations';
import { ScrollTriggeredAnimation, FloatingElement, CountUp, ParallaxElement } from '../interactive/ScrollAnimations';
import { TiltCard, PulseButton } from '../interactive/MicroInteractions';

const slateColors = {
  primary: '#1e293b',
  secondary: '#334155',
  accent: '#f97316'
};

export function ResponsiveHero({
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
        // Base layout
        'relative min-h-screen flex items-center justify-center',
        // Responsive padding
        'px-4 sm:px-6 lg:px-8',
        'pt-20 pb-8 sm:pt-24 sm:pb-12 lg:pt-32 lg:pb-16',
        // Background
        'bg-slate-900',
        'overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Background Elements with Parallax */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Overlay */}
        <div className={cn(
          'absolute inset-0',
          background.gradient || 'bg-slate-800/50'
        )} />
        
        {/* Animated Background Orbs with Parallax */}
        <ParallaxElement speed={-0.2}>
          <FloatingElement intensity="subtle" duration={20} direction="circular">
            <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 rounded-full bg-slate-700/30 blur-3xl" />
          </FloatingElement>
        </ParallaxElement>

        <ParallaxElement speed={-0.3}>
          <FloatingElement intensity="medium" duration={15} direction="up">
            <div className="absolute top-3/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 rounded-full bg-slate-600/20 blur-3xl" />
          </FloatingElement>
        </ParallaxElement>

        <ParallaxElement speed={-0.1}>
          <FloatingElement intensity="subtle" duration={18} direction="left">
            <div className="absolute top-1/2 left-3/4 w-36 h-36 sm:w-54 sm:h-54 lg:w-72 lg:h-72 rounded-full bg-slate-700/20 blur-3xl" />
          </FloatingElement>
        </ParallaxElement>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            
            {/* Subtitle with enhanced responsiveness */}
            <ScrollTriggeredAnimation animation="fadeInUp" delay={0.2}>
              <div className="mb-4 sm:mb-6">
                <span className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm font-medium">
                  {subtitle}
                </span>
              </div>
            </ScrollTriggeredAnimation>

            {/* Main Title with responsive typography */}
            <ScrollTriggeredAnimation animation="fadeInUp" delay={0.3}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="text-white">
                  {title}
                </span>
              </h1>
            </ScrollTriggeredAnimation>

            {/* Description with improved readability */}
            <ScrollTriggeredAnimation animation="fadeInUp" delay={0.4}>
              <p className="text-base sm:text-lg lg:text-xl text-slate-400 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {description}
              </p>
            </ScrollTriggeredAnimation>

            {/* CTA Buttons with enhanced mobile layout */}
            <ScrollTriggeredAnimation animation="fadeInUp" delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-12">
                {cta.map((button, index) => (
                  <PulseButton key={button.id} intensity="medium">
                    {button.variant === 'primary' ? (
                      <CTAButton
                        href={button.href}
                        onClick={button.onClick}
                        className="group relative overflow-hidden w-full sm:w-auto"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {button.icon}
                          <span className="whitespace-nowrap">{button.text}</span>
                        </span>
                      </CTAButton>
                    ) : (
                      <SecondaryButton
                        href={button.href}
                        onClick={button.onClick}
                        size="lg"
                        className="group relative overflow-hidden w-full sm:w-auto"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {button.icon}
                          <span className="whitespace-nowrap">{button.text}</span>
                        </span>
                      </SecondaryButton>
                    )}
                  </PulseButton>
                ))}
              </div>
            </ScrollTriggeredAnimation>

            {/* Stats with enhanced mobile layout */}
            {stats && stats.length > 0 && (
              <ScrollTriggeredAnimation animation="fadeInUp" delay={0.6}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {stats.map((stat, index) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
                        <CountUp end={parseInt(stat.value)} />
                        {stat.suffix && <span className="text-sm">{stat.suffix}</span>}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-400">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollTriggeredAnimation>
            )}
          </div>

          {/* Right Column - Illustration with 3D tilt effect */}
          <div className="flex justify-center lg:justify-end order-1 lg:order-2">
            <ScrollTriggeredAnimation animation="scaleIn" delay={0.2}>
              <TiltCard maxTilt={8} scale={1.02}>
                <GlassHeroCard
                  className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"
                  gradient="bg-slate-800/50"
                  hover={true}
                >
                  <div className="p-4 sm:p-6 lg:p-8">
                    <FloatingElement intensity="subtle" duration={4}>
                      {illustration || (
                        <HeroIllustration
                          colors={slateColors}
                          size="xl"
                          animated={true}
                        />
                      )}
                    </FloatingElement>
                  </div>
                </GlassHeroCard>
              </TiltCard>
            </ScrollTriggeredAnimation>
          </div>
        </div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <ScrollTriggeredAnimation animation="fadeInUp" delay={1} className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2">
        <FloatingElement intensity="subtle" duration={2}>
          <div className="flex flex-col items-center space-y-2 text-slate-400">
            <span className="text-xs sm:text-sm font-medium hidden sm:block">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="p-2 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </motion.div>
          </div>
        </FloatingElement>
      </ScrollTriggeredAnimation>
    </section>
  );
}

// Enhanced specialized variants with better accessibility
export function AccessibleHero({
  title,
  subtitle,
  description,
  cta,
  stats,
  ...props
}: Omit<HeroProps, 'illustration' | 'background'>) {
  return (
    <ResponsiveHero
      title={title}
      subtitle={subtitle}
      description={description}
      cta={cta.map(button => ({
        ...button,
        // Add ARIA labels for better accessibility
        'aria-label': button.variant === 'primary' 
          ? `${button.text} - Primary action`
          : `${button.text} - Secondary action`
      } as any))}
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

export function MobileOptimizedHero({
  title,
  subtitle,
  description,
  cta,
  ...props
}: Omit<HeroProps, 'illustration' | 'background' | 'stats'>) {
  return (
    <ResponsiveHero
      title={title}
      subtitle={subtitle}
      description={description}
      cta={cta}
      stats={[
        { label: 'Users', value: '50K+', gradient: 'from-orange-400 to-orange-600' },
        { label: 'Recipes', value: '1M+', gradient: 'from-slate-200 to-slate-400' },
        { label: 'Time Saved', value: '2hrs', suffix: '/week', gradient: 'from-sky-300 to-sky-500' },
        { label: 'Less Waste', value: '40%', suffix: '', gradient: 'from-emerald-300 to-emerald-500' }
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
      className="px-4 sm:px-6" // Enhanced mobile padding
      {...props}
    />
  );
}
