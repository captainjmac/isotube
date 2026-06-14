import type {ReactNode} from 'react';
import type {Tag} from '@/types';
import {cn} from '@/lib/utils';
import {tagColor} from './tagColor';

interface TagBadgeProps {
    tag: Tag;
    count?: number;
    selected?: boolean;
    inherited?: boolean;
    onClick?: () => void;
    onRemove?: () => void;
    className?: string;
}

export function TagBadge({tag, count, selected, inherited, onClick, onRemove, className}: TagBadgeProps) {
    const body: ReactNode = (
        <>
            <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{backgroundColor: tagColor(tag)}}
                aria-hidden="true"
            />
            <span className="truncate">{tag.name}</span>
            {typeof count === 'number' && (
                <span className={cn('tabular-nums', selected ? 'text-brand-foreground/80' : 'text-muted-foreground')}>
                    {count}
                </span>
            )}
        </>
    );

    const base = cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs max-w-full',
        selected
            ? 'border-transparent bg-brand text-brand-foreground'
            : 'border-border bg-card/70 text-foreground/80',
        inherited && 'border-dashed opacity-80',
        className,
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                className={cn(base, 'transition-colors', !selected && 'hover:bg-accent')}
            >
                {body}
            </button>
        );
    }

    return (
        <span className={base}>
            {body}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="-mr-0.5 ml-0.5 rounded-full p-0.5 hover:bg-black/20"
                    aria-label={`Remove ${tag.name}`}
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            )}
        </span>
    );
}
