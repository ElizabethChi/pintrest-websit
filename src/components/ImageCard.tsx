import { useCallback, useState } from 'react';
import { EyeOff, Share2 } from 'lucide-react';
import { brokenImageReplacement } from '../lib/fallbackArt';
import { imageHeightFor } from '../lib/masonry';
import type { Pin } from '../lib/types';
import { CardActions } from './CardActions';

interface ImageCardProps {
  pin: Pin;
  /** Position in the feed; picks the fallback artwork deterministically. */
  index: number;
  columnWidth: number;
  saved: boolean;
  eager?: boolean;
  onOpen: (pin: Pin) => void;
  onSave: (pin: Pin) => void;
  onShare: (pin: Pin) => void;
  onCopyLink: (pin: Pin) => void;
  onHide: (pin: Pin) => void;
}

export function ImageCard({
  pin,
  index,
  columnWidth,
  saved,
  eager = false,
  onOpen,
  onSave,
  onShare,
  onCopyLink,
  onHide,
}: ImageCardProps) {
  const height = imageHeightFor(pin, columnWidth);
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState(pin.imageUrl);

  // A dead hotlink swaps to bundled artwork instead of a broken tile.
  const handleError = useCallback(() => {
    setSrc(brokenImageReplacement(index));
    setLoaded(true);
  }, [index]);

  const alt = pin.local
    ? `${pin.title} — bundled abstract artwork`
    : `${pin.title}${pin.creator ? ` by ${pin.creator}` : ''}`;

  return (
    <article className="card">
      <div className="card-media" style={{ height }}>
        <button
          type="button"
          className="card-anchor"
          style={{ height }}
          aria-label={`Open ${pin.title}`}
          onClick={() => onOpen(pin)}
        >
          <img
            src={src}
            alt={alt}
            width={columnWidth}
            height={height}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            data-loading={loaded ? 'false' : 'true'}
            onLoad={() => setLoaded(true)}
            onError={handleError}
            style={{ height }}
          />
        </button>
        {!loaded && <div className="skeleton" aria-hidden="true" />}
        {pin.badge && <span className="badge-count">{pin.badge}</span>}
        <div className="hover-layer">
          <button
            type="button"
            className="save-btn"
            data-saved={saved ? 'true' : undefined}
            onClick={() => onSave(pin)}
          >
            {saved ? 'Saved' : 'Save'}
          </button>
          <div className="hover-actions">
            <button type="button" className="hover-chip" aria-label={`Share ${pin.title}`} onClick={() => onShare(pin)}>
              <Share2 size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="hover-chip"
              aria-label={`Hide ${pin.title}`}
              onClick={() => onHide(pin)}
            >
              <EyeOff size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <CardActions
        pin={pin}
        saved={saved}
        onSave={() => onSave(pin)}
        onShare={() => onShare(pin)}
        onCopyLink={() => onCopyLink(pin)}
        onHide={() => onHide(pin)}
      />
    </article>
  );
}
