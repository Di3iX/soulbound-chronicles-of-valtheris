import { useEffect, useRef } from 'react';
import { saveGame, SaveData } from '../save';

type SaveablePlayerState = Omit<SaveData, 'version'>;

/**
 * Auto-save: immediate write on any meaningful state change.
 *
 * Rules:
 *   1. Skip the very first render — nothing has changed yet, and we must not
 *      write an empty/default player over a just-loaded save.
 *   2. After mount, every dependency change (XP, gold, HP, position, level,
 *      inventory, equipment …) triggers an immediate localStorage write so the
 *      save is always current. No debounce means no pending timeout that a
 *      page refresh could cancel.
 */
export function usePersistence(state: SaveablePlayerState): void {
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return; // first render — load path already handled by the sv initializer in App
    }
    saveGame(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.playerLevel, state.playerXp, state.xpToNext, state.playerGold,
    state.playerBonusDmg, state.levelHpBonus,
    state.playerHp, state.playerMaxHp, state.stats, state.statPoints,
    state.inventory, state.equipment, state.equipBonuses,
    state.playerPos, state.currentLocation, state.enemies,
    state.questProgress, state.skillProgress, state.skillPoints,
  ]);
}