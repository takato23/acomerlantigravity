import { MetadataRoute } from 'next';

const BASE_URL = 'https://kecarajocomer.com';

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        '',
        '/login',
        '/settings',
        '/planificador',
        '/recetas',
        '/despensa',
        '/lista-compras',
        '/historial',
        '/perfil',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    return [...routes];
}
