---
name: Boss system architecture
description: How bosses are structured, spawned, and rewarded — key decisions for future boss work
---

## Current implementation (post config-driven refactor, 7 bosses)

**Files:**
- `src/boss/boss.ts` — `BOSS_CONFIGS`, the single source of truth for every boss (id, stats,
  reward, respawn timer, trophy, and combat-flow metadata). All the small helpers
  (`bossKeyForEnemyId`, `makeTrophyForBoss`, `isBossId`, `isMiniBossId`, `bossKindLabel`,
  `normalizeBossState`) are derived from this one map.
- `src/hooks/useCombat.ts` — generic `spawnBoss(key)` / `handleBossDeath(key)` and the
  respawn-check loop, all driven by iterating `BOSS_CONFIGS`. No boss is hand-coded more
  than once anywhere in the codebase.
- `src/hooks/useWorldMovement.ts` — `movePlayer` / `handleLocationTransition` (moved out of
  App.tsx). The "block exit until boss X is first-killed" gate (e.g. Cave → Ruins) lives here.
- `src/boss/BossVictoryPanel.tsx` — victory overlay component (unchanged).
- `save.ts` — `bossState?: BossState`, one entry per boss key (unchanged mechanism, now 7 keys
  instead of 1).

**Boss ids** — each boss gets a reserved id ≥ 9993 (`caveChief=9999` down to `iceKing=9993`),
never conflicting with `makeLocationEnemies` (ids 1…N). Identify a boss by
`bossKeyForEnemyId(enemy.id)`, NOT by name or a hardcoded id comparison.

**Per-boss config shape** (`BossConfig` in `boss.ts`):
```ts
{ id, def, reward, respawnMs, trophy, isMiniBoss,
  locationId, requiresAreaClear, unlockMessage?, firstKillStoryLines }
```
- `locationId` / `requiresAreaClear` drive the generic respawn loop (does this boss's location
  need every other enemy dead first? `fieldBoar` is the one exception — `requiresAreaClear: false`).
- `unlockMessage` — extra log line shown once, right after first trophy pickup. Only `caveChief`
  has one today (unlocks the Ruins exit).
- `firstKillStoryLines` — exactly 2 narrative log lines shown only on the very first kill of that
  boss (checked by `boss/boss.test.ts`).

**Spawn flow:** the respawn-check `setInterval` in `useCombat` loops `Object.keys(BOSS_CONFIGS)`,
checks `currentLocationRef.current === cfg.locationId`, off-cooldown, and area-clear (if
required) → calls generic `spawnBoss(key)`.

**Kill flow:** `handleEnemyDeath` calls `bossKeyForEnemyId(id)`; if it resolves, dispatches to
generic `handleBossDeath(key)` BEFORE the normal-enemy `applyRewards` path.

**Why (still true, unchanged reasoning):**
- Reserved high ids avoid touching `combat.ts` (owns `LocationId`/`Enemy` types).
- Boss rewards duplicate the level-up XP/gold logic rather than reusing `REWARD_TABLE`
  (in `combat.ts`) because bosses aren't in that table.
- Trophy items (`makeTrophyForBoss(key)`) are NOT in `ITEM_CATALOG` — intentional; sell price
  falls back to rarity, display uses the item's own embedded fields.

**Saved state:** `bossState.<key>.firstKillDone` per boss — once true: trophy never drops again,
and (for `caveChief` specifically) the Cave→Ruins exit stays permanently unblocked.

**How to add a new boss (now a single-file change):**
1. Add one new entry to `BOSS_CONFIGS` in `boss.ts` with a unique id, `locationId`, and exactly
   2 `firstKillStoryLines`. That's it — spawn, death, reward, respawn, and dispatch are all
   generic and pick it up automatically.
2. If this boss should unlock something, set `unlockMessage` and wire the actual gate check in
   `useWorldMovement.ts`'s `movePlayer` (only `caveChief` does this today).
3. Add a test case in `boss/boss.test.ts` (the data-integrity tests iterate all boss keys
   automatically, but story-specific behavior needs an explicit assertion).

**Do NOT** reintroduce per-boss constants (`X_BOSS_ID`, `X_BOSS_DEF`, `makeXBossTrophy()`, a
`spawnXBoss()` function, etc.) — that pattern was refactored away specifically because it made
adding/changing a boss require edits in 6+ places. If you're about to copy-paste a boss-handling
function, put the boss-specific bits in `BOSS_CONFIGS` instead.
