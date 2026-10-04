import type { Pin } from '../lib/types';

/**
 * Placeholder pins shown on first paint, before any image has arrived.
 *
 * The ratios are the ones measured in the reference at a 219 px column
 * (291, 328, 300, 460, 274, 329, 389 px tall). Because the masonry fills the
 * shortest column first, feeding these seven ratios round-robin to seven
 * columns reproduces the reference's first-screen rhythm immediately.
 */
const REFERENCE_RATIOS = [0.753, 0.668, 0.73, 0.476, 0.8, 0.666, 0.563];

export function skeletonPins(count = 21): Pin[] {
  return Array.from({ length: count }, (_, index) => {
    const ratio = REFERENCE_RATIOS[index % REFERENCE_RATIOS.length];
    return {
      id: `skeleton-${index}`,
      title: 'Loading image',
      imageUrl: '',
      originalUrl: '',
      width: 1000,
      height: Math.round(1000 / ratio),
    };
  });
}
