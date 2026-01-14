import { MetadataRoute } from 'next';

const BASE_URL = 'https://kecarajocomer.com';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin/', '/private/'],
        },
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
