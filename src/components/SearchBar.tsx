import { useId, useRef } from 'react';
import { Camera, Mic, Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCamera: () => void;
  onMic: () => void;
  /** True while a Web Speech recognition session is running. */
  listening: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onCamera,
  onMic,
  listening,
  inputRef,
}: SearchBarProps) {
  const localRef = useRef<HTMLInputElement | null>(null);
  const ref = inputRef ?? localRef;
  const labelId = useId();

  return (
    <form
      className="search-field"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <Search className="search-icon" size={17} strokeWidth={2} aria-hidden="true" />
      <label className="sr-only" htmlFor={labelId}>
        Search openly licensed images
      </label>
      <input
        id={labelId}
        ref={ref}
        type="search"
        name="q"
        placeholder="Search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="search-util">
        <button type="button" className="icon-btn" onClick={onCamera} aria-label="Search by image" title="Search by image">
          <Camera size={22} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onMic}
          aria-label={listening ? 'Stop voice search' : 'Voice search'}
          aria-pressed={listening}
          title={listening ? 'Listening…' : 'Voice search'}
        >
          <Mic size={22} strokeWidth={1.8} color={listening ? '#E60023' : undefined} />
        </button>
      </div>
    </form>
  );
}
