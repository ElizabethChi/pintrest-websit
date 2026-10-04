import { imageHeightFor } from '../lib/masonry';
import type { Pin } from '../lib/types';

/**
 * Non-interactive placeholder. It keeps the column occupied at the height the
 * real image will take, so nothing shifts when the image arrives — and it is
 * deliberately not a button, so nothing looks clickable before it is.
 */
export function SkeletonCard({ pin, columnWidth }: { pin: Pin; columnWidth: number }) {
  return (
    <div className="card" aria-hidden="true">
      <div className="card-media" style={{ height: imageHeightFor(pin, columnWidth) }}>
        <div className="skeleton" />
      </div>
      <div className="card-actions" />
    </div>
  );
}
