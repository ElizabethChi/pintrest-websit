import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Measures an element's *content box* width (padding excluded) so column
 * counts come from the space actually available to the feed.
 */
export function useContentWidth<T extends HTMLElement>(initial = 1619) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(element.clientWidth);
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/** Trailing-edge debounce. */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay: number,
) {
  const timer = useRef<number | undefined>(undefined);
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return useCallback(
    (...args: A) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => saved.current(...args), delay);
    },
    [delay],
  );
}
