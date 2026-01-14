import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import { FeaturesProps } from '../../types';
import { GlassFeatureCard } from '../ui/GlassCard';
import { AccentButton } from '../ui/GradientButton';
import { 
  MealPlanningIllustration, 
  SmartPantryIllustration, 
  ShoppingOptimizationIllustration,
  HappyUserIllustration
} from '../ui/FlatIllustrations';

const slateColors = {
  primary: '#1e293b',
  secondary: '#334155',
  accent: '#f97316'
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      duration: 0.8
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};

export function Features({
  title,
  subtitle,
  features,
  layout = 'grid',
  columns = 3,
  className,
  ...props
}: FeaturesProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

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
          className="text-center mb-16"
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

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={cn(
            'grid gap-8',
            gridCols[columns]
          )}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              variants={itemVariants}
              className="relative"
            >
              <GlassFeatureCard
                hover={true}
                gradient={feature.gradient}
                className="h-full group cursor-pointer"
              >
                <div className="flex flex-col items-center text-center p-2">
                  
                  {/* Icon/Illustration */}
                  <motion.div
                    className="mb-6 relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-slate-800 border border-slate-700">
                      {feature.icon}
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-orange-500 transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover Effect - Learn More */}
                  <motion.div
                    className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ y: 10 }}
                    whileHover={{ y: 0 }}
                  >
                    <AccentButton
                      size="sm"
                      className="text-sm font-medium"
                    >
                      Learn More
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </AccentButton>
                  </motion.div>
                </div>

                {/* Animated Border Effect */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-slate-700 transition-all duration-500" />
              </GlassFeatureCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <AccentButton
            size="lg"
            className="group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore All Features
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </AccentButton>
        </motion.div>
      </div>
    </section>
  );
}

// Specialized Features variants
export function ProductFeatures({
  title = "Why Choose KeCaraJoComer?",
  subtitle = "Discover the powerful features that make meal planning effortless and enjoyable",
  ...props
}: Partial<FeaturesProps>) {
  const features = [
    {
      id: 'ai-recipe-generation',
      title: 'AI Recipe Generation',
      description: 'Get personalized recipes based on your preferences, dietary restrictions, and available ingredients using advanced AI technology.',
      icon: (
        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: 'bg-slate-800'
    },
    {
      id: 'smart-meal-planning',
      title: 'Smart Meal Planning',
      description: 'Plan your entire week with intelligent suggestions that balance nutrition, variety, and your schedule preferences.',
      icon: (
        <MealPlanningIllustration
          colors={slateColors}
          size="sm"
          animated={true}
        />
      ),
      gradient: 'bg-slate-800'
    },
    {
      id: 'pantry-management',
      title: 'Pantry Management',
      description: 'Track your ingredients, get expiration alerts, and discover recipes you can make with what you already have.',
      icon: (
        <SmartPantryIllustration
          colors={slateColors}
          size="sm"
          animated={true}
        />
      ),
      gradient: 'bg-slate-800'
    },
    {
      id: 'shopping-optimization',
      title: 'Shopping Optimization',
      description: 'Generate optimized shopping lists organized by store layout and get the best deals on your favorite ingredients.',
      icon: (
        <ShoppingOptimizationIllustration
          colors={slateColors}
          size="sm"
          animated={true}
        />
      ),
      gradient: 'bg-slate-800'
    },
    {
      id: 'nutrition-tracking',
      title: 'Nutrition Tracking',
      description: 'Monitor your nutritional intake, set health goals, and get insights to maintain a balanced diet effortlessly.',
      icon: (
        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: 'bg-slate-800'
    },
    {
      id: 'community-sharing',
      title: 'Community Sharing',
      description: 'Share your favorite recipes with friends, discover new dishes from our community, and get inspired by others.',
      icon: (
        <HappyUserIllustration
          colors={slateColors}
          size="sm"
          animated={true}
        />
      ),
      gradient: 'bg-slate-800'
    }
  ];

  return (
    <Features
      title={title}
      subtitle={subtitle}
      features={features}
      layout="grid"
      columns={3}
      {...props}
    />
  );
}

export function AppFeatures({
  title = "Everything You Need for Perfect Meals",
  subtitle = "From AI-powered recipe generation to smart shopping lists, we've got every aspect of your culinary journey covered",
  ...props
}: Partial<FeaturesProps>) {
  const features = [
    {
      id: 'voice-assistant',
      title: 'Voice Assistant',
      description: 'Cook hands-free with voice commands. Ask for recipe steps, set timers, and get cooking tips without touching your device.',
      icon: (
        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      gradient: 'bg-slate-800'
    },
    {
      id: 'offline-mode',
      title: 'Offline Mode',
      description: 'Access your recipes and meal plans even without internet. Perfect for cooking in areas with poor connectivity.',
      icon: (
        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      gradient: 'bg-slate-800'
    },
    {
      id: 'sync-devices',
      title: 'Multi-Device Sync',
      description: 'Start planning on your phone, continue on your tablet, and cook with your smart display. Everything stays in sync.',
      icon: (
        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      gradient: 'bg-slate-800'
    },
    {
      id: 'smart-substitutions',
      title: 'Smart Substitutions',
      description: 'Out of an ingredient? Get instant suggestions for substitutions that maintain the recipe\'s taste and nutritional value.',
      icon: (
        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      gradient: 'bg-slate-800'
    }
  ];

  return (
    <Features
      title={title}
      subtitle={subtitle}
      features={features}
      layout="grid"
      columns={2}
      {...props}
    />
  );
}