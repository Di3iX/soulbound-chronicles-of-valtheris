import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SaveData } from '../save';
import { BaseStats, INITIAL_BASE_STATS, INITIAL_HP, computeStats, ComputedStats } from '../stats';
import { Equipment, EMPTY_EQUIPMENT, ZERO_EQUIP_BONUSES, calcEquipBonuses } from '../equipment';
import { Item } from '../inventory';
import { LocationId } from '../combat';
import { QuestProgress } from '../quests/quests';
import { SkillProgress, calcSkillBonuses } from '../skills/skillTree';
import { BossState, INITIAL_BOSS_STATE } from '../boss/boss';

interface GameState {
  playerLevel: number;
  playerXp: number;
  xpToNext: number;
  playerGold: number;
  playerHp: number;
  playerMaxHp: number;
  stats: BaseStats;
  statPoints: number;
  equipment: Equipment;
  equipBonuses: EquipBonuses;
  inventory: Item[];
  playerPos: { x: number; y: number };
  currentLocation: LocationId;
  playerBonusDmg: number;
  levelHpBonus: number;
  questProgress: QuestProgress;
  skillProgress: SkillProgress;
  skillPoints: number;
  bossState: BossState;
  computedStats: ComputedStats;
  skillBonuses: ReturnType<typeof calcSkillBonuses>;

  loadSave: (save: SaveData | null) => void;
  updatePlayerHp: (hp: number) => void;
  gainGold: (amount: number) => void;
  gainXp: (amount: number) => void;
  changeLocation: (loc: LocationId, pos: {x: number, y: number}) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // initial state...
      playerLevel: 1,
      playerXp: 0,
      xpToNext: 100,
      playerGold: 0,
      playerHp: INITIAL_HP + INITIAL_BASE_STATS.vitality * 10,
      playerMaxHp: INITIAL_HP + INITIAL_BASE_STATS.vitality * 10,
      stats: { ...INITIAL_BASE_STATS },
      statPoints: 0,
      equipment: { ...EMPTY_EQUIPMENT },
      equipBonuses: { ...ZERO_EQUIP_BONUSES },
      inventory: [],
      playerPos: { x: 5, y: 5 },
      currentLocation: 'village',
      playerBonusDmg: 0,
      levelHpBonus: 0,
      questProgress: {},
      skillProgress: {},
      skillPoints: 0,
      bossState: INITIAL_BOSS_STATE,
      computedStats: computeStats({ base: INITIAL_BASE_STATS, levelHpBonus: 0, bonusDmg: 0, equip: ZERO_EQUIP_BONUSES, skills: {} }),
      skillBonuses: {},

      loadSave: (save) => {
        if (!save) return;
        set({ ...save });
      },

      updatePlayerHp: (hp) => set({ playerHp: hp }),
      gainGold: (amount) => set((state) => ({ playerGold: state.playerGold + amount })),
      gainXp: (amount) => set((state) => ({ playerXp: state.playerXp + amount })),
      changeLocation: (loc, pos) => set({ currentLocation: loc, playerPos: pos }),
    }),
    { name: 'soulbound-save' }
  )
);