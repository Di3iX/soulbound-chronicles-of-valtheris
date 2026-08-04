// ─── AGGRO / CHASE SYSTEM ─────────────────────────────────────────────────────
import type { Enemy } from './combat';
import { MONSTER_DEFS } from './monsters';

/** Chebyshev distance (king-move in chess) — good for tile aggro. */
export function distChebyshev(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function distManhattan(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Default aggro radius by monster speed (tiles). */
export function aggroRangeFor(name: string): number {
  const speed = MONSTER_DEFS[name]?.speed ?? 'normal';
  switch (speed) {
    case 'very_fast': return 5;
    case 'fast':      return 4;
    case 'normal':    return 3;
    case 'slow':      return 2;
    default:          return 3;
  }
}

/** How far from home a mob may chase before resetting. */
export function leashRangeFor(name: string): number {
  return aggroRangeFor(name) + 5;
}

export function isWalkableTile(tile: number | undefined): boolean {
  // 0 floor, 4 exit — walkable; 1 wall/tree, 3 water — blocked; 2 rock — blocked
  return tile === 0 || tile === 4;
}

function tileAt(map: number[][], x: number, y: number): number | undefined {
  return map[y]?.[x];
}

/** Occupy check: another living enemy on tile (optional block). */
function occupiedByEnemy(enemies: Enemy[], x: number, y: number, selfId: number): boolean {
  return enemies.some(e => !e.dead && e.id !== selfId && e.x === x && e.y === y);
}

/**
 * After player steps: pull aggro on nearby living enemies; leash drop if too far from home.
 */
export function updateAggro(
  enemies: Enemy[],
  playerPos: { x: number; y: number },
): Enemy[] {
  let changed = false;
  const next = enemies.map(e => {
    if (e.dead) return e;
    const home = { x: e.homeX ?? e.x, y: e.homeY ?? e.y };
    const toPlayer = distChebyshev(e, playerPos);
    const toHome = distChebyshev(e, home);
    const aggroR = e.aggroRange ?? aggroRangeFor(e.name);
    const leashR = e.leashRange ?? leashRangeFor(e.name);

    // Leash break → walk home flag via aggro false (step will return home)
    if (e.aggro && toHome > leashR) {
      changed = true;
      return { ...e, aggro: false };
    }
    // Acquire aggro
    if (!e.aggro && toPlayer <= aggroR) {
      changed = true;
      return { ...e, aggro: true };
    }
    return e;
  });
  return changed ? next : enemies;
}

/** One greedy step toward target; returns new position or same. */
export function stepToward(
  from: { x: number; y: number },
  to: { x: number; y: number },
  map: number[][],
  enemies: Enemy[],
  selfId: number,
): { x: number; y: number } {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  // Prefer axis that reduces the larger delta first; try diagonal then ortho
  const tries: [number, number][] = [];
  if (dx && dy) tries.push([dx, dy]);
  if (dx) tries.push([dx, 0]);
  if (dy) tries.push([0, dy]);
  // alternate ortho if blocked
  if (dx) tries.push([dx, dy ? 0 : 0]);
  if (dy) tries.push([0, dy]);

  const seen = new Set<string>();
  for (const [ox, oy] of tries) {
    const nx = from.x + ox;
    const ny = from.y + oy;
    const key = `${nx},${ny}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!isWalkableTile(tileAt(map, nx, ny))) continue;
    if (occupiedByEnemy(enemies, nx, ny, selfId)) continue;
    return { x: nx, y: ny };
  }
  return from;
}

export type AggroStepResult = {
  enemies: Enemy[];
  /** Enemy id that reached the player (start combat). */
  engageId: number | null;
};

/**
 * Move all aggroed (or returning) enemies one step.
 * Engage when Chebyshev distance to player becomes ≤ 1.
 */
export function stepAggroEnemies(
  enemies: Enemy[],
  playerPos: { x: number; y: number },
  map: number[][],
): AggroStepResult {
  let engageId: number | null = null;
  let working = enemies.map(e => ({ ...e }));

  // Sort: closer to player first so packs don't block as badly
  const order = working
    .map((e, idx) => ({ idx, e }))
    .filter(({ e }) => !e.dead && (e.aggro || (e.homeX !== undefined && (e.x !== e.homeX || e.y !== e.homeY))))
    .sort((a, b) => distChebyshev(a.e, playerPos) - distChebyshev(b.e, playerPos));

  for (const { idx, e } of order) {
    if (engageId !== null) break;
    const home = { x: e.homeX ?? e.x, y: e.homeY ?? e.y };
    const target = e.aggro ? playerPos : home;
    // Already adjacent + aggro → engage without moving onto player tile
    if (e.aggro && distChebyshev(e, playerPos) <= 1) {
      engageId = e.id;
      break;
    }
    const pos = stepToward(e, target, map, working, e.id);
    if (pos.x !== e.x || pos.y !== e.y) {
      working[idx] = { ...working[idx], x: pos.x, y: pos.y };
    }
    const cur = working[idx];
    if (cur.aggro && distChebyshev(cur, playerPos) <= 1) {
      engageId = cur.id;
      break;
    }
    // Arrived home
    if (!cur.aggro && cur.x === home.x && cur.y === home.y) {
      // stay
    }
  }

  return { enemies: working, engageId };
}

/** Call when combat ends / player flees — clear aggro flags. */
export function clearAllAggro(enemies: Enemy[]): Enemy[] {
  return enemies.map(e => (e.aggro ? { ...e, aggro: false } : e));
}
