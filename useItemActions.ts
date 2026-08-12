// ─── ITEM ACTIONS (craft / upgrade / tier-promote / enchant) ──────────────────
// Extracted from App.tsx: everything that mutates an inventory or equipped item
// and recomputes the derived equip/stat totals afterwards. Self-contained —
// doesn't touch quest, world, or combat state.
import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Item, ItemTier } from '../inventory';
import { TIER_LEVEL_RANGE } from '../inventory';
import type { Equipment, EquipBonuses } from '../equipment';
import { calcEquipBonuses } from '../equipment';
import type { BaseStats } from '../stats';
import { computeStats } from '../stats';
import type { SkillBonuses } from '../skills/skillTree';
import { getRecipe, craftItem, learnRecipe } from '../items/craft';
import { upgradeItemInInventory, upgradeEquippedItem, type ProtectMode } from '../items/upgrade';
import { promoteItemTier } from '../items/tierPromote';
import { applyEnchant } from '../items/enchant';

export interface ItemActionsCtx {
  inventoryRef:      MutableRefObject<Item[]>;
  playerGoldRef:     MutableRefObject<number>;
  equipmentRef:      MutableRefObject<Equipment>;
  equipBonusesRef:   MutableRefObject<EquipBonuses>;
  statsRef:          MutableRefObject<BaseStats>;
  levelHpBonusRef:   MutableRefObject<number>;
  levelMpBonusRef:   MutableRefObject<number>;
  playerBonusDmgRef: MutableRefObject<number>;
  skillBonusesRef:   MutableRefObject<SkillBonuses>;
  playerMaxHpRef:    MutableRefObject<number>;
  playerMaxMpRef:    MutableRefObject<number>;
  playerLevelRef:    MutableRefObject<number>;
  unlockedRecipes:   string[];

  setInventory:      Dispatch<SetStateAction<Item[]>>;
  setPlayerGold:     Dispatch<SetStateAction<number>>;
  setEquipment:      Dispatch<SetStateAction<Equipment>>;
  setEquipBonuses:   Dispatch<SetStateAction<EquipBonuses>>;
  setPlayerMaxHp:    Dispatch<SetStateAction<number>>;
  setPlayerMaxMp:    Dispatch<SetStateAction<number>>;
  setUnlockedRecipes: Dispatch<SetStateAction<string[]>>;

  log:           (msg: string) => void;
  showGateNotif: (msg: string) => void;
}

export function useItemActions(ctx: ItemActionsCtx) {
  const {
    inventoryRef, playerGoldRef, equipmentRef, equipBonusesRef,
    statsRef, levelHpBonusRef, levelMpBonusRef, playerBonusDmgRef, skillBonusesRef,
    playerMaxHpRef, playerMaxMpRef, playerLevelRef, unlockedRecipes,
    setInventory, setPlayerGold, setEquipment, setEquipBonuses, setPlayerMaxHp, setPlayerMaxMp, setUnlockedRecipes,
    log, showGateNotif,
  } = ctx;

  const handleCraft = useCallback((recipeId: string) => {
    const recipe = getRecipe(recipeId);
    if (!recipe) return;
    const res = craftItem(recipe, inventoryRef.current);
    if (!res.ok) { log(res.reason); return; }
    inventoryRef.current = res.inventory;
    setInventory(res.inventory);
    log(`⚒️ Скрафчено: ${res.item.name}`);
  }, [log]);

  const handleLearn = useCallback((recipeId: string) => {
    const recipe = getRecipe(recipeId);
    if (!recipe) return;
    const res = learnRecipe(recipe, unlockedRecipes, inventoryRef.current);
    setUnlockedRecipes(res.unlocked);
    inventoryRef.current = res.inventory;
    setInventory(res.inventory);
    log(res.msg);
  }, [log, unlockedRecipes]);

  // ── UpgradePanel: upgrade inventory / equipped item ─────────────────────────
  const handleUpgradeInv = useCallback((itemId: string, protect: ProtectMode = 'none') => {
    const res = upgradeItemInInventory(itemId, inventoryRef.current, playerGoldRef.current, protect);
    if (!res.ok) { log(res.reason); return; }
    inventoryRef.current = res.inventory;
    setInventory(res.inventory);
    playerGoldRef.current = res.gold;
    setPlayerGold(res.gold);
    log(res.msg);
  }, [log]);

  /** Commit a new Equipment set and recompute equipBonuses + derived max HP/MP —
   *  shared by upgrade/tier-promote/enchant, which all mutate one equipped item
   *  and need the same stat-recalculation afterwards. */
  const applyEquipmentUpdate = useCallback((newEquipment: Equipment) => {
    equipmentRef.current = newEquipment;
    setEquipment(newEquipment);

    const newBonuses = calcEquipBonuses(newEquipment);
    equipBonusesRef.current = newBonuses;
    setEquipBonuses(newBonuses);

    const newStats = computeStats({
      base: statsRef.current, levelHpBonus: levelHpBonusRef.current, levelMpBonus: levelMpBonusRef.current,
      bonusDmg: playerBonusDmgRef.current, equip: newBonuses,
      skills: skillBonusesRef.current,
    });
    playerMaxHpRef.current = newStats.maxHp;
    setPlayerMaxHp(newStats.maxHp);
    playerMaxMpRef.current = newStats.maxMp;
    setPlayerMaxMp(newStats.maxMp);
  }, []);

  const handleUpgradeEq = useCallback((slot: string, protect: ProtectMode = 'none') => {
    const item = equipmentRef.current[slot as keyof Equipment];
    if (!item) return;
    const res = upgradeEquippedItem(item, inventoryRef.current, playerGoldRef.current, protect);
    if (!res.ok) { log(res.reason); return; }

    playerGoldRef.current = res.gold;
    setPlayerGold(res.gold);
    inventoryRef.current = res.inventory;
    setInventory(res.inventory);
    log(res.msg);

    let newEquipment: Equipment;
    if (res.success) {
      // Успех: ставим улучшенный предмет обратно в слот.
      newEquipment = { ...equipmentRef.current, [slot]: res.item ?? null };
    } else if (res.failKind === 'destroy') {
      // Провал с уничтожением: слот пустеет, предмет потерян.
      newEquipment = { ...equipmentRef.current, [slot]: null };
    } else if (res.item) {
      // Провал (safe/downgrade): предмет остаётся надетым, тот же или ослабленный.
      newEquipment = { ...equipmentRef.current, [slot]: res.item };
    } else {
      return;
    }

    applyEquipmentUpdate(newEquipment);
  }, [log, applyEquipmentUpdate]);

  // ── TierPromotePanel: T1→T6 ──────────────────────────────────────────────
  const handleTierPromoteInv = useCallback((itemId: string) => {
    const item = inventoryRef.current.find(i => i.id === itemId);
    if (!item) return;

    const nextTier = Math.min(6, (item.tier ?? 1) + 1) as ItemTier;
    const requiredLevel = TIER_LEVEL_RANGE[nextTier].min;
    if (playerLevelRef.current < requiredLevel) {
      log(`Нужен ${requiredLevel} уровень для тира T${nextTier}.`);
      showGateNotif(`🔒 Нужен ${requiredLevel} уровень для тира T${nextTier}`);
      return;
    }

    const res = promoteItemTier(item, inventoryRef.current, playerGoldRef.current, true);
    if (!res.ok) { log(res.reason); return; }

    inventoryRef.current = res.inventory;
    setInventory(res.inventory);
    playerGoldRef.current = res.gold;
    setPlayerGold(res.gold);
    log(res.msg);
  }, [log, showGateNotif]);

  const handleTierPromoteEq = useCallback((slot: string) => {
    const item = equipmentRef.current[slot as keyof Equipment];
    if (!item) return;

    const nextTier = Math.min(6, (item.tier ?? 1) + 1) as ItemTier;
    const requiredLevel = TIER_LEVEL_RANGE[nextTier].min;
    if (playerLevelRef.current < requiredLevel) {
      log(`Нужен ${requiredLevel} уровень для тира T${nextTier}.`);
      showGateNotif(`🔒 Нужен ${requiredLevel} уровень для тира T${nextTier}`);
      return;
    }

    const res = promoteItemTier(item, inventoryRef.current, playerGoldRef.current, false);
    if (!res.ok) { log(res.reason); return; }

    inventoryRef.current = res.inventory;
    setInventory(res.inventory);
    playerGoldRef.current = res.gold;
    setPlayerGold(res.gold);
    log(res.msg);

    const newEquipment: Equipment = { ...equipmentRef.current, [slot]: res.item };
    applyEquipmentUpdate(newEquipment);
  }, [log, showGateNotif, applyEquipmentUpdate]);

  // ── EnchantPanel: apply enchant (bag / equipped) ─────────────────────────
  const handleEnchantInv = useCallback((itemId: string, enchantId: string) => {
    const item = inventoryRef.current.find(i => i.id === itemId);
    if (!item) return;

    const res = applyEnchant(item, enchantId, inventoryRef.current, playerGoldRef.current, true);
    if (!res.ok) { log(res.reason); return; }

    inventoryRef.current = res.inventory;
    setInventory(res.inventory);
    playerGoldRef.current = res.gold;
    setPlayerGold(res.gold);
    log(res.msg);
  }, [log]);

  const handleEnchantEq = useCallback((slot: string, enchantId: string) => {
    const item = equipmentRef.current[slot as keyof Equipment];
    if (!item) return;

    const res = applyEnchant(item, enchantId, inventoryRef.current, playerGoldRef.current, false);
    if (!res.ok) { log(res.reason); return; }

    inventoryRef.current = res.inventory;
    setInventory(res.inventory);
    playerGoldRef.current = res.gold;
    setPlayerGold(res.gold);
    log(res.msg);

    const newEquipment: Equipment = { ...equipmentRef.current, [slot]: res.item };
    applyEquipmentUpdate(newEquipment);
  }, [log, applyEquipmentUpdate]);

  return {
    handleCraft, handleLearn,
    handleUpgradeInv, handleUpgradeEq,
    handleTierPromoteInv, handleTierPromoteEq,
    handleEnchantInv, handleEnchantEq,
    applyEquipmentUpdate,
  };
}
