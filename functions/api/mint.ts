import { json, mintKey, type Env } from '../_shared';

/**
 * POST /api/mint -> { syncKey }
 * Returns a fresh server-signed sync key. No D1 row is created here; the row is
 * created lazily on the first PUT, which keeps minting cheap and abuse-resistant.
 */
export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
    if (!env.SYNC_SECRET) {
        return json({ error: 'Server not configured' }, 500);
    }
    const syncKey = await mintKey(env.SYNC_SECRET);
    return json({ syncKey });
};

export const onRequest: PagesFunction<Env> = () => json({ error: 'Method not allowed' }, 405);
