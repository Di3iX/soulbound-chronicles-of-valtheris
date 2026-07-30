// ─── LOCATION LEVEL GATES ─────────────────────────────────────────────────────
import type { LocationId } from '../combat';

/** Minimum player level to enter a location. Village & fields always open. */
export const LOCATION_MIN_LEVEL: Record<LocationId, number> = {
  village:    1,
  forest:     1,
  darkforest: 6,
  wolfcave:   8,
  mountains:  9,
  road:       10,
  ruins:      15,
  swamp:      18,
  mine:       25,
  pass:       30,
  icefort:    35,
};

export function canEnterLocation(
  to: LocationId,
  playerLevel: number,
): { ok: true } | { ok: false; required: number } {
  const required = LOCATION_MIN_LEVEL[to] ?? 1;
  if (playerLevel >= required) return { ok: true };
  return { ok: false, required };
}
