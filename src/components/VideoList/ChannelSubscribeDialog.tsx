import {useState} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {ChannelImportResult} from '@/utils/youtube';
import {ChannelIcon} from '@/components/common/icons/ChannelIcon';

interface ChannelSubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelData: ChannelImportResult;
  onSubscribe: () => void;
}

export function ChannelSubscribeDialog({
  open,
  onOpenChange,
  channelData,
  onSubscribe,
}: ChannelSubscribeDialogProps) {
  const {metadata, videos} = channelData;
  const [thumbnailError, setThumbnailError] = useState(false);

  const handleSubscribe = () => {
    onSubscribe();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to Channel</DialogTitle>
          <DialogDescription>
            Add this channel to your subscriptions to track new videos
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4">
          {/* Channel thumbnail */}
          {metadata.thumbnail && !thumbnailError ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-16 h-16 rounded-full object-cover shrink-0"
              onError={() => setThumbnailError(true)}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0">
              <ChannelIcon className="w-8 h-8 text-muted-foreground"/>
            </div>
          )}

          {/* Channel info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{metadata.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {videos.length} recent video{videos.length !== 1 ? 's' : ''} will be added
            </p>
          </div>
        </div>

        {/* Video preview */}
        {videos.length > 0 && (
          <div className="border-t border-border pt-4 overflow-hidden">
            <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold tracking-wide">Recent videos</p>
            <div className="space-y-2 max-h-32 overflow-y-auto overflow-x-hidden">
              {videos.slice(0, 3).map((video) => (
                <div key={video.id} className="flex items-center gap-2 min-w-0">
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="w-10 h-6 object-cover rounded shrink-0"
                  />
                  <span className="text-sm truncate">{video.title}</span>
                </div>
              ))}
              {videos.length > 3 && (
                <p className="text-xs text-muted-foreground/70">
                  +{videos.length - 3} more videos
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm bg-secondary hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubscribe}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand text-brand-foreground hover:bg-brand-strong transition-colors shadow-[0_2px_12px_-3px_var(--glow)]"
          >
            Subscribe
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
