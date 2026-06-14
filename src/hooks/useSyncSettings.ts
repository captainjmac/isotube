import { useState, useEffect, useCallback } from 'react';
import type { SyncSettings } from '@/storage/types';
import { DEFAULT_SYNC_SETTINGS } from '@/storage/types';

const STORAGE_KEY = 'isotube-sync-settings';

/**
 * Normalize whatever is in localStorage into the current SyncSettings shape.
 * Old installs stored Supabase credentials ({ supabaseUrl, supabaseAnonKey });
 * those are dropped and sync is disabled until the user opts back in with a sync
 * code. The playlist data (isotube-state) is never touched here.
 */
function normalize(raw: unknown): SyncSettings {
    const r = raw as Partial<SyncSettings> & { lastSyncedAt?: number | null };
    if (r && typeof r.syncKey === 'string') {
        return {
            enabled: Boolean(r.enabled),
            syncKey: r.syncKey,
            lastSyncedAt: r.lastSyncedAt ?? null,
        };
    }
    return { ...DEFAULT_SYNC_SETTINGS, lastSyncedAt: r?.lastSyncedAt ?? null };
}

export function useSyncSettings() {
    const [settings, setSettings] = useState<SyncSettings>(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            return stored ? normalize(JSON.parse(stored)) : DEFAULT_SYNC_SETTINGS;
        } catch {
            return DEFAULT_SYNC_SETTINGS;
        }
    });

    // Persist settings to localStorage
    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save sync settings:', error);
        }
    }, [settings]);

    const updateSettings = useCallback((updates: Partial<SyncSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);

    const clearSettings = useCallback(() => {
        setSettings(DEFAULT_SYNC_SETTINGS);
    }, []);

    const setEnabled = useCallback((enabled: boolean) => {
        updateSettings({ enabled });
    }, [updateSettings]);

    const setSyncKey = useCallback((syncKey: string) => {
        updateSettings({ syncKey });
    }, [updateSettings]);

    const setLastSyncedAt = useCallback((timestamp: number | null) => {
        updateSettings({ lastSyncedAt: timestamp });
    }, [updateSettings]);

    const hasSyncKey = settings.syncKey.length > 0;

    return {
        settings,
        updateSettings,
        clearSettings,
        setEnabled,
        setSyncKey,
        setLastSyncedAt,
        hasSyncKey,
    };
}
