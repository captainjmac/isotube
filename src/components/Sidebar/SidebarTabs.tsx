import {cn} from '@/lib/utils';
import type {SidebarView} from '@/types';

interface SidebarTabsProps {
  activeTab: SidebarView;
  onTabChange: (tab: SidebarView) => void;
  watchLaterCount: number;
  playlistCount: number;
  subscriptionCount: number;
}

export function SidebarTabs({
  activeTab,
  onTabChange,
  watchLaterCount,
}: SidebarTabsProps) {
  return (
    <div className="flex border-b border-border">
      <button
        onClick={() => onTabChange('watch-later')}
        className={cn(
          'flex-1 px-2 py-2 text-sm font-medium transition-colors',
          activeTab === 'watch-later'
            ? 'border-b-2 border-brand text-brand'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Watch Later ({watchLaterCount})
      </button>
      <button
        onClick={() => onTabChange('playlists')}
        className={cn(
          'flex-1 px-2 py-2 text-sm font-medium transition-colors',
          activeTab === 'playlists'
            ? 'border-b-2 border-brand text-brand'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Playlists
      </button>
      <button
        onClick={() => onTabChange('subscriptions')}
        className={cn(
          'flex-1 px-2 py-2 text-sm font-medium transition-colors',
          activeTab === 'subscriptions'
            ? 'border-b-2 border-brand text-brand'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Channels
      </button>
    </div>
  );
}
