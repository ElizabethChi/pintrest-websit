import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreateDialog } from './components/CreateDialog';
import { Header } from './components/Header';
import { ImageDetailModal } from './components/ImageDetailModal';
import { MasonryFeed, type FeedStatus } from './components/MasonryFeed';
import {
  AccountDialog,
  FiltersDialog,
  InfoDialog,
  SavedDialog,
  VisualSearchDialog,
} from './components/Panels';
import { Sidebar } from './components/Sidebar';
import { Toast, type ToastItem } from './components/Toast';
import { BUNDLED_PINS } from './data/bundledPins';
import { DEFAULT_TOPIC, findTopic } from './data/topics';
import { useDebouncedCallback } from './hooks/useLayout';
import { fallbackPins } from './lib/fallbackArt';
import { searchCombined } from './lib/openverse';
import { screenQuery } from './lib/safety';
import { readSaved, toSavedPin, toggleSavedPin, writeSaved, type SavedPin } from './lib/storage';
import { ApiError, type Pin } from './lib/types';

/** Openverse caps anonymous pagination depth; stop before the server refuses. */
const MAX_PAGE = 5;
/** Below this many results a partially failed batch is padded with bundled art. */
const PAD_THRESHOLD = 12;

interface Mode {
  topic: string;
  /** Non-null puts the feed in search mode. */
  query: string | null;
}

type DialogName =
  | 'saved'
  | 'notifications'
  | 'messages'
  | 'filters'
  | 'account'
  | 'createPin'
  | 'createBoard'
  | 'visual'
  | null;

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const candidate =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition;
  return candidate ?? null;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function dedupePins(pins: Pin[]): Pin[] {
  const seen = new Set<string>();
  const next: Pin[] = [];
  for (const pin of pins) {
    if (seen.has(pin.id)) continue;
    seen.add(pin.id);
    next.push(pin);
  }
  return next;
}

export default function App() {
  const [mode, setMode] = useState<Mode>({ topic: DEFAULT_TOPIC, query: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [pins, setPins] = useState<Pin[]>([]);
  const [status, setStatus] = useState<FeedStatus>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [sourceNote, setSourceNote] = useState<string | undefined>(undefined);
  const [filteredOut, setFilteredOut] = useState(0);
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<SavedPin[]>(() => readSaved());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [detailPin, setDetailPin] = useState<Pin | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [listening, setListening] = useState(false);
  const [dialog, setDialog] = useState<DialogName>(null);
  const [visualPreview, setVisualPreview] = useState<string | null>(null);

  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const toastId = useRef(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const visualUrl = useRef<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  const notify = useCallback((message: string) => {
    const id = (toastId.current += 1);
    setToasts((current) => [...current.slice(-2), { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }, []);

  /** Bundled records first, then generated artwork — the feed is never blank. */
  const applyFallback = useCallback(
    (reason: string) => {
      setPins(dedupePins([...BUNDLED_PINS, ...fallbackPins(18)]));
      setStatus('ready');
      setSourceNote(reason);
      setCanLoadMore(false);
    },
    [],
  );

  const runSearch = useCallback(
    async (target: Mode, nextPage: number) => {
      const id = (requestId.current += 1);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const queries = target.query
        ? [target.query]
        : (findTopic(target.topic)?.queries ?? ['photography']);

      if (nextPage === 1) {
        setStatus('loading');
        setError(undefined);
        setSourceNote(undefined);
      } else {
        setLoadingMore(true);
      }

      try {
        const { pins: fetched, filteredOut: dropped, failures } = await searchCombined(queries, {
          page: nextPage,
          signal: controller.signal,
        });
        if (id !== requestId.current) return;

        setFilteredOut((current) => (nextPage === 1 ? dropped : current + dropped));

        if (fetched.length > 0) {
          const pad = failures > 0 && fetched.length < PAD_THRESHOLD;
          const next = pad
            ? dedupePins([...fetched, ...BUNDLED_PINS, ...fallbackPins(PAD_THRESHOLD)])
            : fetched;
          setPins((current) => (nextPage === 1 ? next : dedupePins([...current, ...next])));
          setStatus('ready');
          setPage(nextPage);
          setCanLoadMore(nextPage < MAX_PAGE);
          if (failures > 0) {
            const note =
              failures === queries.length
                ? 'Some image searches failed — the feed is padded with bundled images.'
                : `${failures} of ${queries.length} image searches failed; showing what came back.`;
            setSourceNote(note);
          }
        } else if (failures > 0 && nextPage === 1) {
          applyFallback(
            'The image API could not be reached, so this feed is showing bundled, openly licensed artwork.',
          );
        } else {
          setPins((current) => (nextPage === 1 ? [] : current));
          setStatus((current) => (nextPage === 1 ? 'empty' : current));
          setCanLoadMore(false);
        }
      } catch (caught) {
        if (id !== requestId.current) return;
        if ((caught as Error)?.name === 'AbortError') return;
        if (nextPage === 1) {
          const message =
            caught instanceof ApiError && caught.status === 429
              ? 'The image API is rate limiting this browser right now.'
              : 'The image API could not be reached.';
          setError(message);
          applyFallback(`${message} Showing bundled, openly licensed artwork instead.`);
          notify(message);
        } else {
          notify('Could not load more images.');
          setCanLoadMore(false);
        }
      } finally {
        if (id === requestId.current) setLoadingMore(false);
      }
    },
    [applyFallback, notify],
  );

  // Initial load and every topic / search change.
  useEffect(() => {
    void runSearch(mode, 1);
    return () => abortRef.current?.abort();
    // `runSearch` depends on `status`; only mode changes should reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const submitSearch = useCallback(
    (raw: string) => {
      const screening = screenQuery(raw);
      if (!screening.ok) {
        if (screening.reason) notify(screening.reason);
        return;
      }
      setSearchTerm(screening.query);
      setMode((current) =>
        current.query === screening.query ? current : { topic: current.topic, query: screening.query },
      );
    },
    [notify],
  );

  // Debounced live search: 700 ms after typing settles, ≥ 3 characters.
  const debouncedSearch = useDebouncedCallback((value: string) => submitSearch(value), 700);

  const onSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      const trimmed = value.trim();
      if (trimmed.length < 3) return;
      if (!screenQuery(trimmed).ok) return;
      debouncedSearch(trimmed);
    },
    [debouncedSearch],
  );

  const selectTopic = useCallback((label: string) => {
    setSearchTerm('');
    setMode((current) => (current.topic === label && !current.query ? current : { topic: label, query: null }));
  }, []);

  const savedIds = useMemo(() => new Set(saved.map((entry) => entry.id)), [saved]);
  const visiblePins = useMemo(
    () => pins.filter((pin) => !hiddenIds.has(pin.id)),
    [pins, hiddenIds],
  );

  useEffect(() => {
    writeSaved(saved);
  }, [saved]);

  const toggleSave = useCallback(
    (pin: Pin) => {
      setSaved((current) => {
        const next = toggleSavedPin(pin, current);
        notify(next.length === current.length ? `Removed “${pin.title}” from saved.` : `Saved “${pin.title}” to your board.`);
        return next;
      });
    },
    [notify],
  );

  const hidePin = useCallback(
    (pin: Pin) => {
      setHiddenIds((current) => new Set(current).add(pin.id));
      notify(`Hid “${pin.title}” from this feed.`);
    },
    [notify],
  );

  const copyLink = useCallback(
    async (pin: Pin) => {
      const ok = await copyText(pin.sourceUrl ?? pin.originalUrl);
      notify(ok ? 'Link copied to your clipboard.' : 'Your browser blocked clipboard access.');
    },
    [notify],
  );

  const sharePin = useCallback(
    async (pin: Pin) => {
      const url = pin.sourceUrl ?? pin.originalUrl;
      const share = navigator.share;
      if (typeof share === 'function') {
        try {
          await share.call(navigator, { title: pin.title, url });
          return;
        } catch {
          return; // dismissed
        }
      }
      await copyLink(pin);
    },
    [copyLink],
  );

  const startVoiceSearch = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      notify('Voice search is not supported in this browser — type your search instead.');
      searchInputRef.current?.focus();
      return;
    }
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const instance = new Ctor();
    instance.lang = navigator.language || 'en-US';
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      submitSearch(transcript);
    };
    instance.onerror = (event) => {
      setListening(false);
      notify(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone permission was denied, so voice search cannot run.'
          : `Voice search stopped (${event.error}).`,
      );
    };
    instance.onend = () => setListening(false);
    recognition.current = instance;
    try {
      instance.start();
      setListening(true);
      notify('Listening — say what you want to find.');
    } catch {
      setListening(false);
      notify('Could not start voice search in this browser.');
    }
  }, [listening, notify, submitSearch]);

  const onCameraFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (visualUrl.current) URL.revokeObjectURL(visualUrl.current);
      visualUrl.current = URL.createObjectURL(file);
      setVisualPreview(visualUrl.current);
      setDialog('visual');
    },
    [],
  );

  useEffect(
    () => () => {
      if (visualUrl.current) URL.revokeObjectURL(visualUrl.current);
    },
    [],
  );

  const closeDialog = useCallback(() => setDialog(null), []);

  return (
    <>
      <a className="sr-only" href="#feed">
        Skip to the image feed
      </a>
      <Sidebar
        notificationCount={2}
        onCreatePin={() => setDialog('createPin')}
        onCreateBoard={() => setDialog('createBoard')}
        onOpenNotifications={() => setDialog('notifications')}
        onOpenMessages={() => setDialog('messages')}
        onOpenSaved={() => setDialog('saved')}
        onOpenSettings={(target) => setDialog(target)}
      />

      <Header
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        onSearchSubmit={submitSearch}
        onCameraFile={onCameraFile}
        onMic={startVoiceSearch}
        listening={listening}
        activeTopic={mode.query ? '' : mode.topic}
        onTopicSelect={selectTopic}
        savedCount={saved.length}
        onOpenSaved={() => setDialog('saved')}
        onOpenSettings={(target) => setDialog(target)}
        onClearSaved={() => {
          setSaved([]);
          notify('Saved pins cleared from this browser.');
        }}
        onNotify={notify}
        searchInputRef={searchInputRef}
      />

      <main className="main" id="feed">
        <MasonryFeed
          pins={visiblePins}
          status={status}
          loadingMore={loadingMore}
          canLoadMore={canLoadMore}
          error={error}
          savedIds={savedIds}
          filteredOut={filteredOut}
          sourceNote={sourceNote}
          onRetry={() => void runSearch(mode, 1)}
          onLoadMore={() => {
            if (!loadingMore) void runSearch(mode, page + 1);
          }}
          onOpen={setDetailPin}
          onSave={toggleSave}
          onShare={(pin) => void sharePin(pin)}
          onCopyLink={(pin) => void copyLink(pin)}
          onHide={hidePin}
        />
      </main>

      <ImageDetailModal
        pin={detailPin}
        index={detailPin ? Math.max(0, visiblePins.findIndex((pin) => pin.id === detailPin.id)) : 0}
        saved={detailPin ? savedIds.has(detailPin.id) : false}
        onClose={() => setDetailPin(null)}
        onSave={toggleSave}
        onShare={(pin) => void sharePin(pin)}
        onCopyLink={(pin) => void copyLink(pin)}
      />

      <SavedDialog
        open={dialog === 'saved'}
        saved={saved}
        onClose={closeDialog}
        onRemove={(id) => {
          setSaved((current) => current.filter((entry) => entry.id !== id));
          notify('Removed from saved pins.');
        }}
      />

      <FiltersDialog
        open={dialog === 'filters'}
        filteredOut={filteredOut}
        onClose={closeDialog}
        onNotify={notify}
      />

      <AccountDialog
        open={dialog === 'account'}
        savedCount={saved.length}
        onClose={closeDialog}
        onClearSaved={() => {
          setSaved([]);
          notify('Saved pins cleared from this browser.');
          closeDialog();
        }}
        onNotify={notify}
      />

      <CreateDialog
        open={dialog === 'createPin' || dialog === 'createBoard'}
        mode={dialog === 'createBoard' ? 'board' : 'pin'}
        onClose={closeDialog}
        onAddLocalPin={(file, title) => {
          const url = URL.createObjectURL(file);
          const pin: Pin = {
            id: `local-${Date.now()}`,
            title,
            imageUrl: url,
            originalUrl: url,
            width: 0,
            height: 0,
            creator: 'You',
            local: true,
            attribution: 'Uploaded from this device. Stored in this browser for the current session.',
          };
          setSaved((current) => [toSavedPin(pin), ...current]);
          notify(`“${title}” added to your saved pins (this browser only).`);
        }}
        onNotify={notify}
      />

      <VisualSearchDialog
        open={dialog === 'visual'}
        preview={visualPreview}
        onClose={closeDialog}
        onSearchByKeyword={() => searchInputRef.current?.focus()}
      />

      <InfoDialog open={dialog === 'notifications'} title="Notifications" onClose={closeDialog}>
        <p className="modal-meta">
          This demo has no accounts or servers behind it, so there is nothing to notify you about yet.
          Saved pins are stored in this browser only.
        </p>
      </InfoDialog>

      <InfoDialog open={dialog === 'messages'} title="Messages" onClose={closeDialog}>
        <p className="modal-meta">
          Messaging is not part of this build — the button opens this panel instead of pretending to
          send anything.
        </p>
      </InfoDialog>

      <Toast toasts={toasts} />
    </>
  );
}
