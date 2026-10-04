import type { Pin } from './types';

const KEY = 'pinspire.saved.v1';

export interface SavedPin {
  id: string;
  title: string;
  imageUrl: string;
  creator?: string;
  sourceUrl?: string;
  savedAt: number;
}

export function readSaved(): SavedPin[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedPin[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSaved(pins: SavedPin[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(pins));
  } catch {
    /* private mode / quota — saving is best effort in a demo */
  }
}

export function toSavedPin(pin: Pin): SavedPin {
  return {
    id: pin.id,
    title: pin.title,
    imageUrl: pin.imageUrl,
    creator: pin.creator,
    sourceUrl: pin.sourceUrl,
    savedAt: Date.now(),
  };
}

export function isSavedPin(pin: Pin, saved: SavedPin[]): boolean {
  return saved.some((entry) => entry.id === pin.id);
}

export function toggleSavedPin(pin: Pin, saved: SavedPin[]): SavedPin[] {
  if (isSavedPin(pin, saved)) return saved.filter((entry) => entry.id !== pin.id);
  return [toSavedPin(pin), ...saved];
}

export function clearSaved(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
