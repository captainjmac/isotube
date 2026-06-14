import {type ReactNode, useState} from 'react';
import type {Tag} from '@/types';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import {tagColor} from './tagColor';

interface TagPickerProps {
    allTags: Tag[];
    selectedTagIds: string[];
    onChange: (ids: string[]) => void;
    onCreateTag: (name: string) => string;
    children?: ReactNode; // custom trigger (rendered with asChild)
    align?: 'start' | 'end';
}

export function TagPicker({allTags, selectedTagIds, onChange, onCreateTag, children, align = 'start'}: TagPickerProps) {
    const [query, setQuery] = useState('');
    const selected = new Set(selectedTagIds);

    const toggle = (id: string) => {
        if (selected.has(id)) onChange(selectedTagIds.filter((x) => x !== id));
        else onChange([...selectedTagIds, id]);
    };

    const trimmed = query.trim();
    const lowered = trimmed.toLowerCase();
    const filtered = trimmed
        ? allTags.filter((t) => t.name.toLowerCase().includes(lowered))
        : allTags;
    const exactExists = allTags.some((t) => t.name.toLowerCase() === lowered);

    const handleCreate = () => {
        if (!trimmed || exactExists) return;
        const id = onCreateTag(trimmed);
        if (id && !selected.has(id)) onChange([...selectedTagIds, id]);
        setQuery('');
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                {children ?? (
                    <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
                        </svg>
                        Tags
                    </button>
                )}
            </PopoverTrigger>
            <PopoverContent
                align={align}
                className="w-64"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreate();
                        }
                    }}
                    placeholder="Search or create…"
                    className="w-full px-2 py-1.5 mb-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                />
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {filtered.map((tag) => {
                        const isSelected = selected.has(tag.id);
                        return (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggle(tag.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left hover:bg-accent transition-colors"
                            >
                                <span className={cn(
                                    'flex h-4 w-4 items-center justify-center rounded border flex-shrink-0',
                                    isSelected ? 'bg-brand border-brand text-brand-foreground' : 'border-border',
                                )}>
                                    {isSelected && (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                                        </svg>
                                    )}
                                </span>
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: tagColor(tag)}}/>
                                <span className="truncate flex-1">{tag.name}</span>
                            </button>
                        );
                    })}

                    {trimmed && !exactExists && (
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left text-brand hover:bg-accent transition-colors"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                            <span className="truncate">Create &ldquo;{trimmed}&rdquo;</span>
                        </button>
                    )}

                    {filtered.length === 0 && !trimmed && (
                        <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                            No tags yet. Type to create one.
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
