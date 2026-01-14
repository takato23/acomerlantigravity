// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay (optional - uncomment if needed)
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,

    // Only enable in production
    enabled: process.env.NODE_ENV === 'production',

    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',

    // Filter out noisy errors
    ignoreErrors: [
        // Browser extensions
        /ResizeObserver loop/,
        /ChunkLoadError/,
        // Network errors
        /Network request failed/,
        /Failed to fetch/,
    ],

    beforeSend(event) {
        // Don't send events in development
        if (process.env.NODE_ENV !== 'production') {
            console.log('[Sentry Dev] Would send:', event);
            return null;
        }
        return event;
    },
});
