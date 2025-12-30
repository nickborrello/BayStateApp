import { MetadataRoute } from 'next';

/**
 * Web App Manifest for PWA functionality.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Bay State Pet & Garden Supply',
        short_name: 'Bay State P&G',
        description: 'Your local source for pet supplies, garden tools, and farm products.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#16a34a', // Green-600 for garden theme
        orientation: 'portrait-primary',
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
        ],
        categories: ['shopping', 'lifestyle'],
    };
}
