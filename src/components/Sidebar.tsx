import { useRef, useState } from 'react';
import {
  Bell,
  LayoutGrid,
  MessageCircle,
  Plus,
  Settings,
  SlidersHorizontal,
  Home,
} from 'lucide-react';
import { MenuItem, Popover } from './Popover';

/** Original vector brand mark: a red disc with a stylised pushpin. */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="#E60023" />
      <path
        d="M16.9 7.2c-2.6-.5-5 .5-6 2.6-.9 1.9-.4 3.9.6 5 .3.3.7.2.8-.2l.4-1.3c.1-.2 0-.4-.1-.6-.5-.7-.6-1.7-.2-2.6.8-1.7 2.7-2.4 4.5-2 2.4.5 3.7 2.6 3.2 4.9-.5 2.5-2.4 4.2-4.4 3.8-1-.2-1.6-.9-1.5-1.6.1-.7.4-1.6.8-2.5.2-.5 0-1.1-.6-1.2-1-.3-1.9.6-2.1 1.9-.2 1 0 1.7.2 2.2l-1.9 8c-.1.4.4.6.6.2l3-6.1c.4.4 1 .6 1.7.7 3.1.6 6.1-2 6.8-5.8.7-3.6-1.5-6.8-4.8-7.3z"
        fill="#fff"
      />
    </svg>
  );
}

interface SidebarProps {
  onCreatePin: () => void;
  onCreateBoard: () => void;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
  onOpenSaved: () => void;
  onOpenSettings: (mode: 'filters' | 'account') => void;
  notificationCount: number;
}

export function Sidebar({
  onCreatePin,
  onCreateBoard,
  onOpenNotifications,
  onOpenMessages,
  onOpenSaved,
  onOpenSettings,
  notificationCount,
}: SidebarProps) {
  const [openMenu, setOpenMenu] = useState<'create' | 'bell' | 'messages' | 'sliders' | 'settings' | null>(null);
  const createRef = useRef<HTMLButtonElement | null>(null);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const messagesRef = useRef<HTMLButtonElement | null>(null);
  const slidersRef = useRef<HTMLButtonElement | null>(null);
  const settingsRef = useRef<HTMLButtonElement | null>(null);

  const close = () => setOpenMenu(null);

  return (
    <nav className="sidebar" aria-label="Primary">
      <a
        className="rail-item rail-brand"
        href="#top"
        aria-label="Pinspire home"
        onClick={(event) => {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <BrandMark />
      </a>

      <a className="rail-item rail-home" href="#top" aria-label="Home" aria-current="page" title="Home">
        <Home size={24} strokeWidth={2.2} fill="currentColor" />
      </a>

      <button
        type="button"
        className="rail-item rail-grid"
        aria-label="Saved boards"
        title="Saved boards"
        onClick={onOpenSaved}
      >
        <LayoutGrid size={23} strokeWidth={1.9} />
      </button>

      <button
        ref={createRef}
        type="button"
        className="rail-item rail-create"
        aria-label="Create"
        aria-haspopup="menu"
        aria-expanded={openMenu === 'create'}
        title="Create"
        onClick={() => setOpenMenu((current) => (current === 'create' ? null : 'create'))}
      >
        <Plus size={24} strokeWidth={2} />
      </button>
      <Popover
        open={openMenu === 'create'}
        onClose={close}
        anchorRef={createRef}
        style={{ top: 214, left: 58 }}
      >
        <div className="popover-title">Create</div>
        <MenuItem
          icon={<Plus size={16} />}
          onSelect={() => {
            close();
            onCreatePin();
          }}
        >
          Create pin
        </MenuItem>
        <MenuItem
          icon={<LayoutGrid size={16} />}
          onSelect={() => {
            close();
            onCreateBoard();
          }}
        >
          Create board
        </MenuItem>
      </Popover>

      <button
        ref={bellRef}
        type="button"
        className="rail-item rail-bell"
        aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ''}`}
        aria-haspopup="menu"
        aria-expanded={openMenu === 'bell'}
        title="Notifications"
        onClick={() => setOpenMenu((current) => (current === 'bell' ? null : 'bell'))}
      >
        <Bell size={23} strokeWidth={1.9} />
        {notificationCount > 0 && <span className="rail-dot" aria-hidden="true" />}
      </button>
      <Popover open={openMenu === 'bell'} onClose={close} anchorRef={bellRef} style={{ top: 279, left: 58 }}>
        <div className="popover-title">Notifications</div>
        <MenuItem
          onSelect={() => {
            close();
            onOpenNotifications();
          }}
        >
          View all notifications
        </MenuItem>
      </Popover>

      <button
        ref={messagesRef}
        type="button"
        className="rail-item rail-messages"
        aria-label="Messages"
        aria-haspopup="menu"
        aria-expanded={openMenu === 'messages'}
        title="Messages"
        onClick={() => setOpenMenu((current) => (current === 'messages' ? null : 'messages'))}
      >
        <MessageCircle size={23} strokeWidth={1.9} />
      </button>
      <Popover
        open={openMenu === 'messages'}
        onClose={close}
        anchorRef={messagesRef}
        style={{ top: 344, left: 58 }}
      >
        <div className="popover-title">Messages</div>
        <MenuItem
          onSelect={() => {
            close();
            onOpenMessages();
          }}
        >
          Open inbox
        </MenuItem>
      </Popover>

      <button
        ref={slidersRef}
        type="button"
        className="rail-item rail-sliders"
        aria-label="Feed filters"
        aria-haspopup="menu"
        aria-expanded={openMenu === 'sliders'}
        title="Feed filters"
        onClick={() => setOpenMenu((current) => (current === 'sliders' ? null : 'sliders'))}
      >
        <SlidersHorizontal size={23} strokeWidth={1.9} />
      </button>
      <Popover
        open={openMenu === 'sliders'}
        onClose={close}
        anchorRef={slidersRef}
        style={{ top: 409, left: 58 }}
      >
        <div className="popover-title">Feed filters</div>
        <MenuItem
          onSelect={() => {
            close();
            onOpenSettings('filters');
          }}
        >
          Content filters…
        </MenuItem>
      </Popover>

      <button
        ref={settingsRef}
        type="button"
        className="rail-item rail-settings"
        aria-label="Settings"
        aria-haspopup="menu"
        aria-expanded={openMenu === 'settings'}
        title="Settings"
        onClick={() => setOpenMenu((current) => (current === 'settings' ? null : 'settings'))}
      >
        <Settings size={23} strokeWidth={1.9} />
      </button>
      <Popover
        open={openMenu === 'settings'}
        onClose={close}
        anchorRef={settingsRef}
        style={{ bottom: 22, left: 58 }}
      >
        <div className="popover-title">Settings</div>
        <MenuItem
          icon={<SlidersHorizontal size={16} />}
          onSelect={() => {
            close();
            onOpenSettings('filters');
          }}
        >
          Content filters
        </MenuItem>
        <MenuItem
          onSelect={() => {
            close();
            onOpenSettings('account');
          }}
        >
          Account &amp; data
        </MenuItem>
      </Popover>
    </nav>
  );
}
