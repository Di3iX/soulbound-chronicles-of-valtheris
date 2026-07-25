import { useCallback } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import { Item } from '../inventory';
import { Equipment, EquipBonuses } from '../equipment';
import { BaseStats, computeStats } from '../stats';
import { SHOP_BUY_PRICE, sellPrice, CONSUMABLE_HEAL } from '../shop/shop';
import { ALL_SKILLS_MAP } from '../skills/skills';
import { SkillProgress, SkillBonuses, calcSkillBonuses } from '../skills/skillTree';
import { FloatingNum } from '../types/ui';

export interface EconomyCtx {
  playerGoldRef:     MutableRefObject<number>;
  inventoryRef:      MutableRefObject<Item[]>;
  equipmentRef:      MutableRefObject<Equipment>;
  equipBonusesRef:   MutableRefObject<EquipBonuses>;
  playerHpRef:       MutableRefObject<number>;
  playerMaxHpRef:    MutableRefObject<number>;
  playerPosRef:      MutableRefObject<{ x: number; y: number }>;
  skillProgressRef:  MutableRefObject<SkillProgress>;
  skillPointsRef:    MutableRefObject<number>;
  skillBonusesRef:   MutableRefObject<SkillBonuses>;
  statsRef:          MutableRefObject<BaseStats>;
  levelHpBonusRef:   MutableRefObject<number>;
  playerBonusDmgRef: MutableRefObject<number>;

  setPlayerGold:    (v: number) => void;
  setInventory:     Dispatch<SetStateAction<Item[]>>;
  setPlayerHp:      (v: number) => void;
  setSelectedItem:  (v: Item | null) => void;
  setSkillProgress: (v: SkillProgress) => void;
  setSkillPoints:   Dispatch<SetStateAction<number>>;
  setPlayerMaxHp:   (v: number) => void;

  log: (msg: string) => void;
  spawnFloat: (value: string, col: number, row: number, type: FloatingNum['type']) => void;
}

/**
 * Shop buying/selling, consumable use, and skill-point spending — grouped
 * together as "spend a resource, get an effect" actions. Moved verbatim out
 * of App.tsx.
 */
export function useEconomy(ctx: EconomyCtx) {
  const {
    playerGoldRef, inventoryRef, equipmentRef, equipBonusesRef, playerHpRef, playerMaxHpRef,
    playerPosRef, skillProgressRef, skillPointsRef, skillBonusesRef, statsRef,
    levelHpBonusRef, playerBonusDmgRef,
    setPlayerGold, setInventory, setPlayerHp, setSelectedItem, setSkillProgress,
    setSkillPoints, setPlayerMaxHp,
    log, spawnFloat,
  } = ctx;

  // ── Shop: buy ────────────────────────────────────────────────────────────
  const handleShopBuy = useCallback((key: string) => {
    const price = SHOP_BUY_PRICE[key];
    if (price === undefined) return;
    if (playerGoldRef.current < price) {
      log('💰 Недостаточно золота!');
      return;
    }
    const item = makeItem(key);
    playerGoldRef.current -= price;
    setPlayerGold(playerGoldRef.current);
    inventoryRef.current = [...inventoryRef.current, item];
    setInventory(prev => [...prev, item]);
    log(`🛒 Куплено: ${item.name} за ${price}💰`);
  }, [log]);

  // ── Shop: sell ───────────────────────────────────────────────────────────
  const handleShopSell = useCallback((itemId: string) => {
    const item = inventoryRef.current.find(i => i.id === itemId);
    if (!item) return;
    if (Object.values(equipmentRef.current).some(eq => eq?.id === itemId)) {
      log('Нельзя продать надетый предмет!');
      return;
    }
    const price = sellPrice(item);
    inventoryRef.current = inventoryRef.current.filter(i => i.id !== itemId);
    setInventory(prev => prev.filter(i => i.id !== itemId));
    playerGoldRef.current += price;
    setPlayerGold(playerGoldRef.current);
    log(`💸 Продано: ${item.name} за ${price}💰`);
  }, [log]);

  // ── Consumable: use ───────────────────────────────────────────────────────
  const handleUseItem = useCallback((item: Item) => {
    const healAmt = CONSUMABLE_HEAL[item.key];
    if (!healAmt) return;
    const currentHp = playerHpRef.current;
    const maxHp     = playerMaxHpRef.current;
    if (currentHp >= maxHp) { log('❤️ HP уже максимально!'); return; }
    const newHp  = Math.min(maxHp, currentHp + healAmt);
    const healed = newHp - currentHp;
    playerHpRef.current = newHp;
    setPlayerHp(newHp);
    inventoryRef.current = inventoryRef.current.filter(i => i.id !== item.id);
    setInventory(prev => prev.filter(i => i.id !== item.id));
    setSelectedItem(null);
    log(`🧪 Использовано ${item.name}: +${healed} HP!`);
    spawnFloat(`+${healed}`, playerPosRef.current.x, playerPosRef.current.y, 'heal');
  }, [log, spawnFloat]);

  // ── Skill upgrade ─────────────────────────────────────────────────────────
  const handleUpgradeSkill = useCallback((skillId: string) => {
    const def = ALL_SKILLS_MAP[skillId];
    if (!def) return;
    const current = skillProgressRef.current[skillId] ?? 0;
    if (current >= def.maxLevel) return;
    if (skillPointsRef.current <= 0) return;

    const newLevel       = current + 1;
    const newProgress: SkillProgress = { ...skillProgressRef.current, [skillId]: newLevel };
    skillProgressRef.current = newProgress;
    setSkillProgress(newProgress);

    skillPointsRef.current -= 1;
    setSkillPoints(p => p - 1);

    const newBonuses = calcSkillBonuses(newProgress);
    skillBonusesRef.current = newBonuses;

    // Iron Skin — recalculate max HP immediately
    if (skillId === 'iron_skin') {
      const newMaxHp = computeStats({
        base: statsRef.current, levelHpBonus: levelHpBonusRef.current,
        bonusDmg: playerBonusDmgRef.current, equip: equipBonusesRef.current,
        skills: newBonuses,
      }).maxHp;
      playerMaxHpRef.current = newMaxHp;
      setPlayerMaxHp(newMaxHp);
    }

    log(`⬆️ ${def.name}: уровень ${newLevel}`);
  }, [log]);

  return { handleShopBuy, handleShopSell, handleUseItem, handleUpgradeSkill };
}
