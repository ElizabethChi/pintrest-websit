import { useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { skeletonPins } from '../data/skeleton';
import { columnCountForWidth, columnWidthFor, distribute } from '../lib/masonry';
import type { Pin } from '../lib/types';
import { useContentWidth } from '../hooks/useLayout';
import { MasonryColumn } from './MasonryColumn';

export type FeedStatus = 'loading' | 'ready' | 'empty' | 'error';

interface MasonryFeedProps {
  pins: Pin[];
  status: FeedStatus;
  loadingMore: boolean;
  canLoadMore: boolean;
  error?: string;
  savedIds: Set<string>;
  filteredOut: number;
  sourceNote?: string;
  onRetry: () => void;
  onLoadMore: () => void;
  onOpen: (pin: Pin) => void;
  onSave: (pin: Pin) => void;
  onShare: (pin: Pin) => void;
  onCopyLink: (pin: Pin) => void;
  onHide: (pin: Pin) => void;
}

export function MasonryFeed({
  pins,
  status,
  loadingMore,
  canLoadMore,
  error,
  savedIds,
  filteredOut,
  sourceNote,
  onRetry,
  onLoadMore,
  onOpen,
  onSave,
  onShare,
  onCopyLink,
  onHide,
}: MasonryFeedProps) {
  const [feedRef, contentWidth] = useContentWidth<HTMLDivElement>(1619);
  const columnCount = columnCountForWidth(contentWidth);
  const columnWidth = columnWidthFor(contentWidth, columnCount);

  // Skeletons keep the reference's first-screen rhythm on the very first paint.
  const skeletons = status === 'loading' && pins.length === 0;
  const visible = skeletons ? skeletonPins() : pins;
  const columns = distribute(visible, columnCount, columnWidth);
  const indexOf = useMemo(() => new Map(visible.map((pin, index) => [pin.id, index])), [visible]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(onLoadMore);
  loadMoreRef.current = onLoadMore;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canLoadMore || skeletons || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current();
      },
      { rootMargin: '800px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, skeletons]);

  return (
    <div className="feed" ref={feedRef}>
      {sourceNote && <p className="safe-note">{sourceNote}</p>}
      <div className="columns">
        {columns.map((column, columnIndex) => (
          <MasonryColumn
            key={columnIndex}
            pins={column}
            columnWidth={columnWidth}
            savedIds={savedIds}
            indexFor={(pin) => indexOf.get(pin.id) ?? 0}
            eagerCount={7}
            skeleton={skeletons}
            onOpen={onOpen}
            onSave={onSave}
            onShare={onShare}
            onCopyLink={onCopyLink}
            onHide={onHide}
          />
        ))}
      </div>

      {status === 'empty' && (
        <p className="empty-state">
          No openly licensed images matched that search.
          <br />
          Try a shorter, more general phrase — Openverse relevance drops off quickly on long queries.
        </p>
      )}

      {status === 'error' && (
        <div className="feed-status">
          <span>{error ?? 'The image API could not be reached.'}</span>
          <button type="button" className="btn" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      <div className="feed-status" aria-live="polite">
        {loadingMore && (
          <>
            <Loader2 size={16} className="spin" aria-hidden="true" />
            <span>Loading more images…</span>
          </>
        )}
        {!loadingMore && !canLoadMore && pins.length > 0 && <span>You have reached the end of these results.</span>}
      </div>
      {filteredOut > 0 && (
        <p className="safe-note" style={{ textAlign: 'center' }}>
          {filteredOut} result{filteredOut === 1 ? '' : 's'} filtered out by the explicit- and horror-content screen.
        </p>
      )}
      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}
