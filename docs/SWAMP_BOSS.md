# Босс болот — Трясинный ужас

## Файлы
- `src/boss/boss.ts`
- `src/hooks/useCombat.ts`
- `src/quests/quests.ts`
- `src/quests/npc.ts`

## Появление
Зачисти мобов в **swamp** → босс **🫧 Трясинный ужас** (HP 1400).

## App.tsx
```ts
swampHorrorFirstKill: bossStateRef.current.swampHorror?.firstKillDone,

// CombatHUD:
bossIds={[BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID, SWAMP_BOSS_ID]}

// load:
normalizeBossState(sv?.bossState)
```
