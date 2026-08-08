import { useEffect, useRef } from 'react';
import { saveGame, SaveData } from '../save';

type SaveablePlayerState = Omit<SaveData, 'version'>;

/**
 * Auto-save on meaningful state change.
 * Optional `onSaved` — e.g. show a brief "Сохранено" toast in App.
 */
export function usePersistence(
  state: SaveablePlayerState,
  onSaved?: () => void,
): void {
  const hasMountedRef = useRef(false);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    saveGame(state);
    onSavedRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.playerLevel, state.playerXp, state.xpToNext, state.playerGold,
    state.playerBonusDmg, state.levelHpBonus, state.levelMpBonus,
    state.playerHp, state.playerMaxHp, state.playerMp, state.playerMaxMp, state.stats, state.statPoints,
    state.inventory, state.equipment, state.equipBonuses,
    state.playerPos, state.currentLocation, state.enemies,
    state.questProgress, state.skillProgress, state.skillPoints,
    state.bossState, state.exploredTiles, state.openedChests,
    state.unlockedRecipes, state.classState, state.masteryState,
  ]);
}
