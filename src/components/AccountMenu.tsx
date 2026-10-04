import { useRef, useState } from 'react';
import { Bookmark, ChevronDown, LogOut, Settings, ShieldCheck, Trash2 } from 'lucide-react';
import { AVATAR_PIN } from '../data/bundledPins';
import { MenuItem, Popover } from './Popover';

interface AccountMenuProps {
  savedCount: number;
  onOpenSaved: () => void;
  onOpenSettings: (mode: 'filters' | 'account') => void;
  onClearSaved: () => void;
  onNotify: (message: string) => void;
}

export function AccountMenu({
  savedCount,
  onOpenSaved,
  onOpenSettings,
  onClearSaved,
  onNotify,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        className="account"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu${savedCount ? `, ${savedCount} saved pins` : ''}`}
        onClick={() => setOpen((current) => !current)}
      >
        {avatarFailed ? (
          <span className="avatar" aria-hidden="true">
            JD
          </span>
        ) : (
          <img
            className="avatar"
            src={AVATAR_PIN.imageUrl}
            alt=""
            width={30}
            height={30}
            onError={() => setAvatarFailed(true)}
          />
        )}
        <ChevronDown className="chevron" size={16} strokeWidth={2.2} aria-hidden="true" />
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={triggerRef} style={{ top: 46, right: 0 }}>
        <div className="popover-title">Jordan Diaz</div>
        <MenuItem
          icon={<Bookmark size={16} />}
          onSelect={() => {
            setOpen(false);
            onOpenSaved();
          }}
        >
          Saved pins{savedCount ? ` (${savedCount})` : ''}
        </MenuItem>
        <MenuItem
          icon={<ShieldCheck size={16} />}
          onSelect={() => {
            setOpen(false);
            onOpenSettings('filters');
          }}
        >
          Content filters
        </MenuItem>
        <MenuItem
          icon={<Settings size={16} />}
          onSelect={() => {
            setOpen(false);
            onOpenSettings('account');
          }}
        >
          Settings
        </MenuItem>
        <MenuItem
          icon={<Trash2 size={16} />}
          danger
          onSelect={() => {
            setOpen(false);
            onClearSaved();
          }}
        >
          Clear saved pins
        </MenuItem>
        <MenuItem
          icon={<LogOut size={16} />}
          onSelect={() => {
            setOpen(false);
            onNotify('This demo has no accounts to sign out of.');
          }}
        >
          Log out
        </MenuItem>
      </Popover>
    </div>
  );
}
