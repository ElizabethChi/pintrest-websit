import { screenResult } from './safety';
import { ApiError, type Pin, type SearchPage } from './types';

export const OPENVERSE_IMAGES = 'https://api.openverse.org/v1/images/';

/**
 * Anonymous Openverse limits, read from the live response headers:
 * `X-RateLimit-Limit-anon_burst: 20/min`, `X-RateLimit-Limit-anon_sustained: 200/day`.
 * The client stays well inside those by caching and by paging lazily.
 */
export const PAGE_SIZE = 24;

export interface SearchRequest {
  query: string;
  page?: number;
  pageSize?: number;
  /** Openverse aspect buckets: `square` | `tall` | `wide`. */
  aspectRatio?: string;
  /** `photograph` | `illustration` | `digitized_artwork`. */
  category?: string;
}

/** Build the request URL. Safety params are added here so they can't be forgotten. */
export function buildSearchUrl({
  query,
  page = 1,
  pageSize = PAGE_SIZE,
  aspectRatio,
  category,
}: SearchRequest): string {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  // Layer 1 of the safety stack. `mature` must NOT be sent alongside this one:
  // the API answers 400 "`mature` and `unstable__include_sensitive_results`
  // must not both be defined."
  params.set('unstable__include_sensitive_results', 'false');
  params.set('filter_dead', 'true');
  if (aspectRatio) params.set('aspect_ratio', aspectRatio);
  if (category) params.set('category', category);
  return `${OPENVERSE_IMAGES}?${params.toString()}`;
}

interface RawImage {
  id: string;
  title?: string | null;
  url?: string | null;
  thumbnail?: string | null;
  creator?: string | null;
  creator_url?: string | null;
  foreign_landing_url?: string | null;
  license?: string | null;
  license_version?: string | null;
  license_url?: string | null;
  provider?: string | null;
  category?: string | null;
  attribution?: string | null;
  width?: number | null;
  height?: number | null;
  mature?: boolean | null;
  unstable__sensitivity?: string[] | null;
  tags?: { name?: string | null }[] | null;
}

/** Map one raw record onto a Pin. Layer 4: no usable URL means no pin. */
export function toPin(raw: RawImage): Pin | null {
  if (!raw?.id || !raw.url) return null;
  const width = Number(raw.width) > 0 ? Number(raw.width) : 0;
  const height = Number(raw.height) > 0 ? Number(raw.height) : 0;
  return {
    id: raw.id,
    title: raw.title?.trim() || 'Untitled',
    imageUrl: raw.thumbnail || raw.url,
    originalUrl: raw.url,
    thumbnailUrl: raw.thumbnail ?? undefined,
    width,
    height,
    creator: raw.creator?.trim() || undefined,
    creatorUrl: raw.creator_url || undefined,
    sourceUrl: raw.foreign_landing_url || undefined,
    license: raw.license ?? undefined,
    licenseVersion: raw.license_version ?? undefined,
    licenseUrl: raw.license_url || undefined,
    provider: raw.provider ?? undefined,
    attribution: raw.attribution ?? undefined,
    category: raw.category ?? undefined,
  };
}

const memoryCache = new Map<string, SearchPage>();
const SESSION_KEY = 'pinspire.openverse.v1';

type StoredEntry = { at: number; page: SearchPage };

function readSessionCache(): Map<string, StoredEntry> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as [string, StoredEntry][];
    return new Map(parsed);
  } catch {
    return new Map();
  }
}

function writeSessionCache(cache: Map<string, StoredEntry>): void {
  try {
    // sessionStorage throws when full; dropping the cache is always acceptable.
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...cache.entries()]));
  } catch {
    /* ignore quota errors */
  }
}

const TTL_MS = 30 * 60 * 1000;

export function getCached(url: string): SearchPage | undefined {
  const hit = memoryCache.get(url);
  if (hit) return hit;
  const stored = readSessionCache().get(url);
  if (stored && Date.now() - stored.at < TTL_MS) {
    memoryCache.set(url, stored.page);
    return stored.page;
  }
  return undefined;
}

function setCached(url: string, page: SearchPage): void {
  memoryCache.set(url, page);
  const cache = readSessionCache();
  cache.set(url, { at: Date.now(), page });
  writeSessionCache(cache);
}

export function clearCache(): void {
  memoryCache.clear();
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export interface SearchOptions {
  signal?: AbortSignal;
  /** Skip the cache (used by the explicit "retry" affordance). */
  fresh?: boolean;
  fetchImpl?: typeof fetch;
}

/**
 * Run one Openverse image search, screen every record and dedupe by id.
 * Returns an empty page rather than throwing when the query yields nothing.
 */
export async function searchImages(request: SearchRequest, options: SearchOptions = {}): Promise<SearchPage> {
  const url = buildSearchUrl(request);
  if (!options.fresh) {
    const cached = getCached(url);
    if (cached) return cached;
  }

  const doFetch = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await doFetch(url, { signal: options.signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new ApiError('Could not reach the image API.', 0);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After')) || undefined;
    throw new ApiError('The image API is rate limiting us right now.', 429, retryAfter);
  }
  if (!response.ok) {
    throw new ApiError(`The image API returned ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as {
    result_count?: number;
    page_count?: number;
    page?: number;
    results?: RawImage[];
  };

  const raw = Array.isArray(payload.results) ? payload.results : [];
  const pins: Pin[] = [];
  const seen = new Set<string>();
  let filteredOut = 0;

  for (const item of raw) {
    if (!screenResult(item).safe) {
      filteredOut += 1;
      continue;
    }
    const pin = toPin(item);
    if (!pin) {
      filteredOut += 1;
      continue;
    }
    if (seen.has(pin.id)) continue;
    seen.add(pin.id);
    pins.push(pin);
  }

  const page: SearchPage = {
    pins,
    resultCount: payload.result_count ?? pins.length,
    pageCount: payload.page_count ?? 1,
    page: payload.page ?? request.page ?? 1,
    filteredOut,
  };
  setCached(url, page);
  return page;
}

/**
 * Run several short, targeted searches and merge them. Openverse relevance
 * falls off a cliff on long queries ("teal luxury sports car photography"
 * returns zero results), so topics ship 2–3 word queries that are combined
 * here instead of one generic query.
 */
export async function searchCombined(
  queries: string[],
  options: SearchOptions & { aspectRatio?: string; page?: number } = {},
): Promise<{ pins: Pin[]; filteredOut: number; resultCount: number; failures: number }> {
  const settled = await Promise.allSettled(
    queries.map((query) =>
      searchImages(
        { query, page: options.page ?? 1, aspectRatio: options.aspectRatio },
        { signal: options.signal, fresh: options.fresh, fetchImpl: options.fetchImpl },
      ),
    ),
  );

  const pins: Pin[] = [];
  const seen = new Set<string>();
  let filteredOut = 0;
  let resultCount = 0;
  let failures = 0;

  for (const outcome of settled) {
    if (outcome.status === 'rejected') {
      failures += 1;
      const error = outcome.reason;
      if ((error as Error)?.name === 'AbortError') throw error;
      continue;
    }
    filteredOut += outcome.value.filteredOut;
    resultCount += outcome.value.resultCount;
    for (const pin of outcome.value.pins) {
      if (seen.has(pin.id)) continue;
      seen.add(pin.id);
      pins.push(pin);
    }
  }

  return { pins, filteredOut, resultCount, failures };
}
