export type FloatingNum = {
  id: number;
  value: string;
  col: number;
  row: number;
  type: 'player-dmg' | 'enemy-dmg' | 'heal';
  timestamp: number;
};

export type LogEntry = {
  id: number;
  msg: string;
};