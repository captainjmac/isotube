import {useState} from 'react';
import {usePlaylistsContext} from '@/hooks/PlaylistsContext';
import {TagBadge} from './TagBadge';
import {ManageTagsDialog} from './ManageTagsDialog';

export function TagFilterBar() {
    const {tags, activeTagIds, toggleTagFilter, clearTagFilter, tagVideoCounts} = usePlaylistsContext();
    const [manageOpen, setManageOpen] = useState(false);
    const active = new Set(activeTagIds);

    return (
        <div className="shrink-0 border-b border-border px-2 py-2">
            <div className="flex items-center gap-2 px-1 mb-1.5">
                <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</span>
                {activeTagIds.length > 0 && (
                    <button
                        onClick={clearTagFilter}
                        className="text-xs text-brand hover:opacity-80"
                    >
                        Clear
                    </button>
                )}
                <button
                    onClick={() => setManageOpen(true)}
                    className="ml-auto p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Manage tags"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                </button>
            </div>

            {tags.length === 0 ? (
                <button
                    onClick={() => setManageOpen(true)}
                    className="w-full text-left text-xs text-muted-foreground/70 px-1 py-1 hover:text-foreground transition-colors"
                >
                    No tags yet — add some to filter your library.
                </button>
            ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {tags.map((tag) => (
                        <TagBadge
                            key={tag.id}
                            tag={tag}
                            selected={active.has(tag.id)}
                            count={tagVideoCounts.get(tag.id) ?? 0}
                            onClick={() => toggleTagFilter(tag.id)}
                        />
                    ))}
                </div>
            )}

            <ManageTagsDialog open={manageOpen} onOpenChange={setManageOpen}/>
        </div>
    );
}
