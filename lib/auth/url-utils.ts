/**
 * Utility to determine the base URL for redirects, especially for authentication.
 * Handles local development, Vercel previews, and production environments.
 */
export function getURL() {
    let url =
        process.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production
        process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel for preview/deployment
        'http://localhost:3000/';

    // Make sure to include `https://` when not localhost
    url = url.includes('http') ? url : `https://${url}`;

    // Ensure the URL has a trailing slash
    return url.endsWith('/') ? url : `${url}/`;
}
