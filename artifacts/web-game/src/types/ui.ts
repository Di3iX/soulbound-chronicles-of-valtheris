export type FloatingNum = {
  id: number;
  value: string;
  col: number;
  row: number;
  type: 'player-dmg' | 'enemy-dmg' | 'heal' | 'gold' | 'loot' | 'xp' | 'level';
  timestamp: number;
};

export type LogEntry = {
  id: number;
  msg: string;
};