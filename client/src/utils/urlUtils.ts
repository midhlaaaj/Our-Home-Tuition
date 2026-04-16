/**
 * Helper to get the correct base URL for redirects and links.
 * It handles local development, Vercel preview/branch URLs, and production.
 */
export const getURL = () => {
    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? // Custom site URL env var
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set on Vercel
        'https://hourhome.in'; // Hardcoded production fallback

    // Ensure the URL includes the protocol
    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }

    // Ensure the URL has a trailing slash for consistency
    if (!url.endsWith('/')) {
        url = `${url}/`;
    }

    return url;
};
