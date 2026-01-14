import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import './globals.css';
import '@/styles/ios26/glass.css';
import '@/styles/navigation/navigation.css';
// import '@/styles/meal-planner.css';
import PWAInstaller from '@/components/PWAInstaller';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';

// Providers moved to client-providers.tsx and used in (app)/layout.tsx

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  title: 'KeCarajoComer - Planificación de Comidas con IA',
  description: 'Transformá la planificación de comidas con sugerencias de recetas potenciadas por IA, gestión inteligente de despensa y listas de compras optimizadas',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KeCarajoComer'
  },
  formatDetection: {
    telephone: false
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#10b981',
    'theme-color': '#10b981'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#10b981',
  viewportFit: 'cover'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        {/* Theme initialization - prevents FOUC */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){
            try {
              var t=localStorage.getItem('ui-theme');
              var d=window.matchMedia('(prefers-color-scheme:dark)').matches;
              if(t==='dark'||(t==='system'&&d)||(!t&&d)){
                document.documentElement.classList.add('dark');
              }
            } catch(e){}
          })();`
        }} />

        {/* Preload critical resources */}
        <link rel="preload" href="/sw.js" as="script" />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />

        {/* App icons */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16.png" />
        <meta name="apple-mobile-web-app-title" content="KeCarajoComer" />
        <meta name="application-name" content="KeCarajoComer" />

        {/* Critical CSS inlined */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html { height: 100%; }
            body {
              margin: 0;
              min-height: 100vh;
              background-color: #ffffff;
              color: #0f172a;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
            html.dark body {
              background-color: #020617;
              color: #f8fafc;
            }
          `
        }} />

      </head>
      <body className={`${inter.className} h-full`} suppressHydrationWarning>
        <GlobalErrorBoundary>
          {children}
          <PWAInstaller />
        </GlobalErrorBoundary>

        <Script
          id="sw-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                // Production: Register Service Worker
                if ('${process.env.NODE_ENV}' === 'production') {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                        
                        // Setup update checking
                        registration.addEventListener('updatefound', function() {
                          var installingWorker = registration.installing;
                          if (installingWorker) {
                            installingWorker.addEventListener('statechange', function() {
                              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                if (window.confirm('New version available! Reload to update?')) {
                                  window.location.reload();
                                }
                              }
                            });
                          }
                        });
                        
                        // Check for updates every 30 minutes
                        setInterval(function() {
                          registration.update();
                        }, 30 * 60 * 1000);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                  
                  // Setup offline/online listeners
                  window.addEventListener('online', function() {
                    console.log('App is online');
                    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                      navigator.serviceWorker.ready.then(function(registration) {
                        if (registration.sync) {
                          registration.sync.register('meal-plan-sync');
                          registration.sync.register('recipe-sync');
                        }
                      });
                    }
                  });
                  
                  window.addEventListener('offline', function() {
                    console.log('App is offline');
                  });
                } 
                // Development: Unregister Service Worker to prevent caching issues
                else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(let registration of registrations) {
                        console.log('Unregistering SW in dev mode:', registration);
                        registration.unregister();
                      }
                      if (registrations.length > 0) {
                        console.log('Service Workers unregistered. Reloading page...');
                        window.location.reload();
                      }
                    });
                  });
                }
              }
            `
          }}
        />

        {/* Performance monitoring - Only in production */}
        {process.env.NODE_ENV === 'production' && (
          <Script
            id="performance-monitor"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                // Monitor Core Web Vitals
                function sendMetric(metric) {
                  if (navigator.sendBeacon) {
                    navigator.sendBeacon('/api/analytics/web-vitals', JSON.stringify(metric));
                  }
                }
                
                // Load Web Vitals library and track metrics
                if (typeof window !== 'undefined') {
                  import('https://unpkg.com/web-vitals@3.3.2/dist/web-vitals.js')
                    .then(function(webVitals) {
                      webVitals.getCLS(sendMetric);
                      webVitals.getFID(sendMetric);
                      webVitals.getFCP(sendMetric);
                      webVitals.getLCP(sendMetric);
                      webVitals.getTTFB(sendMetric);
                    })
                    .catch(function(error) {
                      console.warn('Failed to load web vitals:', error);
                    });
                }
                
                // Monitor resource loading performance
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    var navigation = performance.getEntriesByType('navigation')[0];
                    if (navigation) {
                      var loadTime = navigation.loadEventEnd - navigation.loadEventStart;
                      var domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
                      
                      console.log('Performance:', {
                        loadTime: loadTime + 'ms',
                        domContentLoaded: domContentLoaded + 'ms',
                        transferSize: navigation.transferSize + ' bytes'
                      });
                      
                      // Send to analytics if load time is concerning
                      if (loadTime > 3000) {
                        sendMetric({
                          name: 'slow-load',
                          value: loadTime,
                          url: window.location.href
                        });
                      }
                    }
                  }, 0);
                });
              `
            }}
          />
        )}

        {/* Preload critical routes for better navigation */}
        <Script
          id="route-preloader"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              // Preload critical routes on idle
              if ('requestIdleCallback' in window) {
                requestIdleCallback(function() {
                  var criticalRoutes = [
                    '/planificador',
                    '/despensa',
                    '/recetas',
                    '/perfil'
                  ];
                  
                  criticalRoutes.forEach(function(route) {
                    var link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = route;
                    document.head.appendChild(link);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}