import {useState} from 'react';
import {usePlaylistsContext} from '@/hooks/PlaylistsContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {cn} from '@/lib/utils';
import {tagColor} from './tagColor';

interface ManageTagsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageTagsDialog({open, onOpenChange}: ManageTagsDialogProps) {
    const {tags, tagVideoCounts, createTag, renameTag, deleteTag, mergeTags} = usePlaylistsContext();

    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [mergeSel, setMergeSel] = useState<Set<string>>(new Set());
    const [mergeTarget, setMergeTarget] = useState<string>('');

    const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name));

    const handleAdd = () => {
        if (newName.trim()) {
            createTag(newName.trim());
            setNewName('');
        }
    };

    const commitEdit = () => {
        if (editingId) renameTag(editingId, editName);
        setEditingId(null);
        setEditName('');
    };

    const toggleMerge = (id: string) => {
        setMergeSel((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectedForMerge = sorted.filter((t) => mergeSel.has(t.id));

    const handleMerge = () => {
        const target = mergeTarget && mergeSel.has(mergeTarget) ? mergeTarget : selectedForMerge[0]?.id;
        if (!target || mergeSel.size < 2) return;
        mergeTags([...mergeSel].filter((id) => id !== target), target);
        setMergeSel(new Set());
        setMergeTarget('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Tags</DialogTitle>
                    <DialogDescription>
                        Add, rename, delete, or merge tags. Counts show how many videos each tag covers (including inherited).
                    </DialogDescription>
                </DialogHeader>

                {/* Add new tag */}
                <div className="flex gap-2">
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAdd();
                        }}
                        placeholder="New tag name…"
                        className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newName.trim()}
                        className="px-3 py-2 bg-brand text-brand-foreground hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                    >
                        Add
                    </button>
                </div>

                {/* Tag list */}
                <div className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-1">
                    {sorted.length === 0 ? (
                        <p className="text-muted-foreground/70 text-sm py-6 text-center">No tags yet.</p>
                    ) : (
                        sorted.map((tag) => (
                            <div
                                key={tag.id}
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50"
                            >
                                <input
                                    type="checkbox"
                                    checked={mergeSel.has(tag.id)}
                                    onChange={() => toggleMerge(tag.id)}
                                    title="Select to merge"
                                    className="accent-[var(--brand)]"
                                />
                                <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{backgroundColor: tagColor(tag)}}
                                />

                                {editingId === tag.id ? (
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') commitEdit();
                                            if (e.key === 'Escape') {
                                                setEditingId(null);
                                                setEditName('');
                                            }
                                        }}
                                        onBlur={commitEdit}
                                        autoFocus
                                        className="flex-1 px-2 py-1 bg-muted rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                ) : (
                                    <button
                                        className="flex-1 text-left text-sm truncate"
                                        onClick={() => {
                                            setEditingId(tag.id);
                                            setEditName(tag.name);
                                        }}
                                        title="Click to rename"
                                    >
                                        {tag.name}
                                    </button>
                                )}

                                <span className="text-xs tabular-nums text-muted-foreground">
                                    {tagVideoCounts.get(tag.id) ?? 0}
                                </span>

                                {confirmDeleteId === tag.id ? (
                                    <span className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                deleteTag(tag.id);
                                                setConfirmDeleteId(null);
                                            }}
                                            className="text-xs text-destructive hover:underline"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="text-xs text-muted-foreground hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDeleteId(tag.id)}
                                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Delete tag"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Merge controls */}
                {mergeSel.size >= 2 && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
                        <span className="text-sm text-muted-foreground">
                            Merge {mergeSel.size} tags into
                        </span>
                        <select
                            value={mergeTarget || selectedForMerge[0]?.id || ''}
                            onChange={(e) => setMergeTarget(e.target.value)}
                            className="px-2 py-1 bg-muted rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {selectedForMerge.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleMerge}
                            className={cn(
                                'ml-auto px-3 py-1.5 rounded-lg text-sm transition-colors',
                                'bg-brand text-brand-foreground hover:bg-brand-strong',
                            )}
                        >
                            Merge
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
