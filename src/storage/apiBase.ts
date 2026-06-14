/**
 * Base URL for the app's own API (Cloudflare Pages Functions).
 *
 * Empty string = same-origin relative paths. This works in production (Functions
 * served from the same Pages project), in `wrangler pages dev` (single origin),
 * and in `npm run dev` where Vite proxies /api/* to wrangler (see vite.config.ts).
 */
export const API_BASE = '';
