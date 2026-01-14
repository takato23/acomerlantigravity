'use client';

/**
 * Analytics Provider
 * Auto-initializes analytics with authenticated user and tracks key events
 */

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
    useAnalytics,
    ANALYTICS_EVENTS,
    FEATURES
} from '@/services/analytics';

// Mixpanel & Web Vitals integration
import { initMixpanel, trackUser } from '@/lib/analytics/mixpanel';
import { reportWebVitals } from '@/lib/analytics/web-vitals';

interface AnalyticsContextType {
    // Track key app events
    trackSignup: () => void;
    trackLogin: () => void;
    trackLogout: () => void;
    trackPlanGenerated: (planType: string, mealCount: number) => void;
    trackPlanShared: (shareMethod: string) => void;
    trackRecipeCreated: (recipeType: string) => void;
    trackPdfDownloaded: (contentType: string) => void;
    trackChatMessage: (messageLength: number) => void;
    trackFeatureUsed: (feature: string, action: string) => void;
    // Core analytics
    track: (event: string, properties?: Record<string, any>) => void;
    identify: (userId: string, traits?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function useAppAnalytics() {
    const context = useContext(AnalyticsContext);
    if (!context) {
        // Return no-op functions if provider not available
        return {
            trackSignup: () => { },
            trackLogin: () => { },
            trackLogout: () => { },
            trackPlanGenerated: () => { },
            trackPlanShared: () => { },
            trackRecipeCreated: () => { },
            trackPdfDownloaded: () => { },
            trackChatMessage: () => { },
            trackFeatureUsed: () => { },
            track: () => { },
            identify: () => { },
        };
    }
    return context;
}

interface AnalyticsProviderProps {
    children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
    const { user } = useAuth();
    const analytics = useAnalytics();

    // Initialize Mixpanel and Web Vitals on mount
    useEffect(() => {
        initMixpanel();
        reportWebVitals();
    }, []);

    // Auto-identify user when auth state changes
    useEffect(() => {
        if (user?.id) {
            analytics.identify(user.id, {
                email: user.email,
                created_at: user.created_at,
                provider: user.app_metadata?.provider || 'email',
            });
            // Also identify in Mixpanel
            trackUser(user.id, user.email);
        }
    }, [user?.id, user?.email, analytics]);

    // Tier 4 specific event trackers
    const trackSignup = useCallback(() => {
        analytics.track(ANALYTICS_EVENTS.USER_SIGNUP, {
            timestamp: new Date().toISOString(),
            source: 'magic_link',
        });
    }, [analytics]);

    const trackLogin = useCallback(() => {
        analytics.track(ANALYTICS_EVENTS.USER_LOGIN, {
            timestamp: new Date().toISOString(),
        });
    }, [analytics]);

    const trackLogout = useCallback(() => {
        analytics.track(ANALYTICS_EVENTS.USER_LOGOUT, {
            timestamp: new Date().toISOString(),
        });
    }, [analytics]);

    const trackPlanGenerated = useCallback((planType: string, mealCount: number) => {
        analytics.track(ANALYTICS_EVENTS.MEAL_PLAN_CREATE, {
            plan_type: planType,
            meal_count: mealCount,
            timestamp: new Date().toISOString(),
        });
    }, [analytics]);

    const trackPlanShared = useCallback((shareMethod: string) => {
        analytics.track('plan_shared', {
            share_method: shareMethod,
            timestamp: new Date().toISOString(),
        });
    }, [analytics]);

    const trackRecipeCreated = useCallback((recipeType: string) => {
        analytics.track(ANALYTICS_EVENTS.RECIPE_CREATE, {
            recipe_type: recipeType,
            timestamp: new Date().toISOString(),
        });
    }, [analytics]);

    const trackPdfDownloaded = useCallback((contentType: string) => {
        analytics.track('pdf_downloaded', {
            content_type: contentType,
            timestamp: new Date().toISOString(),
        });
    }, [analytics]);

    const trackChatMessage = useCallback((messageLength: number) => {
        analytics.track('chat_message_sent', {
            message_length: messageLength,
            timestamp: new Date().toISOString(),
        });
    }, [analytics]);

    const trackFeatureUsed = useCallback((feature: string, action: string) => {
        analytics.trackFeatureUsage({
            feature,
            action,
            timestamp: Date.now(),
        });
    }, [analytics]);

    const value: AnalyticsContextType = {
        trackSignup,
        trackLogin,
        trackLogout,
        trackPlanGenerated,
        trackPlanShared,
        trackRecipeCreated,
        trackPdfDownloaded,
        trackChatMessage,
        trackFeatureUsed,
        track: analytics.track,
        identify: analytics.identify,
    };

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
}
