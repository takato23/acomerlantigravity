import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

import { PricingPlan, PricingProps } from '../../types';
import { GlassPricingCard } from '../ui/GlassCard';
import { CTAButton, SecondaryButton } from '../ui/GradientButton';
import { ValuePropositionIllustration } from '../ui/FlatIllustrations';

const slateColors = {
  primary: '#1e293b',
  secondary: '#334155',
  accent: '#f97316'
};

const progressLevels = [
  { level: 1, name: 'Beginner Chef', color: 'from-slate-500 to-slate-600', recipes: 10 },
  { level: 2, name: 'Home Cook', color: 'from-slate-400 to-slate-500', recipes: 50 },
  { level: 3, name: 'Kitchen Pro', color: 'from-slate-400 to-slate-500', recipes: 200 },
  { level: 4, name: 'Culinary Expert', color: 'from-slate-300 to-slate-400', recipes: 500 },
  { level: 5, name: 'Master Chef', color: 'from-orange-400 to-orange-500', recipes: 1000 }
];

interface ProgressBarProps {
  level: number;
  recipes: number;
  className?: string;
}

function ProgressBar({ level, recipes, className }: ProgressBarProps) {
  const currentLevel = progressLevels.find(l => l.level === level) || progressLevels[0];
  const nextLevel = progressLevels.find(l => l.level === level + 1);
  const progress = nextLevel ? (recipes / nextLevel.recipes) * 100 : 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-300">
          {currentLevel.name}
        </span>
        <span className="text-xs text-slate-500">
          {recipes} / {nextLevel?.recipes || recipes} recipes
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <motion.div
          className={cn(
            'h-2 rounded-full bg-gradient-to-r',
            currentLevel.color
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      {nextLevel && (
        <div className="text-xs text-slate-500">
          {nextLevel.recipes - recipes} recipes to reach {nextLevel.name}
        </div>
      )}
    </div>
  );
}

interface PricingToggleProps {
  billing: 'monthly' | 'yearly';
  onChange: (billing: 'monthly' | 'yearly') => void;
}

function PricingToggle({ billing, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      <span className={cn(
        'text-sm font-medium transition-colors',
        billing === 'monthly' ? 'text-white' : 'text-slate-500'
      )}>
        Monthly
      </span>
      <div className="relative">
        <motion.button
          className="w-14 h-7 bg-slate-700 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          onClick={() => onChange(billing === 'monthly' ? 'yearly' : 'monthly')}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="w-5 h-5 bg-orange-500 rounded-full"
            animate={{
              x: billing === 'yearly' ? 28 : 0
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </motion.button>
      </div>
      <span className={cn(
        'text-sm font-medium transition-colors',
        billing === 'yearly' ? 'text-white' : 'text-slate-500'
      )}>
        Yearly
        <span className="ml-1 text-xs bg-slate-800 text-orange-500 px-2 py-1 rounded-full">
          Save 20%
        </span>
      </span>
    </div>
  );
}

export function Pricing({
  title,
  subtitle,
  plans,
  billing,
  onBillingChange,
  className,
  ...props
}: PricingProps) {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <section
      className={cn(
        'py-20 lg:py-24',
        'bg-slate-900',
        className
      )}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-white">
              {title}
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <PricingToggle billing={billing} onChange={onBillingChange} />

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className="relative"
            >
              <GlassPricingCard
                popular={plan.popular}
                gradient={plan.gradient}
                className="h-full relative overflow-hidden"
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-orange-500 text-white px-6 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-8 text-center">
                  {/* Plan Icon */}
                  <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-slate-800 border border-slate-700">
                    {plan.icon}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>

                  {/* Plan Description */}
                  <p className="text-slate-400 mb-6">
                    {plan.description}
                  </p>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-white">
                        ${billing === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price}
                      </span>
                      <span className="text-slate-500 ml-1">
                        /{plan.period}
                      </span>
                    </div>
                    {billing === 'yearly' && (
                      <div className="text-sm text-slate-500 mt-1">
                        Save ${(plan.price * 12) - (Math.floor(plan.price * 0.8) * 12)} per year
                      </div>
                    )}
                  </div>

                  {/* Progress Bar for Gamification */}
                  <ProgressBar
                    level={index + 1}
                    recipes={[10, 50, 200][index] || 200}
                    className="mb-6"
                  />

                  {/* CTA Button */}
                  <div className="mb-8">
                    {plan.popular ? (
                      <CTAButton
                        className="w-full group relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {plan.buttonText}
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </CTAButton>
                    ) : (
                      <SecondaryButton
                        className="w-full group relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {plan.buttonText}
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </SecondaryButton>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-4 text-left">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: featureIndex * 0.1 }}
                        className="flex items-start space-x-3"
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-400">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Hover Effect */}
                <AnimatePresence>
                  {hoveredPlan === plan.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-800/50 rounded-xl"
                    />
                  )}
                </AnimatePresence>
              </GlassPricingCard>
            </motion.div>
          ))}
        </div>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">
                  Why Choose Premium?
                </h3>
                <div className="space-y-4 text-left">
                  {[
                    'Unlimited AI-generated recipes',
                    'Advanced meal planning with nutritional analysis',
                    'Smart pantry management and expiration tracking',
                    'Priority customer support',
                    'Exclusive beta features and early access'
                  ].map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span className="text-slate-400">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <ValuePropositionIllustration
                  colors={slateColors}
                  size="lg"
                  animated={true}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Have Questions?
            </h3>
            <p className="text-slate-400 mb-6">
              Check out our frequently asked questions or contact our support team.
            </p>
            <SecondaryButton
              size="md"
              className="group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                View FAQ
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </SecondaryButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Specialized Pricing variants
export function ProductPricing({
  title = "Choose Your Culinary Journey",
  subtitle = "Start free and upgrade as you grow your cooking skills and recipe collection",
  ...props
}: Partial<PricingProps>) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'month',
      description: 'Perfect for trying out our AI-powered recipe generation',
      features: [
        '5 AI-generated recipes per month',
        'Basic meal planning',
        'Simple shopping lists',
        'Community access',
        'Mobile app access'
      ],
      popular: false,
      gradient: 'bg-slate-800',
      buttonText: 'Get Started Free',
      icon: (
        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      period: 'month',
      description: 'Ideal for home cooks who want to elevate their cooking',
      features: [
        'Unlimited AI-generated recipes',
        'Advanced meal planning',
        'Nutritional analysis',
        'Smart pantry management',
        'Shopping optimization',
        'Recipe sharing',
        'Priority support'
      ],
      popular: true,
      gradient: 'bg-slate-800',
      buttonText: 'Start Pro Trial',
      icon: (
        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'family',
      name: 'Family',
      price: 19.99,
      period: 'month',
      description: 'Perfect for families who want to plan together',
      features: [
        'Everything in Pro',
        'Family meal planning',
        'Multiple dietary preferences',
        'Family recipe sharing',
        'Batch cooking suggestions',
        'Educational cooking content',
        'Family account management',
        'Premium support'
      ],
      popular: false,
      gradient: 'bg-slate-800',
      buttonText: 'Try Family Plan',
      icon: (
        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  return (
    <Pricing
      title={title}
      subtitle={subtitle}
      plans={plans}
      billing={billing}
      onBillingChange={setBilling}
      {...props}
    />
  );
}
