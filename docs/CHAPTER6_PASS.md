# Глава VI — Каменный перевал

## Квест
После шахты → «Каменный перевал» → 5 убийств (ур. ≥ 30)

## Босс
**🏔️ Владыка перевала** (HP 2000) → трофей «Корона ветров»

## App.tsx
```ts
passLordFirstKill: bossStateRef.current.passLord?.firstKillDone,
bossIds={[..., PASS_BOSS_ID]}
normalizeBossState(sv?.bossState)
```
