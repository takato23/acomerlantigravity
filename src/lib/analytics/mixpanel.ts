/**
 * Mixpanel Analytics Integration
 * Product analytics for tracking user behavior
 */

// Type definitions for Mixpanel (avoiding full import for bundle size)
interface MixpanelInstance {
    init: (token: string, config?: Record<string, unknown>) => void;
    track: (event: string, properties?: Record<string, unknown>) => void;
    identify: (userId: string) => void;
    people: {
        set: (properties: Record<string, unknown>) => void;
    };
    reset: () => void;
}

declare global {
    interface Window {
        mixpanel?: MixpanelInstance;
    }
}

let mixpanelInstance: MixpanelInstance | null = null;
let isInitialized = false;

/**
 * Initialize Mixpanel - call this once in your app
 */
export function initMixpanel(): void {
    if (typeof window === 'undefined') return;
    if (isInitialized) return;

    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

    if (!token) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[Mixpanel] No token found - analytics disabled');
        }
        return;
    }

    // Lazy load Mixpanel script
    const script = document.createElement('script');
    script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
    script.async = true;
    script.onload = () => {
        if (window.mixpanel) {
            window.mixpanel.init(token, {
                debug: process.env.NODE_ENV === 'development',
                track_pageview: true,
                persistence: 'localStorage',
            });
            mixpanelInstance = window.mixpanel;
            isInitialized = true;

            if (process.env.NODE_ENV === 'development') {
                console.log('[Mixpanel] Initialized successfully');
            }
        }
    };
    document.head.appendChild(script);
}

/**
 * Track an event
 */
export function trackEvent(
    eventName: string,
    properties?: Record<string, unknown>
): void {
    // Always log in development for debugging
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${eventName}`, properties || {});
    }

    // Only send to Mixpanel in production
    if (process.env.NODE_ENV !== 'production') return;

    if (mixpanelInstance) {
        mixpanelInstance.track(eventName, {
            ...properties,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.pathname : undefined,
        });
    }
}

/**
 * Identify a user
 */
export function trackUser(userId: string, email?: string): void {
    if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Identify user:', userId, email);
    }

    if (process.env.NODE_ENV !== 'production') return;

    if (mixpanelInstance) {
        mixpanelInstance.identify(userId);
        if (email) {
            mixpanelInstance.people.set({
                $email: email,
                $last_seen: new Date().toISOString(),
            });
        }
    }
}

/**
 * Track a page view
 */
export function trackPageView(path: string): void {
    trackEvent('page_view', { path });
}

/**
 * Reset user identity (on logout)
 */
export function resetUser(): void {
    if (mixpanelInstance) {
        mixpanelInstance.reset();
    }
}

// Pre-defined event names for consistency
export const AnalyticsEvents = {
    // Auth
    USER_SIGNUP: 'user_signup',
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',

    // Meal Planning
    PLAN_GENERATED: 'plan_generated',
    PLAN_SHARED: 'plan_shared',
    PLAN_DUPLICATED: 'plan_duplicated',
    PDF_DOWNLOADED: 'pdf_downloaded',

    // Recipes
    RECIPE_VIEWED: 'recipe_viewed',
    RECIPE_CREATED: 'recipe_created',
    RECIPE_ADDED_TO_PLAN: 'recipe_added_to_plan',

    // AI Features
    CHAT_MESSAGE_SENT: 'chat_message_sent',
    AI_SUGGESTION_USED: 'ai_suggestion_used',

    // Shopping
    SHOPPING_LIST_CREATED: 'shopping_list_created',
    SHOPPING_ITEM_CHECKED: 'shopping_item_checked',

    // Performance
    WEB_VITAL: 'web_vital',
} as const;
