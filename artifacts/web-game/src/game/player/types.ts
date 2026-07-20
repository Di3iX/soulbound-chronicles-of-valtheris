import type { KillReward } from '../combat';

export interface ProgressionState {
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  bonusDamage: number;
  levelHpBonus: number;
  lastKillReward: KillReward | null;
}
