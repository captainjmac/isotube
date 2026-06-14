import {useCallback, useRef, useState} from 'react';
import type {Video} from '@/types';
import {usePlaylistsContext} from './hooks/PlaylistsContext';
import {useKeyboardShortcuts} from './hooks/useKeyboardShortcuts';
import {Sidebar} from './components/Sidebar/Sidebar';
import {VideoList} from './components/VideoList/VideoList';
import {AddVideoForm} from './components/VideoList/AddVideoForm';
import {Player, type PlayerHandle} from './components/Player/Player';
import {PlaylistList} from "./components/Sidebar/PlaylistList.tsx";
import {SubscriptionList} from "./components/Sidebar/SubscriptionList.tsx";
import {SidebarTabs} from "./components/Sidebar/SidebarTabs.tsx";
import {Logo} from "./components/common/icons/Logo.tsx";
import {HeaderMenu} from "@/components/Header/HeaderMenu.tsx";
import {ThemeToggle} from "@/components/Header/ThemeToggle.tsx";
import {VideoDetailSummary} from "@/components/VideoDetail/VideoDetailSummary.tsx";
import {HelpDialog} from "@/components/Header/HelpDialog.tsx";
import {TagFilterBar} from "@/components/Tags/TagFilterBar.tsx";

function App() {
  const {
    playlists,
    activePlaylist,
    currentVideo,
    currentVideoId,
    currentVideoPlaylistId,
    setVideoProgress,
    setVideoStatus,
    playNext,
    playPrevious,
    hasNext,
    hasPrevious,
    sidebarView,
    setSidebarView,
    activeTagIds,
    userPlaylists,
    subscriptions,
    addVideo,
    addVideos,
    createPlaylistWithVideos,
    createSubscription,
    watchLaterPlaylist,
    updateVideo,
    deleteVideo,
  } = usePlaylistsContext();

  const [autoAdvance, setAutoAdvance] = useState(true);

  const playerRef = useRef<PlayerHandle>(null);

  // When a tag filter is active the sidebar shows the cross-library aggregated list instead of
  // the per-tab playlist/channel navigation.
  const tagFilterActive = activeTagIds.length > 0;

  // Handle progress updates (track on the playlist the video was started from)
  const handleProgress = useCallback((seconds: number, duration: number) => {
    if (currentVideoPlaylistId && currentVideoId) {
      setVideoProgress(currentVideoPlaylistId, currentVideoId, seconds, duration);
    }
  }, [currentVideoPlaylistId, currentVideoId, setVideoProgress]);

  // Handle video ended
  const handleEnded = useCallback(() => {
    if (currentVideoPlaylistId && currentVideoId) {
      setVideoStatus(currentVideoPlaylistId, currentVideoId, 'completed');
      setVideoProgress(currentVideoPlaylistId, currentVideoId, 0);
    }
  }, [currentVideoPlaylistId, currentVideoId, setVideoStatus, setVideoProgress]);

  // Callbacks for video detail actions
  const handleDetailUpdate = useCallback((updates: Partial<Video>) => {
    if (currentVideoPlaylistId && currentVideoId) {
      updateVideo(currentVideoPlaylistId, currentVideoId, updates);
    }
  }, [currentVideoPlaylistId, currentVideoId, updateVideo]);

  const handleDetailDelete = useCallback(() => {
    if (currentVideoPlaylistId && currentVideoId) {
      deleteVideo(currentVideoPlaylistId, currentVideoId);
    }
  }, [currentVideoPlaylistId, currentVideoId, deleteVideo]);

  useKeyboardShortcuts({
    onPlayPause: () => playerRef.current?.togglePlay(),
    onNext: hasNext ? playNext : undefined,
    onPrevious: hasPrevious ? playPrevious : undefined,
  });

  return (
    <div
      className="relative isolate h-screen overflow-hidden bg-background text-foreground grid grid-cols-1 grid-rows-[auto_1fr_auto] lg:grid-cols-[24rem_1fr] lg:grid-rows-[auto_1fr]">
      {/* Ambient violet → magenta aurora behind everything */}
      <div className="aurora" aria-hidden="true"/>

      {/* Header - spans full width */}
      <header
        className="col-span-full relative z-10 flex items-center gap-3 px-4 py-3 glass border-b border-border reveal reveal-1">
        <Logo/>
        <h1 className="text-xl font-display font-bold tracking-tight leading-none">
          <span className="brand-text">Iso-Tube</span>
          <small className="hidden sm:inline text-xs font-sans font-normal text-muted-foreground px-4 tracking-normal">
            Watch YouTube videos without the distraction
          </small>
        </h1>
        {activePlaylist && (
          <div className="hidden lg:block flex-1 max-w-xl mx-4">
            <AddVideoForm
              onAddVideo={(video) => addVideo(activePlaylist.id, video)}
              onAddVideos={addVideos}
              onCreatePlaylistWithVideos={createPlaylistWithVideos}
              onCreateSubscription={(channelData) => createSubscription(channelData.metadata, channelData.videos)}
              existingPlaylists={playlists}
              currentPlaylistId={activePlaylist.id}
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-1">
          <HelpDialog/>
          <ThemeToggle/>
          <HeaderMenu/>
        </div>
      </header>

      {/* Left column: Playlists + Videos stacked (desktop only) */}
      <Sidebar className="hidden lg:flex relative z-10 reveal reveal-2">
        <TagFilterBar/>
        {!tagFilterActive && (
          <>
            <SidebarTabs
              activeTab={sidebarView}
              onTabChange={setSidebarView}
              watchLaterCount={watchLaterPlaylist?.videos.length ?? 0}
              playlistCount={userPlaylists.length}
              subscriptionCount={subscriptions.length}
            />
            {sidebarView === 'playlists' && <PlaylistList/>}
            {sidebarView === 'subscriptions' && <SubscriptionList/>}
          </>
        )}
        <VideoList/>
      </Sidebar>

      {/* Video list - below player on mobile only */}
      <section className="lg:hidden row-start-3 relative z-10 bg-card/60 overflow-y-auto">
        {activePlaylist && (
          <div className="p-4 border-b border-border">
            <AddVideoForm
              onAddVideo={(video) => addVideo(activePlaylist.id, video)}
              onAddVideos={addVideos}
              onCreatePlaylistWithVideos={createPlaylistWithVideos}
              onCreateSubscription={(channelData) => createSubscription(channelData.metadata, channelData.videos)}
              existingPlaylists={playlists}
              currentPlaylistId={activePlaylist.id}
            />
          </div>
        )}
        <TagFilterBar/>
        {!tagFilterActive && (
          <>
            <SidebarTabs
              activeTab={sidebarView}
              onTabChange={setSidebarView}
              watchLaterCount={watchLaterPlaylist?.videos.length ?? 0}
              playlistCount={userPlaylists.length}
              subscriptionCount={subscriptions.length}
            />
            {sidebarView === 'playlists' && <PlaylistList/>}
            {sidebarView === 'subscriptions' && <SubscriptionList/>}
          </>
        )}
        <VideoList/>
      </section>

      {/* Player - main content area */}
      <main className="row-start-2 lg:col-start-2 relative z-10 flex flex-col min-w-0 min-h-0 reveal reveal-3">
        <Player
          ref={playerRef}
          video={currentVideo}
          autoAdvance={autoAdvance}
          onToggleAutoAdvance={() => setAutoAdvance(!autoAdvance)}
          onProgress={handleProgress}
          onEnded={handleEnded}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onNext={playNext}
          onPrevious={playPrevious}
        />
        <VideoDetailSummary
          video={currentVideo}
          onUpdate={handleDetailUpdate}
          onDelete={handleDetailDelete}
        />
      </main>
    </div>
  );
}

export default App;
