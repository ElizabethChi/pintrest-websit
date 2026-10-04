import { useRef } from 'react';
import { AccountMenu } from './AccountMenu';
import { SearchBar } from './SearchBar';
import { TopicNavigation } from './TopicNavigation';

interface HeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  onCameraFile: (file: File | null) => void;
  onMic: () => void;
  listening: boolean;
  activeTopic: string;
  onTopicSelect: (label: string) => void;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenSettings: (mode: 'filters' | 'account') => void;
  onClearSaved: () => void;
  onNotify: (message: string) => void;
  /** Lets the app focus the field (voice fallback, visual-search hand-off). */
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * Fixed header: search row on top, topic row beneath it. The feed scrolls
 * underneath; neither row moves.
 */
export function Header({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onCameraFile,
  onMic,
  listening,
  activeTopic,
  onTopicSelect,
  savedCount,
  onOpenSaved,
  onOpenSettings,
  onClearSaved,
  onNotify,
  searchInputRef,
}: HeaderProps) {
  const localSearchRef = useRef<HTMLInputElement | null>(null);
  const searchRef = searchInputRef ?? localSearchRef;
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <header className="header" id="top">
      <div className="search-row">
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          onSubmit={onSearchSubmit}
          onCamera={() => fileRef.current?.click()}
          onMic={onMic}
          listening={listening}
          inputRef={searchRef}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            onCameraFile(event.target.files?.[0] ?? null);
            event.target.value = '';
          }}
        />
        <AccountMenu
          savedCount={savedCount}
          onOpenSaved={onOpenSaved}
          onOpenSettings={onOpenSettings}
          onClearSaved={onClearSaved}
          onNotify={onNotify}
        />
      </div>
      <TopicNavigation active={activeTopic} onSelect={onTopicSelect} />
    </header>
  );
}

export type { HeaderProps };
