# Глава V — Глубины шахты + босс

## Файлы
boss.ts, useCombat.ts, quests.ts, npc.ts

## Квест
После болот → «Глубины шахты» → 5 убийств в **mine** (ур. ≥ 25)

## Босс
Зачистка → **🗿 Каменный страж** (HP 1700) → трофей «Осколок ядра голема»

## App.tsx
```ts
mineGuardianFirstKill: bossStateRef.current.mineGuardian?.firstKillDone,
bossIds={[..., MINE_BOSS_ID]}
normalizeBossState(sv?.bossState)
```
