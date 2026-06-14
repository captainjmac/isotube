import {useMemo, useState} from 'react';
import type {Playlist, Tag, Video, VideoStatus} from '@/types';
import {VideoCard} from './VideoCard';
import {VideoDetailModal} from '../VideoDetail/VideoDetailModal';
import {usePlaylistsContext} from "../../hooks/PlaylistsContext.tsx";
import {PlaylistIcon} from "../common/icons/PlaylistIcon.tsx";
import {EmptyVideoListIcon} from "../common/icons/EmptyVideoListIcon.tsx";
import {VideoFilterSelector} from "@/components/VideoList/VideoFilterSelector.tsx";
import {VideoSortSelector} from "@/components/VideoList/VideoSortSelector.tsx";

type SortOption = 'added' | 'title' | 'rating' | 'status' | 'uploaded';
type FilterStatus = 'all' | 'starred' | VideoStatus;

interface VideoListProps {
}

interface Row {
  video: Video;
  playlistId: string;
}

const statusOrder: Record<VideoStatus, number> = {
  in_progress: 0,
  unwatched: 1,
  completed: 2,
};

export function VideoList({}: VideoListProps) {

  const {
    activePlaylist,
    playlists,
    currentVideo,
    setCurrentVideo,
    updateVideo,
    deleteVideo,
    sidebarView,
    activeTagIds,
    aggregatedTagVideos,
    tags,
    getEffectiveVideoTags,
    getParentTags,
  } = usePlaylistsContext();

  const [sortBy, setSortBy] = useState<SortOption>('uploaded');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [detailVideoId, setDetailVideoId] = useState<string | null>(null);

  const currentVideoId = currentVideo?.id ?? null;
  const tagFilterActive = activeTagIds.length > 0;

  const tagsById = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const t of tags) map.set(t.id, t);
    return map;
  }, [tags]);

  const playlistsById = useMemo(() => {
    const map = new Map<string, Playlist>();
    for (const p of playlists) map.set(p.id, p);
    return map;
  }, [playlists]);

  const resolveTags = (ids: string[]): Tag[] =>
    ids.map((id) => tagsById.get(id)).filter((t): t is Tag => !!t);

  // Normal-mode filter + sort within the active playlist - must run before any early returns.
  const filteredVideos = useMemo(() => {
    if (!activePlaylist) return [];
    let videos = [...activePlaylist.videos];

    if (filterStatus === 'starred') {
      videos = videos.filter(v => v.starred);
    } else if (filterStatus !== 'all') {
      videos = videos.filter(v => v.status === filterStatus);
    }

    videos.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return b.rating - a.rating;
        case 'status':
          return statusOrder[a.status] - statusOrder[b.status];
        case 'uploaded':
          if (!a.uploadDate && !b.uploadDate) return 0;
          if (!a.uploadDate) return 1;
          if (!b.uploadDate) return -1;
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'added':
        default:
          return b.addedAt - a.addedAt;
      }
    });

    return videos;
  }, [activePlaylist?.videos, sortBy, filterStatus]);

  // Tag-filter mode: a cross-library aggregated list, ignoring the playlist/tab selection.
  if (tagFilterActive) {
    const rows: Row[] = aggregatedTagVideos.map(e => ({video: e.video, playlistId: e.sourcePlaylistId}));
    const detailRow = detailVideoId ? rows.find(r => r.video.id === detailVideoId) ?? null : null;

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2 min-w-0">
          {rows.length === 0 ? (
            <div className="text-center py-12">
              <EmptyVideoListIcon/>
              <p className="text-muted-foreground mb-2">No videos match the selected tags</p>
              <p className="text-muted-foreground/70 text-sm">Tag some videos, playlists, or channels to see them here.</p>
            </div>
          ) : (
            <div className="grid gap-2 min-w-0">
              {rows.map(({video, playlistId}) => {
                const pl = playlistsById.get(playlistId);
                return (
                  <VideoCard
                    key={video.id}
                    video={video}
                    tags={pl ? resolveTags(getEffectiveVideoTags(video, pl)) : []}
                    isPlaying={video.id === currentVideoId}
                    onShowDetail={() => setDetailVideoId(video.id)}
                    onPlay={() => setCurrentVideo(video.id, playlistId)}
                    onUpdate={(updates) => updateVideo(playlistId, video.id, updates)}
                    onDelete={() => deleteVideo(playlistId, video.id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {detailRow && (
          <VideoDetailModal
            video={detailRow.video}
            parentTagIds={getParentTags(playlistsById.get(detailRow.playlistId))}
            onUpdate={(updates) => updateVideo(detailRow.playlistId, detailRow.video.id, updates)}
            onClose={() => setDetailVideoId(null)}
          />
        )}
      </div>
    );
  }

  const playlist = activePlaylist;

  if (!playlist) {
    const message = sidebarView === 'subscriptions'
      ? 'Select a channel from the sidebar'
      : 'Select a playlist from the sidebar';
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <PlaylistIcon/>
          <p className="text-muted-foreground mb-2">{message}</p>
        </div>
      </div>
    );
  }

  const detailVideo = detailVideoId
    ? playlist.videos.find(v => v.id === detailVideoId) ?? null
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {playlist.videos.length > 0 && (
        <div className="px-4 py-3 border-b border-border grid grid-cols-2 gap-4">
          <VideoFilterSelector
            value={filterStatus}
            onChange={(e: any) => setFilterStatus(e.target.value as FilterStatus)}
            videos={playlist.videos}
          />

          <VideoSortSelector
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          />
        </div>
      )}

      {/* Video list */}
      <div className="flex-1 overflow-y-auto p-2 min-w-0">
        {playlist.videos.length === 0 ? (
          <div className="text-center py-12">
            <EmptyVideoListIcon/>
            <p className="text-muted-foreground mb-2">No videos in this playlist</p>
            <p className="text-muted-foreground/70 text-sm">Paste a YouTube URL above to add your first video</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No videos match this filter</p>
          </div>
        ) : (
          <div className="grid gap-2 min-w-0">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                tags={resolveTags(getEffectiveVideoTags(video, playlist))}
                isPlaying={video.id === currentVideoId}
                onShowDetail={() => setDetailVideoId(video.id)}
                onPlay={() => setCurrentVideo(video.id, playlist.id)}
                onUpdate={(updates) => updateVideo(playlist.id, video.id, updates)}
                onDelete={() => deleteVideo(playlist.id, video.id)}
              />
            ))}
          </div>
        )}
      </div>

      {detailVideo && (
        <VideoDetailModal
          video={detailVideo}
          parentTagIds={getParentTags(playlist)}
          onUpdate={(updates) => updateVideo(playlist.id, detailVideo.id, updates)}
          onClose={() => setDetailVideoId(null)}
        />
      )}
    </div>
  );
}
