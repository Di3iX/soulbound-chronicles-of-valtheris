---
name: Boss system architecture
description: How the boss (Goblin Chief) is structured, spawned, and rewarded — key decisions for future boss work
---

## Current implementation (v0.1.6)

**Files added:**
- `src/boss/boss.ts` — BOSS_ID, CAVE_BOSS_DEF, BossState, BossRewardInfo, makeBossTrophy, reward constants
- `src/boss/BossVictoryPanel.tsx` — victory overlay component
- `save.ts` — added optional `bossState?: BossState`

**BOSS_ID = 9999** — reserved id that never conflicts with makeLocationEnemies (ids 1…N).
Identify the boss by `enemy.id === BOSS_ID`, NOT by name.

**Spawn flow:** `handleEnemyDeath` → allDead in Cave → `spawnCaveBoss()` injects boss into enemies array, sets `bossSpawnedThisVisitRef = true`, shows 3.5s notification.

**Kill flow:** `handleEnemyDeath` intercepts `id === BOSS_ID` BEFORE `applyRewards`, calls `handleBossDeath()`. Enemy is already marked dead by that point.

**Why:**
- `BOSS_ID=9999` avoids modifying combat.ts (which owns LocationId and Enemy types; moving it would break circular import guards).
- Boss rewards duplicate the level-up loop from `applyRewards` because REWARD_TABLE (in combat.ts, unmodifiable) has no boss entry.
- `makeBossTrophy()` creates an Item with key `goblin_chief_trophy` that is NOT in ITEM_CATALOG — this is intentional and safe (sell price falls back to rarity, display uses item's own fields).

**Saved state:** `bossState.caveChief.firstKillDone` — once true: (1) trophy never drops again, (2) Cave→Ruins exit permanently unblocked. SAVE_VERSION stays at 2 (optional field).

**Runtime-only state (not saved):**
- `bossSpawnedThisVisit` / `bossSpawnedThisVisitRef` — reset on cave entry via `handleLocationTransition`
- `bossDefeatedThisVisit` / `bossDefeatedThisVisitRef` — reset on cave entry
- `bossAppearNotif` — 3.5s notification timer
- `showBossVictory` / `bossRewardInfo` — drives BossVictoryPanel

**How to apply for future bosses:**
1. Add a new `BossDef` entry in `boss.ts` with a unique id > 9999.
2. Add `<locationId>ChiefDefeated: boolean` to BossState.
3. Wire the allDead check in `handleEnemyDeath` for the new location.
4. Add a separate `handleBossDeathXxx` callback following the same pattern.
5. Reset visit flags in `handleLocationTransition` when entering the new location.
6. Block the downstream exit using `bossStateRef.current.<field>` in `movePlayer`.
