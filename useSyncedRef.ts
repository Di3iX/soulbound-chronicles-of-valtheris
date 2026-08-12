import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

/**
 * Keeps a ref in sync with a piece of React state.
 *
 * The game reads dozens of values inside setTimeout-driven combat callbacks,
 * where a stale closure over state would read outdated values. Refs sidestep
 * that, but each one previously needed its own `useEffect(() => { ref.current
 * = value }, [value])` — 26 near-identical lines in App.tsx. This hook is
 * that one line, reusable.
 */
export function useSyncedRef<T>(ref: MutableRefObject<T>, value: T): void {
  useEffect(() => {
    ref.current = value;
  }, [ref, value]);
}
