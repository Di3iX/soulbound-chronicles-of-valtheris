# Полировка — чеклист App.tsx

## 1. normalizeBossState при загрузке
```ts
import {
  BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID, SWAMP_BOSS_ID,
  MINE_BOSS_ID, PASS_BOSS_ID, ICE_BOSS_ID,
  normalizeBossState, INITIAL_BOSS_STATE,
} from './boss/boss';

const [bossState, setBossState] = useState(
  normalizeBossState(sv?.bossState) ?? INITIAL_BOSS_STATE
);
```

## 2. getNpcDialogue — флаги
```ts
const dlg = getNpcDialogue(npc.id, questProgressRef.current, {
  fieldBoarFirstKill:   bossStateRef.current.fieldBoar?.firstKillDone,
  caveChiefFirstKill:   bossStateRef.current.caveChief?.firstKillDone,
  ruinsKeeperFirstKill: bossStateRef.current.ruinsKeeper?.firstKillDone,
  swampHorrorFirstKill: bossStateRef.current.swampHorror?.firstKillDone,
  mineGuardianFirstKill: bossStateRef.current.mineGuardian?.firstKillDone,
  passLordFirstKill:    bossStateRef.current.passLord?.firstKillDone,
  iceKingFirstKill:     bossStateRef.current.iceKing?.firstKillDone,
  crystalCount: inventoryRef.current.filter(i => i.key === 'black_crystal').length,
  inventory: inventoryRef.current, // кузнец: ✅/❌ рецепты
});
```

## 3. CombatHUD
```ts
bossIds={[
  BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID, SWAMP_BOSS_ID,
  MINE_BOSS_ID, PASS_BOSS_ID, ICE_BOSS_ID,
]}
```

## 4. handleQuestAction — craft + deliverItems
См. CRAFT_INTEGRATION.md и CRYSTALS_QUEST.md.

## 5. Диалог — disabled кнопки
В overlay кнопок: `disabled={!!btn.disabled}` (см. DIALOG_OVERLAY_FIX.tsx).

## 6. После крафта обновить диалог кузнеца
Снова вызвать getNpcDialogue('smith', …, { inventory: result.inventory }) чтобы ✅ обновились.
