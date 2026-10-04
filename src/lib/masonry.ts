import type { Pin } from './types';

/** Feed geometry taken from the reference at 1727 × 900. */
export const FEED = {
  sidebarWidth: 64,
  /** Main content starts at x = 78 → 14 px right of the sidebar. */
  paddingLeft: 14,
  /** Right edge of the last column lands at x ≈ 1697. */
  paddingRight: 30,
  /** Horizontal gap between columns. */
  gap: 14,
  /** Target column width: 7 × 219 + 6 × 14 = 1617 ≈ the 1619 px available. */
  targetColumnWidth: 219,
  minColumnWidth: 150,
  maxColumns: 8,
  minColumns: 2,
  /** Image bottom → 3-dot row → next image top, ~44 px. */
  actionAreaHeight: 44,
  /** Clamp for rendered image heights; the reference spans ~274–460 px. */
  minImageHeight: 180,
  maxImageHeight: 520,
  /** Used when a record carries no width/height metadata. */
  defaultRatio: 0.75,
} as const;

/**
 * Column count from the *content* width, not the viewport width: the sidebar
 * owns 64 px on desktop. At the reference width the content box is 1619 px
 * and this yields exactly 7 columns.
 */
export function columnCountForWidth(contentWidth: number): number {
  if (!Number.isFinite(contentWidth) || contentWidth <= 0) return FEED.minColumns;
  const { targetColumnWidth, gap, minColumnWidth, maxColumns, minColumns } = FEED;
  const count = Math.floor((contentWidth + gap) / (targetColumnWidth + gap));
  const safe = Math.max(count, Math.floor((contentWidth + gap) / (minColumnWidth + gap)));
  return Math.min(maxColumns, Math.max(minColumns, Math.min(count, safe) || minColumns));
}

/** Ratio (width / height) of a pin, clamped to the ratios seen in the reference. */
export function pinRatio(pin: Pick<Pin, 'width' | 'height'>): number {
  const { width, height } = pin;
  if (!width || !height) return FEED.defaultRatio;
  return Math.min(1.05, Math.max(0.45, width / height));
}

/** Image height for a pin rendered at `columnWidth`. */
export function imageHeightFor(pin: Pick<Pin, 'width' | 'height'>, columnWidth: number): number {
  const raw = columnWidth / pinRatio(pin);
  return Math.round(Math.min(FEED.maxImageHeight, Math.max(FEED.minImageHeight, raw)));
}

/** Full block height: image + the three-dot action area beneath it. */
export function cardHeightFor(pin: Pick<Pin, 'width' | 'height'>, columnWidth: number): number {
  return imageHeightFor(pin, columnWidth) + FEED.actionAreaHeight;
}

/**
 * True masonry: each pin goes into the currently shortest column, so columns
 * keep independent vertical offsets and no row band is forced to a common
 * height. Heights come from metadata, so the layout is final before any image
 * finishes loading — no reflow, no reordering, no overlap.
 */
export function distribute(pins: Pin[], columnCount: number, columnWidth: number): Pin[][] {
  const columns: Pin[][] = Array.from({ length: Math.max(1, columnCount) }, () => []);
  const heights = new Array<number>(columns.length).fill(0);

  for (const pin of pins) {
    let target = 0;
    for (let i = 1; i < columns.length; i += 1) {
      if (heights[i] < heights[target]) target = i;
    }
    columns[target].push(pin);
    heights[target] += cardHeightFor(pin, columnWidth) + FEED.gap;
  }
  return columns;
}

/** Column width for a content box holding `columnCount` columns. */
export function columnWidthFor(contentWidth: number, columnCount: number): number {
  const count = Math.max(1, columnCount);
  return Math.max(120, Math.floor((contentWidth - FEED.gap * (count - 1)) / count));
}
