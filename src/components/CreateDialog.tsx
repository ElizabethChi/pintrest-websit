import { useEffect, useRef, useState } from 'react';
import { Dialog } from './Dialog';

const BOARDS_KEY = 'pinspire.boards.v1';

export function readBoards(): string[] {
  try {
    const raw = localStorage.getItem(BOARDS_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBoards(boards: string[]): void {
  try {
    localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
  } catch {
    /* best effort */
  }
}

interface CreateDialogProps {
  open: boolean;
  mode: 'pin' | 'board';
  onClose: () => void;
  onAddLocalPin: (file: File, title: string) => void;
  onNotify: (message: string) => void;
}

/**
 * Create menu targets. Both actions are honest about scope: uploads never
 * leave the browser and boards live in localStorage.
 */
export function CreateDialog({ open, mode, onClose, onAddLocalPin, onNotify }: CreateDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [board, setBoard] = useState('');
  const objectUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setTitle('');
      setBoard('');
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
      setPreview(null);
    }
  }, [open]);

  if (mode === 'board') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Create board"
        footer={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const name = board.trim();
              if (!name) {
                onNotify('Give the board a name first.');
                return;
              }
              const boards = readBoards();
              if (boards.includes(name)) {
                onNotify(`“${name}” already exists.`);
                return;
              }
              writeBoards([...boards, name]);
              onNotify(`Board “${name}” created in this browser.`);
              onClose();
            }}
          >
            Create board
          </button>
        }
      >
        <p className="modal-meta">
          Boards are stored in this browser only — there is no account system behind this demo.
        </p>
        <input
          className="btn"
          style={{ width: '100%', background: '#f4f4f4' }}
          value={board}
          placeholder="Board name"
          aria-label="Board name"
          onChange={(event) => setBoard(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
        {readBoards().length > 0 && (
          <p className="modal-meta">Existing boards: {readBoards().join(', ')}</p>
        )}
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create pin"
      footer={
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!file) {
              onNotify('Choose an image file first.');
              return;
            }
            onAddLocalPin(file, title.trim() || file.name);
            onClose();
          }}
        >
          Add to saved
        </button>
      }
    >
      <p className="modal-meta">
        Pick an image from your device. It stays on your device: nothing is uploaded, and the pin is
        kept in this browser for the current session.
      </p>
      <div className="visual-search-preview">
        {preview ? (
          <img src={preview} alt="Selected file preview" />
        ) : (
          <span className="modal-meta">No file selected yet.</span>
        )}
        <input
          type="file"
          accept="image/*"
          aria-label="Choose an image file"
          onChange={(event) => {
            const picked = event.target.files?.[0] ?? null;
            setFile(picked);
            if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
            objectUrl.current = picked ? URL.createObjectURL(picked) : null;
            setPreview(objectUrl.current);
          }}
        />
      </div>
      <input
        className="btn"
        style={{ width: '100%', background: '#f4f4f4' }}
        value={title}
        placeholder="Pin title (optional)"
        aria-label="Pin title"
        onChange={(event) => setTitle(event.target.value)}
      />
    </Dialog>
  );
}
