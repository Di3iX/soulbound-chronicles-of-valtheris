// ─── AGGRO SYSTEM ────────────────────────────────────────────────────────────
// Правила (см. AGGRO_SYSTEM.md):
//  1. Игрок в радиусе аггро → aggro: true. Радиус берётся из enemy.aggroRange,
//     если задан (см. combat.ts, шаг 4 / camp system); иначе — по редкости,
//     как аналог "скорости" моба.
//  2. Раз в ~450мс аггрессивные мобы шагают к игроку (обход стен/воды/скал)
//  3. Дистанция ≤ 1 → бой (как наступил на моба)
//  4. Ушёл дальше leash (enemy.leashRange, иначе дефолт) от home → сброс аггро
//  5. Респавн уже возвращает моба на home без аггро (combat.ts: reviveEnemy) —
//     здесь home лениво фиксируется как позиция моба при первом касании этой
//     системой (эквивалентно точке спавна, пока моб ни разу не преследовал).
import type { Enemy, EnemyRarity } from './combat';

/** Радиус обнаружения по умолчанию, если у моба нет своего aggroRange. */
const AGGRO_RADIUS: Record<EnemyRarity, number> = {
  common: 2, uncommon: 3, rare: 3, elite: 4, legendary: 5,
};

/** Дистанция leash по умолчанию, если у моба нет своего leashRange. */
const DEFAULT_LEASH_RADIUS = 6;

function aggroRadiusOf(e: Enemy): number {
  return e.aggroRange ?? AGGRO_RADIUS[e.rarity] ?? 2;
}

function leashRadiusOf(e: Enemy): number {
  return e.leashRange ?? DEFAULT_LEASH_RADIUS;
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

/** Один шаг в сторону цели с обходом препятствий (0 = проходимо). */
function stepToward(
  fx: number, fy: number, tx: number, ty: number, map: number[][] | undefined,
): { x: number; y: number } {
  if (fx === tx && fy === ty) return { x: fx, y: fy };

  const dx = Math.sign(tx - fx);
  const dy = Math.sign(ty - fy);

  const walkable = (nx: number, ny: number): boolean => {
    if (nx < 0 || ny < 0) return false;
    if (!map) return true;
    if (ny >= map.length) return false;
    const row = map[ny];
    if (!row || nx >= row.length) return false;
    return (row[nx] ?? 1) === 0;
  };

  const candidates: Array<[number, number]> = [];
  if (dx !== 0 && dy !== 0) candidates.push([fx + dx, fy + dy]);
  if (dx !== 0) candidates.push([fx + dx, fy]);
  if (dy !== 0) candidates.push([fx, fy + dy]);

  for (const [nx, ny] of candidates) {
    if (walkable(nx, ny)) return { x: nx, y: ny };
  }
  return { x: fx, y: fy }; // всё заблокировано — стоим на месте
}

/**
 * Вызывается после каждого хода игрока (movePlayer). Помечает aggro: true
 * тех живых мобов, что оказались в радиусе обнаружения. Возвращает тот же
 * массив (по ссылке), если ничего не поменялось — чтобы вызывающий код мог
 * дёшево пропустить лишний setState.
 */
export function updateAggro(enemies: Enemy[], playerPos: { x: number; y: number }): Enemy[] {
  let changed = false;

  const next = enemies.map(e => {
    if (e.dead) return e;

    const homeX = e.homeX ?? e.x;
    const homeY = e.homeY ?? e.y;
    const needsHomeInit = e.homeX == null || e.homeY == null;

    if (e.aggro) {
      if (needsHomeInit) {
        changed = true;
        return { ...e, homeX, homeY };
      }
      return e;
    }

    const radius = aggroRadiusOf(e);
    if (dist(e.x, e.y, playerPos.x, playerPos.y) <= radius) {
      changed = true;
      return { ...e, aggro: true, homeX, homeY };
    }

    if (needsHomeInit) {
      changed = true;
      return { ...e, homeX, homeY };
    }
    return e;
  });

  return changed ? next : enemies;
}

export interface AggroStepResult {
  enemies: Enemy[];
  /** id моба, вплотную подошедшего к игроку — начать с ним бой, если не null. */
  engageId: number | null;
}

/**
 * Вызывается по таймеру (~450мс) в фазе explore. Двигает аггрессивных мобов
 * на один шаг к игроку либо обратно домой (если leash превышен), и мобов,
 * что уже возвращаются домой после сброса аггро. Один бой инициируется за тик.
 */
export function stepAggroEnemies(
  enemies: Enemy[],
  playerPos: { x: number; y: number },
  map: number[][] | undefined,
): AggroStepResult {
  let changed = false;
  let engageId: number | null = null;

  const next = enemies.map(e => {
    if (e.dead) return e;

    const homeX = e.homeX ?? e.x;
    const homeY = e.homeY ?? e.y;

    if (e.aggro) {
      // Вплотную к игроку → бой.
      if (engageId == null && dist(e.x, e.y, playerPos.x, playerPos.y) <= 1) {
        engageId = e.id;
        changed = true;
        return { ...e, aggro: false, homeX, homeY };
      }

      // Убежал дальше leash от дома → сброс аггро, дальше идёт домой.
      if (dist(e.x, e.y, homeX, homeY) >= leashRadiusOf(e)) {
        const stepped = stepToward(e.x, e.y, homeX, homeY, map);
        changed = true;
        return { ...e, x: stepped.x, y: stepped.y, aggro: false, homeX, homeY };
      }

      // Погоня.
      const stepped = stepToward(e.x, e.y, playerPos.x, playerPos.y, map);
      if (stepped.x !== e.x || stepped.y !== e.y) changed = true;
      return { ...e, x: stepped.x, y: stepped.y, homeX, homeY };
    }

    // Без аггро, но не дома (только что сбросил погоню) — идёт домой.
    if (e.x !== homeX || e.y !== homeY) {
      const stepped = stepToward(e.x, e.y, homeX, homeY, map);
      if (stepped.x !== e.x || stepped.y !== e.y) changed = true;
      return { ...e, x: stepped.x, y: stepped.y, homeX, homeY };
    }

    return e;
  });

  return { enemies: changed ? next : enemies, engageId };
}

/** Сбрасывает аггро всем мобам (вызывать после победы/поражения/бегства). */
export function clearAllAggro(enemies: Enemy[]): Enemy[] {
  let changed = false;
  const next = enemies.map(e => {
    if (!e.aggro) return e;
    changed = true;
    return { ...e, aggro: false };
  });
  return changed ? next : enemies;
}
