import {useState} from 'react';
import type {Playlist} from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {usePlaylistsContext} from '@/hooks/PlaylistsContext';
import {TagPicker} from '@/components/Tags/TagPicker';
import {cn} from '@/lib/utils';

interface PlaylistItemProps {
  playlist: Playlist;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function PlaylistItem({
  playlist,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: PlaylistItemProps) {
  const {tags, createTag, setPlaylistTags} = usePlaylistsContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const hasTags = (playlist.tags?.length ?? 0) > 0;

  const handleRename = () => {
    if (editName.trim() && editName !== playlist.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(playlist.name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="px-2">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleRename}
          className="w-full px-3 py-2 bg-muted rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
        isActive
          ? 'bg-brand text-brand-foreground'
          : 'hover:bg-accent text-foreground/80'
      }`}
      onClick={onSelect}
    >
      {/* Playlist icon */}
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7"/>
      </svg>

      {/* Name and count */}
      <div className="flex-1 min-w-0">
        <span className="block truncate text-sm">{playlist.name}</span>
      </div>
      <span className="text-xs text-muted-foreground">{playlist.videos.length}</span>

      {/* Tag button */}
      <TagPicker
        allTags={tags}
        selectedTagIds={playlist.tags ?? []}
        onChange={(ids) => setPlaylistTags(playlist.id, ids)}
        onCreateTag={createTag}
        align="end"
      >
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'p-1 rounded hover:bg-accent transition-opacity',
            hasTags ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          title="Edit tags"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
          </svg>
        </button>
      </TagPicker>

      {/* Menu button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
