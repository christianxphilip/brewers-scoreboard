import { API_URL } from './api';

/**
 * Formats an image URL.
 * If the URL is absolute (S3 or external), it returns it as is.
 * If it's a relative path (local upload), it prefixes it with the API_URL.
 * @param {string} path - The image path or URL
 * @returns {string} The formatted image URL
 */
export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Ensure relative paths start with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_URL}${normalizedPath}`;
};
