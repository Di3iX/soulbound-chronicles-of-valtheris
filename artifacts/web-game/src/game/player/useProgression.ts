import { useState } from 'react';
import { xpRequired } from '../combat';
import type { ProgressionState } from './types';
import type { KillReward } from '../combat';

const INITIAL_PLAYER_LVL = 1; // позже перенесём в constants

export function useProgression(saved?: Partial<ProgressionState>) {
  const [progression, setProgression] = useState<ProgressionState>({
    level: saved?.level ?? INITIAL_PLAYER_LVL,
    xp: saved?.xp ?? 0,
    xpToNext: saved?.xpToNext ?? xpRequired(INITIAL_PLAYER_LVL),
    gold: saved?.gold ?? 0,
    bonusDamage: saved?.bonusDamage ?? 0,
    levelHpBonus: saved?.levelHpBonus ?? 0,
    lastKillReward: saved?.lastKillReward ?? null,
  });

  return {
    progression,
    setProgression,
  };
}
