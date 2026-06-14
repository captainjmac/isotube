import type {Tag} from '@/types';

const PALETTE = [
    '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399',
    '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6', '#e879f9',
];

// Stable per-tag accent: use the stored color, otherwise derive one from the id so the dot is
// consistent across renders without needing to persist a color.
export function tagColor(tag: Tag): string {
    if (tag.color) return tag.color;
    let hash = 0;
    for (let i = 0; i < tag.id.length; i++) {
        hash = (hash * 31 + tag.id.charCodeAt(i)) >>> 0;
    }
    return PALETTE[hash % PALETTE.length];
}
