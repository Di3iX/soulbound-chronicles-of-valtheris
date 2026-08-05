export type FloatingNumType =
  | 'player-dmg'
  | 'enemy-dmg'
  | 'heal'
  | 'xp'
  | 'gold'
  | 'loot'
  | 'level';

export type FloatingNum = {
  id: number;
  value: string;
  col: number;
  row: number;
  type: FloatingNumType;
  timestamp: number;
};

export type LogEntry = {
  id: number;
  msg: string;
};
