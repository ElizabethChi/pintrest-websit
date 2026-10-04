import { useRef, useState } from 'react';
import { Bookmark, ExternalLink, Link2, MoreHorizontal, Share2 } from 'lucide-react';
import type { Pin } from '../lib/types';
import { MenuItem, Popover } from './Popover';

interface CardActionsProps {
  pin: Pin;
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  onHide: () => void;
}

/**
 * Three-dot overflow row rendered *underneath* the image, right aligned, as in
 * the reference. Opening the menu never changes the feed layout.
 */
export function CardActions({ pin, saved, onSave, onShare, onCopyLink, onHide }: CardActionsProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="card-actions">
      <button
        ref={triggerRef}
        type="button"
        className="icon-btn"
        aria-label={`Actions for ${pin.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="More actions"
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal size={19} strokeWidth={2.1} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={triggerRef} style={{ top: 32, right: 0 }}>
        <MenuItem
          icon={<Bookmark size={16} />}
          onSelect={() => {
            setOpen(false);
            onSave();
          }}
        >
          {saved ? 'Remove from saved' : 'Save'}
        </MenuItem>
        <MenuItem
          icon={<Share2 size={16} />}
          onSelect={() => {
            setOpen(false);
            onShare();
          }}
        >
          Share
        </MenuItem>
        <MenuItem
          icon={<Link2 size={16} />}
          onSelect={() => {
            setOpen(false);
            onCopyLink();
          }}
        >
          Copy link
        </MenuItem>
        {pin.sourceUrl && (
          <MenuItem
            icon={<ExternalLink size={16} />}
            onSelect={() => {
              setOpen(false);
              window.open(pin.sourceUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            View source
          </MenuItem>
        )}
        <MenuItem
          icon={<MoreHorizontal size={16} />}
          danger
          onSelect={() => {
            setOpen(false);
            onHide();
          }}
        >
          Hide pin
        </MenuItem>
      </Popover>
    </div>
  );
}
