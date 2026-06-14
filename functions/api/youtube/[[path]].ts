import { json, type Env } from '../../_shared';

/**
 * GET /api/youtube/<resource>?<params> -> proxied YouTube Data API v3 response.
 *
 * Forwards the request to googleapis with the API key injected server-side, so
 * the key never ships in the client bundle. Only the resources IsoTube uses are
 * allowed, to prevent the proxy being abused as a generic googleapis relay.
 */
const ALLOWED = new Set(['videos', 'playlists', 'playlistItems', 'channels', 'search']);

export const onRequestGet: PagesFunction<Env> = async ({ env, params, request }) => {
    if (!env.YOUTUBE_API_KEY) {
        return json({ error: 'Server not configured' }, 500);
    }

    const segments = Array.isArray(params.path) ? params.path : [params.path];
    const resource = String(segments[0] ?? '');
    if (!ALLOWED.has(resource) || segments.length !== 1) {
        return json({ error: 'Not found' }, 404);
    }

    const incoming = new URL(request.url);
    const target = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
    for (const [k, v] of incoming.searchParams) {
        if (k !== 'key') target.searchParams.set(k, v);
    }
    target.searchParams.set('key', env.YOUTUBE_API_KEY);

    const upstream = await fetch(target.toString(), {
        headers: { accept: 'application/json' },
    });

    // Pass through status + JSON body verbatim so client-side error parsing works.
    return new Response(upstream.body, {
        status: upstream.status,
        headers: { 'content-type': 'application/json' },
    });
};

export const onRequest: PagesFunction<Env> = () => json({ error: 'Method not allowed' }, 405);
