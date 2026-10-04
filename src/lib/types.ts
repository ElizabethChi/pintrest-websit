export interface Pin {
  /** Stable, unique key used for React keys and dedupe. */
  id: string;
  title: string;
  /** URL rendered in the feed (Openverse thumbnail when available). */
  imageUrl: string;
  /** Original file, opened in the detail modal. */
  originalUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  creator?: string;
  creatorUrl?: string;
  /** Landing page of the source (Flickr page, museum record, …). */
  sourceUrl?: string;
  license?: string;
  licenseVersion?: string;
  licenseUrl?: string;
  provider?: string;
  attribution?: string;
  category?: string;
  /** `true` for the locally generated artwork used when the API is unavailable. */
  local?: boolean;
  /** Some cards in the reference carry a `3/9` style multi-image badge. */
  badge?: string;
}

export interface SearchPage {
  pins: Pin[];
  resultCount: number;
  pageCount: number;
  page: number;
  /** Records removed by the safety screen, for the UI's filtered-count notice. */
  filteredOut: number;
}

export type FeedMode = 'topic' | 'search';

export class ApiError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;
  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
