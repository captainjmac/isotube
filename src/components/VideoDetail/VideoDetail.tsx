import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Tag, Video, VideoStatus } from '@/types';
import { StarRating } from './StarRating';
import { usePlaylistsContext } from '@/hooks/PlaylistsContext';
import { TagPicker } from '@/components/Tags/TagPicker';
import { TagBadge } from '@/components/Tags/TagBadge';

interface VideoDetailProps {
  video: Video | null;
  parentTagIds?: string[];
  onUpdate: (updates: Partial<Video>) => void;
}

const statusOptions: { value: VideoStatus; label: string; color: string }[] = [
  { value: 'unwatched', label: 'Unwatched', color: 'bg-status-unwatched' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-status-progress' },
  { value: 'completed', label: 'Completed', color: 'bg-status-completed' },
];

export function VideoDetail({ video, parentTagIds = [], onUpdate }: VideoDetailProps) {

  const { tags, createTag } = usePlaylistsContext();
  const [notes, setNotes] = useState(video?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const tagsById = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const t of tags) map.set(t.id, t);
    return map;
  }, [tags]);

  const setOwnTags = useCallback((ids: string[]) => {
    onUpdate({ tags: ids.length ? ids : undefined });
  }, [onUpdate]);

  const handleRatingChange = useCallback((rating: number) => {
    onUpdate({ rating });
  }, [onUpdate]);

  const handleStatusChange = useCallback((status: VideoStatus) => {
    onUpdate({ status });
  }, [onUpdate]);

  // Update local notes when video changes
  useEffect(() => {
    setNotes(video?.notes ?? '');
  }, [video?.id, video?.notes]);

  // Auto-save notes with debounce
  useEffect(() => {
    if (!video || notes === video.notes) return;

    setIsSaving(true);
    const timeout = setTimeout(() => {
      onUpdate({ notes });
      setIsSaving(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [notes, video, onUpdate]);

  if (!video) {
    return null;
  }

  const ownTagIds = video.tags ?? [];
  const ownTags = ownTagIds.map((id) => tagsById.get(id)).filter((t): t is Tag => !!t);
  const inheritedTags = parentTagIds.map((id) => tagsById.get(id)).filter((t): t is Tag => !!t);

  return (<>


    {/* Content */}
    <div className="flex-1 overflow-auto p-4 space-y-6">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Rating
        </label>
        <StarRating
          rating={video.rating}
          onChange={handleRatingChange}
          size="lg"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Tags
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {ownTags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={() => setOwnTags(ownTagIds.filter((id) => id !== tag.id))}
            />
          ))}
          <TagPicker
            allTags={tags}
            selectedTagIds={ownTagIds}
            onChange={setOwnTags}
            onCreateTag={createTag}
          />
        </div>
        {ownTagIds.length === 0 && inheritedTags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground/70">Inherited:</span>
            {inheritedTags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} inherited/>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Status
        </label>
        <div className="flex gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                video.status === option.value
                  ? 'bg-brand text-brand-foreground'
                  : 'bg-secondary text-foreground/80 hover:bg-accent'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${option.color}`} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-muted-foreground">
            Notes
          </label>
          {isSaving && (
            <span className="text-xs text-muted-foreground/70">Saving...</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your notes here..."
          rows={6}
          className="w-full px-3 py-2 bg-muted rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Metadata */}
      <div className="text-xs text-muted-foreground/70 space-y-1">
        <p>Added: {new Date(video.addedAt).toLocaleDateString()}</p>
        {video.progress > 0 && (
          <p>Last position: {Math.floor(video.progress / 60)}:{String(Math.floor(video.progress % 60)).padStart(2, '0')}</p>
        )}
      </div>
    </div>
  </>);
}
