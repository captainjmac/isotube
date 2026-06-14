import {memo, useState} from 'react';
import type {Video} from '@/types';
import {VideoActionsDropdown, statusColors, statusLabels} from '@/components/common/VideoActionsDropdown';

interface VideoCardProps {
  video: Video;
  isPlaying: boolean;
  onShowDetail: () => void;
  onPlay: () => void;
  onUpdate: (updates: Partial<Video>) => void;
  onDelete: () => void;
}

export const VideoCard = memo(function VideoCard({
  video,
  isPlaying,
  onShowDetail,
  onPlay,
  onUpdate,
  onDelete,
}: VideoCardProps) {

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== video.title) {
      onUpdate({title: editTitle.trim()});
    }
    setIsEditing(false);
  };

  const handleEditTitle = () => setIsEditing(true);

  // How far through the video we are (0-100), when the total length is known.
  const progressPct = video.status === 'in_progress' && video.duration
    ? Math.min(100, Math.max(0, (video.progress / video.duration) * 100))
    : 0;

  return (
    <div
      className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 min-w-0 overflow-hidden ${
        isPlaying
          ? 'bg-brand/10 glow-active'
          : 'bg-card/70 border border-border/60 hover:bg-accent hover:-translate-y-0.5'
      }`}
      onClick={onPlay}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-16 aspect-video rounded-lg overflow-hidden bg-muted">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Status indicator */}
        <div
          className={`absolute top-1 left-1 w-2 h-2 rounded-full ${statusColors[video.status]}`}
          title={statusLabels[video.status]}
        />
        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') {
                setEditTitle(video.title);
                setIsEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        ) : (
          <h3 className="font-medium text-sm line-clamp-2" title={video.title}>
            {video.title}
          </h3>
        )}

        {/* Star + Status badge */}
        <div className="mt-auto pt-2 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ starred: !video.starred });
            }}
            className={`text-sm leading-none hover:scale-110 transition-transform ${
              video.starred ? 'text-rating' : 'text-muted-foreground/60 hover:text-muted-foreground'
            }`}
            title={video.starred ? 'Unstar' : 'Star'}
          >
            {video.starred ? '★' : '☆'}
          </button>
          {video.status === 'in_progress' ? (
            <span
              className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs overflow-hidden bg-status-progress/15 text-status-progress"
              title={video.duration ? `${Math.round(progressPct)}% watched` : statusLabels.in_progress}
            >
              {/* Background fill showing how far through the video we are */}
              <span
                className="absolute inset-y-0 left-0 bg-status-progress/35 transition-[width] duration-500 ease-out"
                style={{width: `${progressPct}%`}}
                aria-hidden="true"
              />
              <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-status-progress"/>
              <span className="relative z-10">{statusLabels.in_progress}</span>
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                video.status === 'completed'
                  ? 'bg-status-completed/15 text-status-completed'
                  : 'bg-status-unwatched/15 text-status-unwatched'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusColors[video.status]}`}/>
              {statusLabels[video.status]}
            </span>
          )}

          {video.uploadDate && (
            <span className="text-xs font-mono tabular-nums text-muted-foreground/70">
              {new Date(video.uploadDate).toLocaleDateString()}
            </span>
          )}

          {/* Rating stars */}
          {video.rating > 0 && (
            <span className="text-rating text-xs">
              {'★'.repeat(video.rating)}
              {'☆'.repeat(5 - video.rating)}
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      <VideoActionsDropdown
        video={video}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onShowDetail={onShowDetail}
        onEditTitle={handleEditTitle}
      />
    </div>
  );
}, (prev, next) => prev.video === next.video && prev.isPlaying === next.isPlaying);
