/**
 * Web Vitals Reporter
 * Tracks Core Web Vitals and sends them to analytics
 */

import { trackEvent, AnalyticsEvents } from './mixpanel';

interface WebVitalMetric {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
}

// Thresholds for Web Vitals ratings
const THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
}

function sendToAnalytics(metric: WebVitalMetric): void {
    trackEvent(AnalyticsEvents.WEB_VITAL, {
        metric_name: metric.name,
        metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_rating: metric.rating,
        metric_id: metric.id,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        device_memory: (navigator as any).deviceMemory || 'unknown',
    });
}

/**
 * Report Web Vitals to analytics
 * Call this in your root layout or app component
 */
export async function reportWebVitals(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        // Dynamic import to avoid bundling if not used
        const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

        const handleMetric = (metric: { name: string; value: number; delta: number; id: string }) => {
            const rating = getRating(metric.name, metric.value);
            sendToAnalytics({ ...metric, rating });

            // Log in development
            if (process.env.NODE_ENV === 'development') {
                const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
                console.log(
                    `${color} [Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${rating})`
                );
            }
        };

        onCLS(handleMetric);
        onFCP(handleMetric);
        onLCP(handleMetric);
        onTTFB(handleMetric);
        onINP(handleMetric);
    } catch (error) {
        // web-vitals not available, silently fail
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Web Vitals] Failed to load web-vitals library');
        }
    }
}

/**
 * Get current performance summary
 */
export function getPerformanceSummary(): Record<string, number> {
    if (typeof window === 'undefined' || !window.performance) {
        return {};
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (!navigation) return {};

    return {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domParse: navigation.domInteractive - navigation.responseEnd,
        domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.startTime,
    };
}
