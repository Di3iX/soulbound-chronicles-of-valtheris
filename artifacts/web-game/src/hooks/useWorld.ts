import { useCallback } from 'react';
import { LocationId } from '../world/locations';
import { Enemy, makeLocationEnemies, LOCATION_SPAWN } from '../world/locations';
import { Phase } from '../combat';

interface LocationTransitionParams {
  to: LocationId;
  spawnAt: { x: number; y: number };
  onTransitionStart: () => void;
  onTransitionComplete: (
    location: LocationId,
    enemies: Enemy[],
    playerPos: { x: number; y: number }
  ) => void;
}

interface ResetMapParams {
  currentLocation: LocationId;
  playerMaxHp: number;
  playerLevel: number;
  playerGold: number;
  onReset: (
    enemies: Enemy[],
    playerPos: { x: number; y: number },
    playerHp: number
  ) => void;
}

/**
 * Хук для управления переходами между локациями
 */
export function useWorld() {
  const prepareLocationTransition = useCallback(
    (params: LocationTransitionParams) => {
      const { to, spawnAt, onTransitionStart, onTransitionComplete } = params;

      onTransitionStart();

      // 800ms transition delay
      setTimeout(() => {
        const fresh = makeLocationEnemies(to);
        onTransitionComplete(to, fresh, spawnAt);
      }, 800);
    },
    []
  );

  const resetCurrentMap = useCallback((params: ResetMapParams) => {
    const { currentLocation, playerMaxHp, onReset } = params;

    const fresh = makeLocationEnemies(currentLocation);
    const spawn = LOCATION_SPAWN[currentLocation];
    const fullHp = playerMaxHp;

    onReset(fresh, spawn, fullHp);
  }, []);

  const getLocationSpawn = useCallback((locationId: LocationId) => {
    return LOCATION_SPAWN[locationId];
  }, []);

  return {
    prepareLocationTransition,
    resetCurrentMap,
    getLocationSpawn,
  };
}
