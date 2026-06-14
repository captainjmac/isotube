/// <reference types="@cloudflare/workers-types" />

/**
 * Shared types and helpers for IsoTube's Pages Functions.
 * The leading underscore in this filename excludes it from Pages routing.
 */

export interface Env {
    DB: D1Database;
    SYNC_SECRET: string;
    YOUTUBE_API_KEY: string;
}

/** A minted sync key looks like `<uuid v4>.<base64url(HMAC-SHA256, 32 bytes) -> 43 chars>`. */
const KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[A-Za-z0-9_-]{43}$/;

/** Largest accepted state payload (bytes). */
export const MAX_BODY_BYTES = 1_000_000;

/** Encode bytes as unpadded base64url. */
export function base64url(bytes: Uint8Array): string {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Compute base64url(HMAC-SHA256(message, secret)). */
export async function hmac(message: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    return base64url(new Uint8Array(sig));
}

/** Constant-time string comparison (lengths are public). */
export function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

/** Mint a fresh, signed sync key. */
export async function mintKey(secret: string): Promise<string> {
    const uuid = crypto.randomUUID();
    const sig = await hmac(uuid, secret);
    return `${uuid}.${sig}`;
}

/** Validate a sync key's format and HMAC signature. */
export async function validateKey(key: string, secret: string): Promise<boolean> {
    if (!KEY_RE.test(key)) return false;
    const [uuid, sig] = key.split('.');
    const expected = await hmac(uuid, secret);
    return timingSafeEqual(sig, expected);
}

/** JSON response helper. */
export function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}
