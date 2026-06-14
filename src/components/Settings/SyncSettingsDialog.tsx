import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CloudflareAdapter } from '@/storage/CloudflareAdapter';
import type { SyncSettings } from '@/storage/types';

interface SyncSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: SyncSettings;
    isConnected: boolean;
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    error: string | null;
    onSave: (syncKey: string) => void;
    onTestConnection: (syncKey: string) => Promise<{ success: boolean; error?: string }>;
    onDisconnect: () => void;
    onEnable: (enabled: boolean) => void;
}

export function SyncSettingsDialog({
    open,
    onOpenChange,
    settings,
    isConnected,
    isSyncing,
    lastSyncedAt,
    error,
    onSave,
    onTestConnection,
    onDisconnect,
    onEnable,
}: SyncSettingsDialogProps) {
    const [syncKey, setSyncKey] = useState(settings.syncKey);
    const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [genError, setGenError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenError(null);
        setTestResult(null);
        try {
            const key = await CloudflareAdapter.mint();
            setSyncKey(key);
            await navigator.clipboard.writeText(key).catch(() => { /* clipboard optional */ });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setGenError(err instanceof Error ? err.message : 'Failed to generate sync code');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(syncKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        const result = await onTestConnection(syncKey.trim());
        setTestResult(result);
        setIsTesting(false);
    };

    const handleSave = () => {
        onSave(syncKey.trim());
        onEnable(true);
        onOpenChange(false);
    };

    const handleDisconnect = () => {
        onDisconnect();
        onEnable(false);
        setSyncKey('');
        setTestResult(null);
    };

    const formatLastSync = (date: Date | null) => {
        if (!date) return 'Never';
        return date.toLocaleString();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                            />
                        </svg>
                        Cloud Sync Settings
                    </DialogTitle>
                    <DialogDescription>
                        Sync your playlists across devices with a private sync code.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Connection Status */}
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    isConnected ? 'bg-status-completed' : 'bg-status-unwatched'
                                }`}
                            />
                            <span className="text-sm">
                                {isConnected ? 'Connected' : 'Not connected'}
                            </span>
                        </div>
                        {isSyncing && (
                            <span className="text-xs text-muted-foreground animate-pulse">
                                Syncing...
                            </span>
                        )}
                    </div>

                    {isConnected && (
                        <div className="text-xs text-muted-foreground">
                            Last synced: {formatLastSync(lastSyncedAt)}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-destructive/15 border border-destructive/40 rounded-lg text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* Sync code */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground/80">
                            Sync code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={syncKey}
                                onChange={(e) => setSyncKey(e.target.value)}
                                placeholder="Generate a new code or paste one from another device"
                                className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder-muted-foreground/60 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={isConnected}
                                spellCheck={false}
                                autoComplete="off"
                            />
                            <button
                                onClick={handleCopy}
                                disabled={!syncKey}
                                className="px-3 py-2 bg-secondary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-foreground text-sm transition-colors whitespace-nowrap"
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        {!isConnected && (
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="text-sm text-brand hover:underline disabled:opacity-50"
                            >
                                {isGenerating ? 'Generating...' : 'Generate new code'}
                            </button>
                        )}
                        <p className="text-xs text-muted-foreground/70">
                            Paste this code on another device to sync the same library.
                            Anyone with the code can read and edit it — keep it private.
                        </p>
                        {genError && (
                            <div className="p-3 bg-destructive/15 border border-destructive/40 rounded-lg text-sm text-destructive">
                                {genError}
                            </div>
                        )}
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div
                            className={`p-3 rounded-lg text-sm ${
                                testResult.success
                                    ? 'bg-status-completed/15 border border-status-completed/40 text-status-completed'
                                    : 'bg-destructive/15 border border-destructive/40 text-destructive'
                            }`}
                        >
                            {testResult.success
                                ? 'Connection successful!'
                                : `Connection failed: ${testResult.error}`}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {isConnected ? (
                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 bg-destructive hover:bg-destructive/90 rounded-md text-white text-sm transition-colors"
                        >
                            Disconnect
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleTest}
                                disabled={!syncKey.trim() || isTesting}
                                className="px-4 py-2 bg-secondary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-foreground text-sm transition-colors"
                            >
                                {isTesting ? 'Testing...' : 'Test Connection'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!syncKey.trim() || (testResult !== null && !testResult.success)}
                                className="px-4 py-2 bg-brand text-brand-foreground hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm transition-colors shadow-[0_2px_12px_-3px_var(--glow)]"
                            >
                                Connect & Enable Sync
                            </button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
