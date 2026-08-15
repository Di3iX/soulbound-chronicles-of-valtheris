// ─── QUEST ACTIONS (dialogue action dispatch + NPC interact) ──────────────────
// Extracted from App.tsx: everything triggered by a button inside an NPC
// dialogue box (heal, craft, accept/complete quest, open a sub-panel), plus
// the "Interact" button that opens that dialogue in the first place.
import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Item } from '../inventory';
import { ITEM_CATALOG, makeItem, addToInventory, removeFromInventoryByKey, countItemKey } from '../inventory';
import type { StatusEffect } from '../combat';
import type { QuestProgress } from '../quests/quests';
import { QUEST_DEFS } from '../quests/quests';
import { type NpcDialogue, type DialogAction, getNpcDialogue } from '../quests/npc';
import { CRAFT_RECIPES, craftItem } from '../items/craft';
import type { SkillBonuses } from '../skills/skillTree';
import { HEAL_COST, todayKey, loadHealState, getRecoverableXp } from '../game/healerState';

export interface QuestActionsCtx {
  inventoryRef:            MutableRefObject<Item[]>;
  playerGoldRef:           MutableRefObject<number>;
  playerHpRef:             MutableRefObject<number>;
  playerMaxHpRef:          MutableRefObject<number>;
  playerMpRef:             MutableRefObject<number>;
  playerMaxMpRef:          MutableRefObject<number>;
  playerStatusEffectsRef:  MutableRefObject<StatusEffect[]>;
  playerXpRef:             MutableRefObject<number>;
  questProgressRef:        MutableRefObject<QuestProgress>;
  skillBonusesRef:         MutableRefObject<SkillBonuses>;

  setQuestDialogue:       Dispatch<SetStateAction<NpcDialogue | null>>;
  setNpcDialog:           Dispatch<SetStateAction<string | null>>;
  setShowCraft:           Dispatch<SetStateAction<boolean>>;
  setShowUpgrade:         Dispatch<SetStateAction<boolean>>;
  setShowTier:             Dispatch<SetStateAction<boolean>>;
  setShowEnchant:          Dispatch<SetStateAction<boolean>>;
  setShowTrial:            Dispatch<SetStateAction<boolean>>;
  setPlayerGold:           Dispatch<SetStateAction<number>>;
  setPlayerHp:             Dispatch<SetStateAction<number>>;
  setPlayerMp:             Dispatch<SetStateAction<number>>;
  setPlayerStatusEffects:  Dispatch<SetStateAction<StatusEffect[]>>;
  setPlayerXp:             Dispatch<SetStateAction<number>>;
  setInventory:            Dispatch<SetStateAction<Item[]>>;
  setLootNotif:            Dispatch<SetStateAction<string | null>>;
  setQuestProgress:        Dispatch<SetStateAction<QuestProgress>>;

  log:     (msg: string) => void;
  grantXp: (xpGained: number) => void;
  openPanel: (key: 'shop') => void;
  buildDialogueFlags: (crystalCount: number) => Parameters<typeof getNpcDialogue>[2];
}

export function useQuestActions(ctx: QuestActionsCtx) {
  const {
    inventoryRef, playerGoldRef, playerHpRef, playerMaxHpRef, playerMpRef, playerMaxMpRef,
    playerStatusEffectsRef, playerXpRef, questProgressRef, skillBonusesRef,
    setQuestDialogue, setNpcDialog, setShowCraft, setShowUpgrade, setShowTier, setShowEnchant, setShowTrial,
    setPlayerGold, setPlayerHp, setPlayerMp, setPlayerStatusEffects, setPlayerXp,
    setInventory, setLootNotif, setQuestProgress,
    log, grantXp, openPanel, buildDialogueFlags,
  } = ctx;

  const handleQuestAction = useCallback((action: DialogAction) => {
    if (action.kind === 'dismiss') { setQuestDialogue(null); return; }

    if (action.kind === 'open_craft') {
      setQuestDialogue(null);
      setShowCraft(true);
      return;
    }

    if (action.kind === 'open_upgrade') {
      setQuestDialogue(null);
      setShowUpgrade(true);
      return;
    }

    if (action.kind === 'open_tier') {
      setQuestDialogue(null);
      setShowTier(true);
      return;
    }

    if (action.kind === 'open_enchant') {
      setQuestDialogue(null);
      setShowEnchant(true);
      return;
    }

    if (action.kind === 'open_trial') {
      setQuestDialogue(null);
      setShowTrial(true);
      return;
    }

    if (action.kind === 'heal') {
      let free = loadHealState();
      if (free <= 0) {
        if (playerGoldRef.current < HEAL_COST) {
          log('💰 Не хватает золота на лечение.');
          return;
        }
        playerGoldRef.current -= HEAL_COST;
        setPlayerGold(playerGoldRef.current);
        log(`💚 Лечение за ${HEAL_COST} золота.`);
      } else {
        free -= 1;
        localStorage.setItem('sb_free_heals', String(free));
        localStorage.setItem('sb_heal_day', todayKey());
        log(`💚 Бесплатное лечение. Осталось сегодня: ${free}`);
      }

      // Full HP/MP + clear effects
      playerHpRef.current = playerMaxHpRef.current;
      setPlayerHp(playerMaxHpRef.current);
      playerMpRef.current = playerMaxMpRef.current;
      setPlayerMp(playerMaxMpRef.current);
      playerStatusEffectsRef.current = [];
      setPlayerStatusEffects([]);

      // Restore death XP
      const rec = getRecoverableXp();
      if (rec > 0) {
        playerXpRef.current += rec;
        setPlayerXp(playerXpRef.current);
        sessionStorage.setItem('sb_recoverable_xp', '0');
        log(`✨ Лекарь вернул ${rec} опыта.`);
      }

      setQuestDialogue(null);
      return;
    }

    if (action.kind === 'craft') {
      const recipe = CRAFT_RECIPES.find(r => r.id === action.recipeId);
      if (!recipe) { setQuestDialogue(null); return; }
      const result = craftItem(recipe, inventoryRef.current);
      if (!result.ok) {
        log(`⚒️ ${result.reason}`);
        return;
      }
      inventoryRef.current = result.inventory;
      setInventory(result.inventory);
      setLootNotif(result.item.name);
      setTimeout(() => setLootNotif(null), 2500);
      log(`⚒️ Скрафчено: ${result.item.name}!`);
      // обновить диалог кузнеца (те же кнопки)
      const dlg = getNpcDialogue(
        'smith',
        questProgressRef.current,
        buildDialogueFlags(countItemKey(result.inventory, 'black_crystal')),
      );
      if (dlg) setQuestDialogue(dlg);
      return;
    }

    if (action.kind === 'accept_quest') {
      const updated: QuestProgress = {
        ...questProgressRef.current,
        [action.questId]: { status: 'active' as const, current: 0 },
      };
      questProgressRef.current = updated;
      setQuestProgress(updated);
      log(`📜 Задание принято: ${QUEST_DEFS[action.questId]?.title ?? action.questId}`);
      setQuestDialogue(null);
      return;
    }

    if (action.kind === 'complete_quest') {
      const def = QUEST_DEFS[action.questId];
      if (!def) { setQuestDialogue(null); return; }

      // ── Deliver items: consume from inventory (e.g. turn-in quests) ─────────
      if (def.deliverItems) {
        const { key, count } = def.deliverItems;
        if (countItemKey(inventoryRef.current, key) < count) {
          log('Не хватает предметов для сдачи!');
          return;
        }
        const nextInv = removeFromInventoryByKey(inventoryRef.current, key, count);
        inventoryRef.current = nextInv;
        setInventory(nextInv);
        log(`📦 Сдано: ${count} × ${ITEM_CATALOG[key]?.name ?? key}`);
      }

      // ── Gold reward ────────────────────────────────────────────────────────
      playerGoldRef.current += def.reward.gold;
      setPlayerGold(playerGoldRef.current);
      log(`💰 Награда: ${def.reward.gold} золота!`);

      // ── XP reward with level-up logic ──────────────────────────────────────
      const _questXp = Math.floor(def.reward.xp * (1 + skillBonusesRef.current.xpBonusPct / 100));
      grantXp(_questXp);
      log(`✨ Награда: ${_questXp} опыта!`);

      // ── Item rewards (only if not already owned) ───────────────────────────
      for (const itemKey of def.reward.items ?? []) {
        if (!inventoryRef.current.some(i => i.key === itemKey)) {
          const item = makeItem(itemKey);
          inventoryRef.current = addToInventory(inventoryRef.current, item);
          setInventory(prev => addToInventory(prev, item));
          log(`🎁 Получен предмет: ${item.name}!`);
        } else {
          log(`(У вас уже есть ${ITEM_CATALOG[itemKey]?.name ?? itemKey})`);
        }
      }

      // ── Mark completed ─────────────────────────────────────────────────────
      const updated: QuestProgress = {
        ...questProgressRef.current,
        [action.questId]: {
          status:  'completed' as const,
          current: questProgressRef.current[action.questId]?.current ?? 0,
        },
      };
      questProgressRef.current = updated;
      setQuestProgress(updated);
      log('🏆 Задание завершено!');
      setQuestDialogue(null);
    }
  }, [log, grantXp, buildDialogueFlags]);

  // ── NPC interact (called by the nearby-NPC Interact button) ──────────────
  const handleNpcInteract = useCallback((npc: { id: string; name: string; emoji: string }) => {
    // Merchant → open shop
    if (npc.id === 'merchant') {
      openPanel('shop');
      return;
    }
    // Quest NPCs or generic dialog
    const crystalCount = countItemKey(inventoryRef.current, 'black_crystal');
    const dlg = getNpcDialogue(npc.id, questProgressRef.current, buildDialogueFlags(crystalCount));
    if (dlg) { setQuestDialogue(dlg); }
    else { setNpcDialog(`${npc.emoji} ${npc.name}: «Скоро здесь будут квесты и торговля! Следите за обновлениями.»`); }
  }, [buildDialogueFlags, openPanel]);

  return { handleQuestAction, handleNpcInteract };
}
