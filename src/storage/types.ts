import type { AppState } from '@/types';

export interface StorageAdapter {
    load(): Promise<AppState | null>;
    save(state: AppState): Promise<void>;
}

export interface SyncSettings {
    enabled: boolean;
    syncKey: string;
    lastSyncedAt: number | null;
}

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
    enabled: false,
    syncKey: '',
    lastSyncedAt: null,
};
