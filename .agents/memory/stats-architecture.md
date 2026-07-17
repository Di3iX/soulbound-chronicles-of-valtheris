---
name: Stats architecture v0.1.4
description: Central stats module design — formulas, migration notes, and rules for future expansion
---

## Rule
`computeStats()` in `src/stats.ts` is the **single source of truth** for all derived character values.
No code outside `stats.ts` should compute maxHp, dmgMin, dmgMax, crit, dodge, defense, or attackInterval inline.

**Why:** Pre-v0.1.4, each formula was scattered (combat, equip, skill callbacks). This caused drift when new stats were added.

**How to apply:** Whenever you need any derived stat, call `computeStats({ base, levelHpBonus, bonusDmg, equip, skills })`.
The function is pure and cheap — safe to call every render or inside combat callbacks.

## Base stats (allocatable)
- `strength` — +2 dmg/pt · +0.5 defense/pt · +0.2% crit/pt
- `agility` — −3% attack interval/pt · +0.5% dodge/pt
- `vitality` — +10 max HP/pt  (**NOT** `endurance` — renamed in v0.1.4)
- `intelligence` — +0.5% total damage/pt

`INITIAL_BASE_STATS` = `{ strength: 5, agility: 5, vitality: 5, intelligence: 5 }`
Fresh-character max HP = `INITIAL_HP(100) + vitality(5)×10 = 150`

## Save migration
SAVE_VERSION stays at 2. `loadGame()` in `save.ts` does inline migration:
- Old saves with `endurance` field → mapped to `vitality`, `endurance` deleted
- Old saves missing `intelligence` → defaults to 5
- Old saves with incomplete `equipBonuses` → spread over `ZERO_EB` to add new fields

## EquipBonuses new fields (v0.1.4)
`vitality`, `intelligence`, `defense`, `critChance`, `critDamage`, `dodgeChance` — all zeroed in `ZERO_EQUIP_BONUSES`.
Items use the same optional fields in `ItemBonuses`.

## Combat application
- **Player attack**: roll crit with `critChance`, multiply dmg by `critDamageMult` on crit. Float shows "💥{dmg}".
- **Enemy attack**: check `dodgeChance` first (full miss, no damage). If hit, apply defense mitigation: `dmg × 100/(100+defense)`, minimum 1.
- Shield halves raw dmg BEFORE defense mitigation.
