export type VideoStatus = 'unwatched' | 'in_progress' | 'completed';

export interface Tag {
  id: string;        // UUID
  name: string;
  createdAt: number; // Timestamp
  color?: string;    // Optional accent color (hex/css)
}

export interface Video {
  id: string;           // YouTube video ID
  url: string;          // Full YouTube URL
  title: string;
  thumbnail: string;
  notes: string;
  rating: number;       // 0-5 stars
  status: VideoStatus;
  progress: number;     // Seconds watched
  duration?: number;    // Total length in seconds (captured during playback)
  starred?: boolean;    // Favorited by user
  addedAt: number;      // Timestamp
  uploadDate?: string;  // YouTube upload date (ISO string)
  tags?: string[];      // Tag ids. Non-empty = overrides inherited tags; absent/empty = inherit
}

export interface Playlist {
  id: string;
  name: string;
  videos: Video[];
  createdAt: number;
  linkedSubscriptionId?: string | null;  // null/undefined = user-defined playlist
  tags?: string[];                        // Tag ids inherited by this playlist's videos
}

export interface Subscription {
  id: string;
  channelId: string;           // YouTube channel ID (UC...)
  name: string;                // Channel display name
  thumbnail: string;           // Channel avatar URL
  linkedPlaylistId: string;    // ID of auto-managed playlist
  lastRefreshed: number | null;
  createdAt: number;
  tags?: string[];             // Tag ids inherited by this channel's videos
}

export type SidebarView = 'watch-later' | 'playlists' | 'subscriptions';

export interface AppState {
  playlists: Playlist[];
  subscriptions: Subscription[];
  tags: Tag[];                          // Tag registry
  activePlaylistId: string | null;
  activeSubscriptionId: string | null;
  activeUserPlaylistId: string | null;
  currentVideoId: string | null;
  currentVideoPlaylistId: string | null;
  sidebarView: SidebarView;
}
