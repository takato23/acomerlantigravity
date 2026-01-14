import React from 'react';

import { cn } from '@/lib/utils';

import { LandingPageProps } from '../types';

// Section imports
import { LandingHero } from './sections/Hero';
import { ProductFeatures } from './sections/Features';
import { ProductPricing } from './sections/Pricing';

export function LandingPage({ className, children, ...props }: LandingPageProps) {
  return (
    <div className={cn('min-h-screen bg-slate-900', className)} {...props}>
      {/* Navigation placeholder - can be added later */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-orange-500 font-bold text-sm">KC</span>
              </div>
              <span className="text-xl font-bold text-white">
                KeCaraJoComer
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-400 hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-slate-400 hover:text-white transition-colors">
                About
              </a>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all duration-300">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <LandingHero />

      {/* Features Section */}
      <ProductFeatures id="features" />

      {/* Pricing Section */}
      <ProductPricing id="pricing" />

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                  <span className="text-orange-500 font-bold text-sm">KC</span>
                </div>
                <span className="text-xl font-bold text-white">
                  KeCaraJoComer
                </span>
              </div>
              <p className="text-slate-500">
                Transform your kitchen into a smart culinary assistant with AI-powered meal planning.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-500">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-slate-500">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Recipes</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-500">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500">
            <p>&copy; 2024 KeCaraJoComer. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {children}
    </div>
  );
}

// Export individual sections for flexibility
export { LandingHero } from './sections/Hero';
export { ProductFeatures } from './sections/Features';
export { ProductPricing } from './sections/Pricing';

// Export UI components
export { GlassCard, GlassFeatureCard, GlassHeroCard, GlassPricingCard } from './ui/GlassCard';
export { GradientButton, CTAButton, SecondaryButton, AccentButton } from './ui/GradientButton';
export { 
  HeroIllustration, 
  MealPlanningIllustration, 
  SmartPantryIllustration, 
  ShoppingOptimizationIllustration,
  HappyUserIllustration,
  ValuePropositionIllustration
} from './ui/FlatIllustrations';