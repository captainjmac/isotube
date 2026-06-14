import type { AppState } from '@/types';
import type { StorageAdapter } from './types';
import { API_BASE } from './apiBase';

/**
 * Cloud-sync adapter backed by the app's own Cloudflare Pages Functions + D1.
 *
 * Identity is a "sync code": a server-minted, HMAC-signed bearer key. Whoever
 * holds the code can read/write that state blob — paste the same code on another
 * device to sync. Mirrors the method surface useCloudSync relies on so it can be
 * swapped in for the old SupabaseAdapter with a minimal diff.
 */
export class CloudflareAdapter implements StorageAdapter {
    private syncKey: string;
    private baseUrl: string;
    private lastUpdatedAt: number | null = null;

    constructor(syncKey: string, baseUrl: string = API_BASE) {
        this.syncKey = syncKey;
        this.baseUrl = baseUrl;
    }

    private stateUrl(): string {
        return `${this.baseUrl}/api/state/${encodeURIComponent(this.syncKey)}`;
    }

    /** No session to establish; ready as long as we have a key. */
    async initialize(): Promise<boolean> {
        return this.syncKey.length > 0;
    }

    /** A 200 (has state) or 404 (no state yet) both mean the key is valid. */
    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch(this.stateUrl());
            if (res.ok || res.status === 404) {
                return { success: true };
            }
            if (res.status === 400) {
                return { success: false, error: 'Invalid sync code' };
            }
            return { success: false, error: `Unexpected response: ${res.status}` };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Connection failed',
            };
        }
    }

    async load(): Promise<AppState | null> {
        try {
            const res = await fetch(this.stateUrl());
            if (res.status === 404) {
                this.lastUpdatedAt = null;
                return null;
            }
            if (!res.ok) {
                console.error('Cloud load error:', res.status);
                return null;
            }
            const data = (await res.json()) as { state: AppState | null; updatedAt?: number };
            this.lastUpdatedAt = data.updatedAt ?? null;
            return data.state;
        } catch (error) {
            console.error('Cloud load failed:', error);
            return null;
        }
    }

    async save(state: AppState): Promise<void> {
        const res = await fetch(this.stateUrl(), {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ state }),
        });
        if (!res.ok) {
            const message = await res.text().catch(() => '');
            throw new Error(`Sync failed: ${res.status}${message ? ` ${message}` : ''}`);
        }
        const data = (await res.json().catch(() => null)) as { updatedAt?: number } | null;
        if (data?.updatedAt) this.lastUpdatedAt = data.updatedAt;
    }

    /** Returns the updated_at from the most recent load(), without a second request. */
    async getLastSyncTime(): Promise<Date | null> {
        return this.lastUpdatedAt ? new Date(this.lastUpdatedAt) : null;
    }

    /** No session to clear. */
    async signOut(): Promise<void> {
        this.lastUpdatedAt = null;
    }

    getUserId(): string | null {
        return this.syncKey || null;
    }

    /** Request a fresh server-signed sync code. */
    static async mint(baseUrl: string = API_BASE): Promise<string> {
        const res = await fetch(`${baseUrl}/api/mint`, { method: 'POST' });
        if (!res.ok) {
            throw new Error(`Failed to generate sync code: ${res.status}`);
        }
        const data = (await res.json()) as { syncKey: string };
        return data.syncKey;
    }
}
