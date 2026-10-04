import { useEffect, useRef, useState } from 'react';
import { Bookmark, ExternalLink, Link2, Share2, X } from 'lucide-react';
import { brokenImageReplacement } from '../lib/fallbackArt';
import type { Pin } from '../lib/types';

interface ImageDetailModalProps {
  pin: Pin | null;
  saved: boolean;
  index: number;
  onClose: () => void;
  onSave: (pin: Pin) => void;
  onShare: (pin: Pin) => void;
  onCopyLink: (pin: Pin) => void;
}

/** Larger view of a pin with the attribution the license asks for. */
export function ImageDetailModal({
  pin,
  saved,
  index,
  onClose,
  onSave,
  onShare,
  onCopyLink,
}: ImageDetailModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!pin) return;
    setSrc(pin.imageUrl);
    restoreRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previous;
      restoreRef.current?.focus();
    };
  }, [pin, onClose]);

  if (!pin) return null;

  const licenseLabel = pin.license
    ? `${pin.license.toUpperCase()}${pin.licenseVersion ? ` ${pin.licenseVersion}` : ''}`
    : 'licence stated on the source page';

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={pin.title} ref={panelRef} tabIndex={-1}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close image details">
          <X size={18} strokeWidth={2.2} />
        </button>

        <div className="modal-media">
          <img
            src={src}
            alt={`${pin.title}${pin.creator ? ` by ${pin.creator}` : ''}`}
            onError={() => setSrc(brokenImageReplacement(index))}
          />
        </div>

        <div className="modal-side">
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" data-active={saved || undefined} onClick={() => onSave(pin)}>
              <Bookmark size={16} />
              {saved ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="btn" onClick={() => onShare(pin)}>
              <Share2 size={16} />
              Share
            </button>
            <button type="button" className="btn" onClick={() => onCopyLink(pin)}>
              <Link2 size={16} />
              Copy link
            </button>
          </div>

          <h2 className="modal-title">{pin.title}</h2>

          <p className="modal-meta">
            {pin.creator ? (
              <>
                By{' '}
                {pin.creatorUrl ? (
                  <a href={pin.creatorUrl} target="_blank" rel="noopener noreferrer">
                    {pin.creator}
                  </a>
                ) : (
                  pin.creator
                )}
                {pin.provider ? ` · ${pin.provider}` : ''}
              </>
            ) : (
              'Creator not listed'
            )}
          </p>

          {pin.width > 0 && pin.height > 0 && (
            <p className="modal-meta">
              {pin.width} × {pin.height} px
              {pin.category ? ` · ${pin.category.replace('_', ' ')}` : ''}
            </p>
          )}

          <p className="attribution">
            {pin.attribution ?? `“${pin.title}” is licensed under ${licenseLabel}.`}
            {pin.licenseUrl && (
              <>
                {' '}
                <a href={pin.licenseUrl} target="_blank" rel="noopener noreferrer">
                  {licenseLabel}
                </a>
              </>
            )}
          </p>

          {pin.sourceUrl && (
            <a className="btn" href={pin.sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} />
              View source
            </a>
          )}

          {pin.local && (
            <p className="modal-meta">
              This is bundled artwork shown because the image service could not be reached.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
