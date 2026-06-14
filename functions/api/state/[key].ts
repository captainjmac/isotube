import { json, validateKey, MAX_BODY_BYTES, type Env } from '../../_shared';

interface StateRow {
    state: string;
    updated_at: number;
}

/**
 * GET /api/state/:key -> { state, updatedAt } | 404 { state: null }
 * Returns the stored AppState for a sync key, or 404 when nothing has been
 * synced yet (the client treats that as "no remote state").
 */
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
    const key = String(params.key);
    if (!(await validateKey(key, env.SYNC_SECRET))) {
        return json({ error: 'Invalid sync key' }, 400);
    }

    const row = await env.DB.prepare(
        'SELECT state, updated_at FROM isotube_state WHERE sync_key = ?',
    )
        .bind(key)
        .first<StateRow>();

    if (!row) {
        return json({ state: null }, 404);
    }

    return json({ state: JSON.parse(row.state), updatedAt: row.updated_at });
};

/**
 * PUT /api/state/:key { state } -> { updatedAt }
 * Upserts the whole AppState blob. Server stamps updated_at so last-write-wins
 * reconciliation on the client compares a server-authoritative clock.
 */
export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
    const key = String(params.key);
    if (!(await validateKey(key, env.SYNC_SECRET))) {
        return json({ error: 'Invalid sync key' }, 400);
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
        return json({ error: 'Payload too large' }, 413);
    }

    let body: { state?: unknown };
    try {
        body = JSON.parse(raw);
    } catch {
        return json({ error: 'Invalid JSON' }, 400);
    }

    const state = body?.state as { playlists?: unknown } | undefined;
    if (!state || !Array.isArray(state.playlists)) {
        return json({ error: 'Invalid state' }, 400);
    }

    const updatedAt = Date.now();
    await env.DB.prepare(
        `INSERT INTO isotube_state (sync_key, state, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(sync_key) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
    )
        .bind(key, JSON.stringify(state), updatedAt)
        .run();

    return json({ updatedAt });
};

export const onRequest: PagesFunction<Env> = () => json({ error: 'Method not allowed' }, 405);
