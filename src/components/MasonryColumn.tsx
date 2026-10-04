import type { Pin } from '../lib/types';
import { ImageCard } from './ImageCard';
import { SkeletonCard } from './SkeletonCard';

interface MasonryColumnProps {
  pins: Pin[];
  columnWidth: number;
  savedIds: Set<string>;
  /** Feed-wide position of a pin, used for eager loading and fallback art. */
  indexFor: (pin: Pin) => number;
  eagerCount: number;
  /** Render non-interactive placeholders instead of real cards. */
  skeleton?: boolean;
  onOpen: (pin: Pin) => void;
  onSave: (pin: Pin) => void;
  onShare: (pin: Pin) => void;
  onCopyLink: (pin: Pin) => void;
  onHide: (pin: Pin) => void;
}

/** One independent vertical stack of the masonry. */
export function MasonryColumn({
  pins,
  columnWidth,
  savedIds,
  indexFor,
  eagerCount,
  skeleton = false,
  onOpen,
  onSave,
  onShare,
  onCopyLink,
  onHide,
}: MasonryColumnProps) {
  return (
    <div className="column" style={{ width: columnWidth }}>
      {pins.map((pin) => {
        if (skeleton) return <SkeletonCard key={pin.id} pin={pin} columnWidth={columnWidth} />;
        const index = indexFor(pin);
        return (
          <ImageCard
            key={pin.id}
            pin={pin}
            index={index}
            columnWidth={columnWidth}
            saved={savedIds.has(pin.id)}
            eager={index < eagerCount}
            onOpen={onOpen}
            onSave={onSave}
            onShare={onShare}
            onCopyLink={onCopyLink}
            onHide={onHide}
          />
        );
      })}
    </div>
  );
}
