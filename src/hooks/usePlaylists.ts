import {useCallback, useMemo} from 'react';
import {produce, type Draft} from 'immer';
import {useLocalStorage} from './useLocalStorage';
import type {Playlist, Video, VideoStatus, AppState, Subscription, SidebarView} from '@/types';
import type {ChannelMetadata} from '@/utils/youtube';

export const WATCH_LATER_ID = 'watch-later';

// A video together with the playlist it should play from (used by the tag-filtered queue).
export interface QueuedVideo {
  video: Video;
  sourcePlaylistId: string;
}

// Rewrite (or strip) tag ids across every taggable entity. Empty results collapse to undefined
// so "no own tags" stays distinct from an explicit empty override. Single source of truth for
// tag deletion (filter) and merge (remap).
function rewriteEntityTags(draft: Draft<AppState>, transform: (ids: string[]) => string[]) {
  const apply = (current: string[] | undefined): string[] | undefined => {
    if (!current || current.length === 0) return current;
    const next = transform(current);
    return next.length ? next : undefined;
  };
  for (const playlist of draft.playlists) {
    playlist.tags = apply(playlist.tags);
    for (const video of playlist.videos) {
      video.tags = apply(video.tags);
    }
  }
  for (const subscription of draft.subscriptions) {
    subscription.tags = apply(subscription.tags);
  }
}

const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for non-secure contexts (HTTP)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const DEFAULT_STATE: AppState = {
  playlists: [],
  subscriptions: [],
  tags: [],
  activePlaylistId: null,
  activeSubscriptionId: null,
  activeUserPlaylistId: null,
  currentVideoId: null,
  currentVideoPlaylistId: null,
  sidebarView: 'watch-later',
};

// Migrate state from older versions
function migrateState(state: Partial<AppState>): AppState {
  // Strip description from all videos (now fetched on-demand via LRU cache)
  const playlists = (state.playlists ?? []).map(playlist => ({
    ...playlist,
    videos: playlist.videos.map(video => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = video as any;
      if ('description' in v) {
        delete v.description;
      }
      return v as Video;
    }),
  }));

  // Auto-create Watch Later playlist if missing
  if (!playlists.find(p => p.id === WATCH_LATER_ID)) {
    playlists.unshift({
      id: WATCH_LATER_ID,
      name: 'Watch Later',
      videos: [],
      createdAt: 0,
    });
  }

  const sidebarView = state.sidebarView ?? 'watch-later';

  return {
    playlists,
    subscriptions: state.subscriptions ?? [],
    tags: state.tags ?? [],
    activePlaylistId: sidebarView === 'watch-later'
      ? WATCH_LATER_ID
      : (state.activePlaylistId ?? null),
    activeSubscriptionId: state.activeSubscriptionId ?? null,
    activeUserPlaylistId: state.activeUserPlaylistId ?? null,
    currentVideoId: state.currentVideoId ?? null,
    currentVideoPlaylistId: state.currentVideoPlaylistId ?? null,
    sidebarView,
  };
}

export function usePlaylists() {
  const [rawState, setRawState] = useLocalStorage<AppState>('isotube-state', DEFAULT_STATE);

  // The active tag filter is UI state, NOT part of the synced AppState — kept in its own
  // localStorage key so it survives reload without clobbering other devices via cloud sync.
  const [rawActiveTagIds, setRawActiveTagIds] = useLocalStorage<string[]>('isotube-tag-filter', []);

  // Apply migration for backwards compatibility
  const state = useMemo(() => migrateState(rawState), [rawState]);

  // Wrap setState to ensure migration runs before produce updates
  // This handles the case where localStorage has old state without new fields
  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setRawState((prev) => updater(migrateState(prev)));
  }, [setRawState]);

  // Get active playlist
  const activePlaylist = state.playlists.find(p => p.id === state.activePlaylistId) ?? null;

  // Get the playlist the currently playing video belongs to
  const playingPlaylist = state.playlists.find(p => p.id === state.currentVideoPlaylistId) ?? null;

  // Get current video from its originating playlist
  const currentVideo = playingPlaylist?.videos.find(v => v.id === state.currentVideoId) ?? null;

  // Get active subscription
  const activeSubscription = state.subscriptions.find(s => s.id === state.activeSubscriptionId) ?? null;

  // Get user-defined playlists (not linked to subscriptions, excludes Watch Later)
  const userPlaylists = useMemo(
    () => state.playlists.filter(p => !p.linkedSubscriptionId && p.id !== WATCH_LATER_ID),
    [state.playlists]
  );

  // Get Watch Later playlist
  const watchLaterPlaylist = useMemo(
    () => state.playlists.find(p => p.id === WATCH_LATER_ID) ?? null,
    [state.playlists]
  );

  // Playlist CRUD
  const createPlaylist = useCallback((name: string) => {
    const newPlaylist: Playlist = {
      id: generateId(),
      name,
      videos: [],
      createdAt: Date.now(),
    };
    setState(produce(draft => {
      draft.playlists.push(newPlaylist);
      if (!draft.activePlaylistId) {
        draft.activePlaylistId = newPlaylist.id;
        draft.activeUserPlaylistId = newPlaylist.id;
      }
    }));
    return newPlaylist.id;
  }, [setState]);

  const renamePlaylist = useCallback((id: string, name: string) => {
    setState(produce(draft => {
      const playlist = draft.playlists.find(p => p.id === id);
      if (playlist) playlist.name = name;
    }));
  }, [setState]);

  const deletePlaylist = useCallback((id: string) => {
    setState(produce(draft => {
      const index = draft.playlists.findIndex(p => p.id === id);
      if (index === -1) return;

      draft.playlists.splice(index, 1);

      if (draft.activePlaylistId === id) {
        draft.activePlaylistId = draft.playlists[0]?.id ?? null;
        draft.activeUserPlaylistId = draft.activePlaylistId;
      }
      if (draft.currentVideoPlaylistId === id) {
        draft.currentVideoId = null;
        draft.currentVideoPlaylistId = null;
      }
    }));
  }, [setState]);

  const setActivePlaylist = useCallback((id: string | null) => {
    setState(produce(draft => {
      draft.activePlaylistId = id;
      draft.activeUserPlaylistId = id;
    }));
  }, [setState]);

  // Video CRUD
  const addVideo = useCallback((playlistId: string | null, video: Omit<Video, 'addedAt'>) => {
    const newVideo: Video = {
      ...video,
      addedAt: Date.now(),
    };
    setState(produce(draft => {
      const playlist = draft.playlists.find(p => p.id === playlistId);
      if (playlist) playlist.videos.push(newVideo);
    }));
  }, [setState]);

  const updateVideo = useCallback((playlistId: string | null, videoId: string, updates: Partial<Video>) => {
    setState(produce(draft => {
      const playlist = draft.playlists.find(p => p.id === playlistId);
      const video = playlist?.videos.find(v => v.id === videoId);
      if (video) Object.assign(video, updates);
    }));
  }, [setState]);

  const deleteVideo = useCallback((playlistId: string | null, videoId: string) => {
    setState(produce(draft => {
      const playlist = draft.playlists.find(p => p.id === playlistId);
      if (playlist) {
        const index = playlist.videos.findIndex(v => v.id === videoId);
        if (index !== -1) playlist.videos.splice(index, 1);
      }
      if (draft.currentVideoId === videoId) {
        draft.currentVideoId = null;
        draft.currentVideoPlaylistId = null;
      }
    }));
  }, [setState]);

  const moveVideo = useCallback((fromPlaylistId: string, toPlaylistId: string, videoId: string) => {
    setState(produce(draft => {
      const fromPlaylist = draft.playlists.find(p => p.id === fromPlaylistId);
      const toPlaylist = draft.playlists.find(p => p.id === toPlaylistId);
      if (!fromPlaylist || !toPlaylist) return;

      const videoIndex = fromPlaylist.videos.findIndex(v => v.id === videoId);
      if (videoIndex === -1) return;

      const [video] = fromPlaylist.videos.splice(videoIndex, 1);
      toPlaylist.videos.push(video);
    }));
  }, [setState]);

  // Add multiple videos at once, skipping duplicates
  const addVideos = useCallback((playlistId: string | null, videos: Omit<Video, 'addedAt'>[]) => {
    setState(produce(draft => {
      const playlist = draft.playlists.find(p => p.id === playlistId);
      if (playlist) {
        const existingIds = new Set(playlist.videos.map(v => v.id));
        const newVideos = videos
          .filter(v => !existingIds.has(v.id))
          .map((video, index) => ({
            ...video,
            addedAt: Date.now() + index,
          }));
        playlist.videos.push(...newVideos);
      }
    }));
  }, [setState]);

  // Create a new playlist pre-populated with videos
  const createPlaylistWithVideos = useCallback((name: string, videos: Omit<Video, 'addedAt'>[]) => {
    const newPlaylistId = generateId();
    const newPlaylist: Playlist = {
      id: newPlaylistId,
      name,
      videos: videos.map((video, index) => ({
        ...video,
        addedAt: Date.now() + index,
      })),
      createdAt: Date.now(),
    };
    setState(produce(draft => {
      draft.playlists.push(newPlaylist);
      draft.activePlaylistId = newPlaylistId;
    }));
    return newPlaylistId;
  }, [setState]);

  // Video status/progress helpers
  const setVideoStatus = useCallback((playlistId: string, videoId: string, status: VideoStatus) => {
    updateVideo(playlistId, videoId, {status});
  }, [updateVideo]);

  const setVideoProgress = useCallback((playlistId: string, videoId: string, progress: number, duration?: number) => {
    updateVideo(playlistId, videoId, {
      progress,
      status: progress > 0 ? 'in_progress' : 'unwatched',
      // Capture total length when known so the list can show how far through we are.
      ...(duration && duration > 0 ? {duration} : {}),
    });
  }, [updateVideo]);

  const setVideoRating = useCallback((playlistId: string, videoId: string, rating: number) => {
    updateVideo(playlistId, videoId, {rating: Math.max(0, Math.min(5, rating))});
  }, [updateVideo]);

  const setVideoNotes = useCallback((playlistId: string, videoId: string, notes: string) => {
    updateVideo(playlistId, videoId, {notes});
  }, [updateVideo]);

  // ---- Tags ----

  // The active tag filter, self-healed against the registry (drops ids of deleted tags).
  const activeTagIds = useMemo(
    () => rawActiveTagIds.filter(id => state.tags.some(t => t.id === id)),
    [rawActiveTagIds, state.tags]
  );

  const toggleTagFilter = useCallback((tagId: string) => {
    setRawActiveTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }, [setRawActiveTagIds]);

  const clearTagFilter = useCallback(() => setRawActiveTagIds([]), [setRawActiveTagIds]);

  // Tags a video inherits from its parent. For subscription-linked playlists the parent is the
  // channel (Subscription); otherwise it's the playlist itself.
  const getParentTags = useCallback((playlist: Playlist | null | undefined): string[] => {
    if (!playlist) return [];
    if (playlist.linkedSubscriptionId) {
      const sub = state.subscriptions.find(s => s.id === playlist.linkedSubscriptionId);
      return sub?.tags ?? [];
    }
    return playlist.tags ?? [];
  }, [state.subscriptions]);

  // A video's effective tags: its own (override) if any, else inherited from the parent.
  const getEffectiveVideoTags = useCallback((video: Video, playlist: Playlist): string[] => {
    if (video.tags && video.tags.length > 0) return video.tags;
    return getParentTags(playlist);
  }, [getParentTags]);

  // Cross-library list of videos whose effective tags match any selected tag (OR), deduped by
  // video id. Ordered by upload date desc so the displayed order equals the playback order.
  const aggregatedTagVideos = useMemo<QueuedVideo[]>(() => {
    if (activeTagIds.length === 0) return [];
    const selected = new Set(activeTagIds);
    const byId = new Map<string, { video: Video; sourcePlaylistId: string; explicit: boolean }>();
    for (const playlist of state.playlists) {
      for (const video of playlist.videos) {
        const explicit = !!(video.tags && video.tags.length > 0);
        const effective = getEffectiveVideoTags(video, playlist);
        if (!effective.some(id => selected.has(id))) continue;
        const existing = byId.get(video.id);
        // First match wins, but an explicit-tag match supersedes an inherited one.
        if (!existing || (explicit && !existing.explicit)) {
          byId.set(video.id, {video, sourcePlaylistId: playlist.id, explicit});
        }
      }
    }
    return Array.from(byId.values())
      .sort((a, b) => {
        const au = a.video.uploadDate;
        const bu = b.video.uploadDate;
        if (au && bu) {
          const diff = new Date(bu).getTime() - new Date(au).getTime();
          if (diff !== 0) return diff;
        } else if (au) return -1;
        else if (bu) return 1;
        return b.video.addedAt - a.video.addedAt;
      })
      .map(({video, sourcePlaylistId}) => ({video, sourcePlaylistId}));
  }, [activeTagIds, state.playlists, getEffectiveVideoTags]);

  // Per-tag count = distinct videos whose effective tags include that tag (includes inherited).
  const tagVideoCounts = useMemo(() => {
    const sets = new Map<string, Set<string>>();
    for (const tag of state.tags) sets.set(tag.id, new Set());
    for (const playlist of state.playlists) {
      for (const video of playlist.videos) {
        for (const id of getEffectiveVideoTags(video, playlist)) {
          sets.get(id)?.add(video.id);
        }
      }
    }
    const counts = new Map<string, number>();
    for (const [id, set] of sets) counts.set(id, set.size);
    return counts;
  }, [state.tags, state.playlists, getEffectiveVideoTags]);

  // Tag registry CRUD
  const createTag = useCallback((name: string, color?: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const existing = state.tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    const id = generateId();
    setState(produce(draft => {
      draft.tags.push({id, name: trimmed, createdAt: Date.now(), ...(color ? {color} : {})});
    }));
    return id;
  }, [state.tags, setState]);

  const renameTag = useCallback((tagId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState(produce(draft => {
      const clash = draft.tags.some(t => t.id !== tagId && t.name.toLowerCase() === trimmed.toLowerCase());
      if (clash) return;
      const tag = draft.tags.find(t => t.id === tagId);
      if (tag) tag.name = trimmed;
    }));
  }, [setState]);

  const deleteTag = useCallback((tagId: string) => {
    setState(produce(draft => {
      const index = draft.tags.findIndex(t => t.id === tagId);
      if (index !== -1) draft.tags.splice(index, 1);
      rewriteEntityTags(draft, ids => ids.filter(id => id !== tagId));
    }));
    setRawActiveTagIds(prev => prev.filter(id => id !== tagId));
  }, [setState, setRawActiveTagIds]);

  const mergeTags = useCallback((sourceTagIds: string[], targetTagId: string) => {
    const sources = new Set(sourceTagIds.filter(id => id !== targetTagId));
    if (sources.size === 0) return;
    setState(produce(draft => {
      rewriteEntityTags(draft, ids =>
        Array.from(new Set(ids.map(id => (sources.has(id) ? targetTagId : id))))
      );
      draft.tags = draft.tags.filter(t => !sources.has(t.id));
    }));
    setRawActiveTagIds(prev =>
      Array.from(new Set(prev.map(id => (sources.has(id) ? targetTagId : id))))
    );
  }, [setState, setRawActiveTagIds]);

  // Per-entity tag setters (empty arrays collapse to undefined = "inherit")
  const setVideoTags = useCallback((playlistId: string, videoId: string, tagIds: string[]) => {
    const next = Array.from(new Set(tagIds));
    updateVideo(playlistId, videoId, {tags: next.length ? next : undefined});
  }, [updateVideo]);

  const setPlaylistTags = useCallback((playlistId: string, tagIds: string[]) => {
    const next = Array.from(new Set(tagIds));
    setState(produce(draft => {
      const playlist = draft.playlists.find(p => p.id === playlistId);
      if (playlist) playlist.tags = next.length ? next : undefined;
    }));
  }, [setState]);

  const setSubscriptionTags = useCallback((subscriptionId: string, tagIds: string[]) => {
    const next = Array.from(new Set(tagIds));
    setState(produce(draft => {
      const subscription = draft.subscriptions.find(s => s.id === subscriptionId);
      if (subscription) subscription.tags = next.length ? next : undefined;
    }));
  }, [setState]);

  // Player controls
  const setCurrentVideo = useCallback((videoId: string | null, sourcePlaylistId?: string) => {
    setState(produce(draft => {
      draft.currentVideoId = videoId;
      draft.currentVideoPlaylistId = videoId ? (sourcePlaylistId ?? draft.activePlaylistId) : null;
    }));
  }, [setState]);

  // The play queue is the tag-filtered list when filtering, otherwise the playing playlist.
  const filterActive = activeTagIds.length > 0;
  const playbackQueue = useMemo<QueuedVideo[]>(() => {
    if (filterActive) return aggregatedTagVideos;
    if (playingPlaylist) {
      return playingPlaylist.videos.map(video => ({video, sourcePlaylistId: playingPlaylist.id}));
    }
    return [];
  }, [filterActive, aggregatedTagVideos, playingPlaylist]);

  const currentQueueIndex = useMemo(
    () => playbackQueue.findIndex(e => e.video.id === state.currentVideoId),
    [playbackQueue, state.currentVideoId]
  );
  const hasNext = currentQueueIndex >= 0 && currentQueueIndex < playbackQueue.length - 1;
  const hasPrevious = currentQueueIndex > 0;

  const playNext = useCallback(() => {
    if (currentQueueIndex < 0) return;
    const next = playbackQueue[currentQueueIndex + 1];
    if (next) setCurrentVideo(next.video.id, next.sourcePlaylistId);
  }, [currentQueueIndex, playbackQueue, setCurrentVideo]);

  const playPrevious = useCallback(() => {
    if (currentQueueIndex <= 0) return;
    const prev = playbackQueue[currentQueueIndex - 1];
    if (prev) setCurrentVideo(prev.video.id, prev.sourcePlaylistId);
  }, [currentQueueIndex, playbackQueue, setCurrentVideo]);

  // Import/export state
  const importState = useCallback((newState: AppState) => {
    setState(() => newState);
  }, [setState]);

  const exportState = useCallback((): AppState => {
    return state;
  }, [state]);

  // Subscription CRUD
  const createSubscription = useCallback((
    channelMetadata: ChannelMetadata,
    initialVideos: Omit<Video, 'addedAt'>[]
  ) => {
    const subscriptionId = generateId();
    const playlistId = generateId();

    setState(produce(draft => {
      // Create linked playlist
      const linkedPlaylist: Playlist = {
        id: playlistId,
        name: channelMetadata.title,
        videos: initialVideos.map((video, index) => ({
          ...video,
          addedAt: Date.now() + index,
        })),
        createdAt: Date.now(),
        linkedSubscriptionId: subscriptionId,
      };

      // Create subscription
      const newSubscription: Subscription = {
        id: subscriptionId,
        channelId: channelMetadata.id,
        name: channelMetadata.title,
        thumbnail: channelMetadata.thumbnail,
        linkedPlaylistId: playlistId,
        lastRefreshed: Date.now(),
        createdAt: Date.now(),
      };

      draft.subscriptions.push(newSubscription);
      draft.playlists.push(linkedPlaylist);
      draft.activeSubscriptionId = subscriptionId;
      draft.activePlaylistId = playlistId;
      draft.sidebarView = 'subscriptions';
    }));

    return subscriptionId;
  }, [setState]);

  const deleteSubscription = useCallback((subscriptionId: string) => {
    setState(produce(draft => {
      const subscription = draft.subscriptions.find(s => s.id === subscriptionId);
      if (!subscription) return;

      // Remove linked playlist
      const playlistIndex = draft.playlists.findIndex(p => p.id === subscription.linkedPlaylistId);
      if (playlistIndex !== -1) {
        draft.playlists.splice(playlistIndex, 1);
      }

      // Remove subscription
      const subIndex = draft.subscriptions.findIndex(s => s.id === subscriptionId);
      draft.subscriptions.splice(subIndex, 1);

      // Clear active states if needed
      if (draft.activeSubscriptionId === subscriptionId) {
        draft.activeSubscriptionId = draft.subscriptions[0]?.id ?? null;
        draft.activePlaylistId = draft.subscriptions[0]?.linkedPlaylistId ?? null;
      }
      if (draft.currentVideoPlaylistId === subscription.linkedPlaylistId) {
        draft.currentVideoId = null;
        draft.currentVideoPlaylistId = null;
      }
    }));
  }, [setState]);

  const setActiveSubscription = useCallback((subscriptionId: string | null) => {
    setState(produce(draft => {
      draft.activeSubscriptionId = subscriptionId;
      if (subscriptionId) {
        const subscription = draft.subscriptions.find(s => s.id === subscriptionId);
        draft.activePlaylistId = subscription?.linkedPlaylistId ?? null;
      }
    }));
  }, [setState]);

  const refreshSubscription = useCallback((
    subscriptionId: string,
    newVideos: Omit<Video, 'addedAt'>[]
  ) => {
    setState(produce(draft => {
      const subscription = draft.subscriptions.find(s => s.id === subscriptionId);
      if (!subscription) return;

      const playlist = draft.playlists.find(p => p.id === subscription.linkedPlaylistId);
      if (!playlist) return;

      // Add new videos (skip duplicates)
      const existingIds = new Set(playlist.videos.map(v => v.id));
      const videosToAdd = newVideos
        .filter(v => !existingIds.has(v.id))
        .map((video, index) => ({
          ...video,
          addedAt: Date.now() + index,
        }));

      // Prepend new videos to beginning
      playlist.videos.unshift(...videosToAdd);
      subscription.lastRefreshed = Date.now();
    }));
  }, [setState]);

  const setSidebarView = useCallback((view: SidebarView) => {
    setState(produce(draft => {
      draft.sidebarView = view;
      if (view === 'watch-later') {
        draft.activePlaylistId = WATCH_LATER_ID;
      } else if (view === 'playlists') {
        draft.activePlaylistId = draft.activeUserPlaylistId;
      } else if (view === 'subscriptions') {
        const sub = draft.subscriptions.find(s => s.id === draft.activeSubscriptionId);
        draft.activePlaylistId = sub?.linkedPlaylistId ?? null;
      }
    }));
  }, [setState]);

  // Get linked playlist for a subscription
  const getSubscriptionPlaylist = useCallback((subscriptionId: string) => {
    const subscription = state.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) return null;
    return state.playlists.find(p => p.id === subscription.linkedPlaylistId) ?? null;
  }, [state.subscriptions, state.playlists]);

  return {
    // State
    playlists: state.playlists,
    userPlaylists,
    watchLaterPlaylist,
    activePlaylist,
    playingPlaylist,
    currentVideo,
    activePlaylistId: state.activePlaylistId,
    currentVideoId: state.currentVideoId,
    currentVideoPlaylistId: state.currentVideoPlaylistId,

    // Playlist operations
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    setActivePlaylist,

    // Video operations
    addVideo,
    addVideos,
    updateVideo,
    deleteVideo,
    moveVideo,
    createPlaylistWithVideos,

    // Video helpers
    setVideoStatus,
    setVideoProgress,
    setVideoRating,
    setVideoNotes,

    // Player controls
    setCurrentVideo,
    playNext,
    playPrevious,
    hasNext,
    hasPrevious,

    // Tags
    tags: state.tags,
    activeTagIds,
    toggleTagFilter,
    clearTagFilter,
    aggregatedTagVideos,
    tagVideoCounts,
    getParentTags,
    getEffectiveVideoTags,
    createTag,
    renameTag,
    deleteTag,
    mergeTags,
    setVideoTags,
    setPlaylistTags,
    setSubscriptionTags,

    // Import/export
    importState,
    exportState,

    // Subscriptions state
    subscriptions: state.subscriptions,
    activeSubscription,
    activeSubscriptionId: state.activeSubscriptionId,
    sidebarView: state.sidebarView,

    // Subscription operations
    createSubscription,
    deleteSubscription,
    setActiveSubscription,
    refreshSubscription,
    setSidebarView,
    getSubscriptionPlaylist,
  };
}
