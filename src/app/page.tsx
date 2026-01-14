import { Metadata } from 'next';
import { LandingPageClient } from './LandingPageClient';

export const metadata: Metadata = {
  title: 'KeCarajoComer - Tu Chef IA Personal para Cocinar con lo que Hay',
  description: '¿No sabés qué comer? Decile a nuestro Chef IA qué ingredientes tenés y recibí recetas increíbles al instante. Planificación de comidas inteligente, listas de compras y cero desperdicio.',
  keywords: ['recetas con ia', 'que cocinar hoy', 'no se que comer', 'recetas faciles', 'chef inteligencia artificial', 'planificador de comidas', 'cocina argentina'],
  openGraph: {
    title: 'KeCarajoComer - Tu Chef IA Personal',
    description: 'Transformá tus ingredientes en platos deliciosos con Inteligencia Artificial. ¡Probá ahora gratis!',
    url: 'https://kecarajocomer.com',
    siteName: 'KeCarajoComer',
    images: [
      {
        url: '/images/og-image.jpg', // We should ensure this exists or use a generic one
        width: 1200,
        height: 630,
        alt: 'KeCarajoComer - Cocina con IA',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeCarajoComer - Cocina con lo que tenés',
    description: 'Recetas al instante con los ingredientes de tu heladera. Potenciado por IA.',
    images: ['/images/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://kecarajocomer.com',
  },
};

export default function LandingPage() {
  return <LandingPageClient />;
}