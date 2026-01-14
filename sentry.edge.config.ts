// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV,

    // Performance Monitoring - lower sample rate for edge
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    // Only enable in production
    enabled: process.env.NODE_ENV === 'production',

    // Debug mode for development
    debug: false,
});
