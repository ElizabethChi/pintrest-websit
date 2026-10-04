import type { ReactNode } from 'react';
import { Bookmark, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react';
import { clearCache } from '../lib/openverse';
import { SAFETY_LABEL } from '../lib/safety';
import type { SavedPin } from '../lib/storage';
import { Dialog } from './Dialog';

/** Grid of locally saved pins. */
export function SavedDialog({
  open,
  saved,
  onClose,
  onRemove,
}: {
  open: boolean;
  saved: SavedPin[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={`Saved pins (${saved.length})`} width={560}>
      {saved.length === 0 ? (
        <p className="modal-meta">
          Nothing saved yet. Hover any image in the feed and choose <strong>Save</strong>.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 10,
          }}
        >
          {saved.map((pin) => (
            <figure key={pin.id} style={{ margin: 0, position: 'relative' }}>
              <img
                src={pin.imageUrl}
                alt={pin.title}
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, background: '#f4f4f4' }}
              />
              <figcaption
                style={{
                  fontSize: 12,
                  color: '#5f5f5f',
                  marginTop: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {pin.title}
              </figcaption>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove ${pin.title}`}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,.9)' }}
                onClick={() => onRemove(pin.id)}
              >
                <Trash2 size={15} />
              </button>
            </figure>
          ))}
        </div>
      )}
    </Dialog>
  );
}

/** Generic informational dialog (notifications, messages). */
export function InfoDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      {children}
    </Dialog>
  );
}

/** Content-filter dialog. The safety stack is always on — there is no toggle. */
export function FiltersDialog({
  open,
  filteredOut,
  onClose,
  onNotify,
}: {
  open: boolean;
  filteredOut: number;
  onClose: () => void;
  onNotify: (message: string) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Content filters"
      footer={
        <button
          type="button"
          className="btn"
          onClick={() => {
            clearCache();
            onNotify('Cached API responses cleared. The next search hits the API again.');
          }}
        >
          Clear cached results
        </button>
      }
    >
      <p className="modal-meta">
        <ShieldCheck size={14} style={{ verticalAlign: -2 }} /> {SAFETY_LABEL}
      </p>
      <ul className="modal-meta" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.7 }}>
        <li>Every request asks Openverse to exclude content it considers sensitive.</li>
        <li>Search terms are screened before they are sent — explicit and horror queries are refused.</li>
        <li>Each returned image is screened on its title, creator and tags, and anything Openverse flags is dropped.</li>
        <li>There is no setting to weaken these filters.</li>
      </ul>
      <p className="modal-meta">
        Results screened out during this session: <strong>{filteredOut}</strong>.
      </p>
    </Dialog>
  );
}

/** Account + data dialog. */
export function AccountDialog({
  open,
  savedCount,
  onClose,
  onClearSaved,
  onNotify,
}: {
  open: boolean;
  savedCount: number;
  onClose: () => void;
  onClearSaved: () => void;
  onNotify: (message: string) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Account & data"
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={() => {
              clearCache();
              onNotify('Cached API responses cleared.');
            }}
          >
            Clear image cache
          </button>
          <button type="button" className="btn" data-danger="true" onClick={onClearSaved}>
            Clear {savedCount} saved pin{savedCount === 1 ? '' : 's'}
          </button>
        </>
      }
    >
      <p className="modal-meta">
        Signed in as <strong>Jordan Diaz</strong> (demo account — nothing is stored server side).
      </p>
      <p className="modal-meta">
        Saved pins and boards live in this browser&rsquo;s local storage. Search results are cached in
        session storage for 30 minutes to stay inside the Openverse anonymous limits of 20 requests
        per minute and 200 per day.
      </p>
      <p className="modal-meta">
        <Bookmark size={14} style={{ verticalAlign: -2 }} /> {savedCount} saved pin
        {savedCount === 1 ? '' : 's'} ·{' '}
        <a href="https://openverse.org" target="_blank" rel="noopener noreferrer">
          Images via Openverse <ExternalLink size={12} style={{ verticalAlign: -1 }} />
        </a>
      </p>
    </Dialog>
  );
}

/** Visual-search entry point, honest about what it does and does not do. */
export function VisualSearchDialog({
  open,
  preview,
  onClose,
  onSearchByKeyword,
}: {
  open: boolean;
  preview: string | null;
  onClose: () => void;
  onSearchByKeyword: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Search by image"
      width={520}
      footer={
        <>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onSearchByKeyword();
            }}
          >
            Search by keyword instead
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="visual-search-preview">
        {preview ? <img src={preview} alt="The image you selected" /> : <span className="modal-meta">No image selected.</span>}
      </div>
      <p className="modal-meta">
        Your image stays on your device. This build has no image-recognition service connected, so it
        cannot turn a picture into search terms — use the keyword search for results.
      </p>
    </Dialog>
  );
}
