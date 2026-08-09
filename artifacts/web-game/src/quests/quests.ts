// ─── QUEST SYSTEM ─────────────────────────────────────────────────────────────
import { TRIAL_QUEST_DEFS } from '../classes/trials';

export type QuestStatus = 'inactive' | 'active' | 'completed';

export interface QuestDef {
  id:          string;
  title:       string;
  description: string;
  /** ID of the NPC that gives and completes this quest. */
  npcId:       string;
  objective:   { description: string; required: number };
  /** Enemy names that count toward this quest (any of them). */
  killTargets: string[];
  reward:      { gold: number; xp: number; items?: string[] };
  /** Optional: another quest that must be completed before this can be offered. */
  requiresQuest?: string;
  /** Turn in these items to complete (checked at NPC). */
  deliverItems?: { key: string; count: number };
}

export interface QuestEntry {
  status:  QuestStatus;
  current: number;
}

export type QuestProgress = Record<string, QuestEntry>;

export const QUEST_DEFS: Record<string, QuestDef> = {
  quest_fields_001: {
    id:          'quest_fields_001',
    title:       'Чума на полях',
    description: 'Фермер просит избавить поля от крыс и молодых кабанов.',
    npcId:       'farmer',
    objective:   { description: 'Убить крыс или молодых кабанов', required: 5 },
    killTargets: ['Крыса', 'Молодой кабан'],
    reward:      { gold: 40, xp: 60, items: ['healing_potion'] },
  },
  quest_crystal_001: {
    id:          'quest_crystal_001',
    title:       'Чёрные кристаллы',
    description: 'Староста просит убить Огромного Кабана — тварь, возле которой находят чёрные кристаллы.',
    npcId:       'elder',
    objective:   { description: 'Убить Огромного Кабана (мини-босс на полях)', required: 1 },
    killTargets: ['Огромный Кабан'],
    reward:      { gold: 80, xp: 100, items: ['greater_healing_potion'] },
    requiresQuest: 'quest_fields_001',
  },
  quest_goblin_001: {
    id:          'quest_goblin_001',
    title:       'Тень леса',
    description: 'Староста просит разобраться с гоблинами в Тёмном лесу.',
    npcId:       'elder',
    objective:   { description: 'Убить гоблинов', required: 5 },
    killTargets: ['Гоблин'],
    reward:      { gold: 100, xp: 150, items: ['rusty_sword'] },
    requiresQuest: 'quest_crystal_001',
  },
  quest_chief_001: {
    id:          'quest_chief_001',
    title:       'Главарь в пещере',
    description: 'Староста просит сразить Главаря гоблинов в Волчьей пещере.',
    npcId:       'elder',
    objective:   { description: 'Победить Главаря гоблинов', required: 1 },
    killTargets: ['Главарь гоблинов'],
    reward:      { gold: 200, xp: 250, items: ['greater_healing_potion'] },
    requiresQuest: 'quest_goblin_001',
  },
  quest_shards_001: {
    id:          'quest_shards_001',
    title:       'Осколки Тьмы',
    description: 'Староста просит принести 3 чёрных кристалла с полей и из леса.',
    npcId:       'elder',
    objective:   { description: 'Принести 3 чёрных кристалла', required: 3 },
    killTargets: [],
    reward:      { gold: 150, xp: 180, items: ['greater_mana_potion'] },
    requiresQuest: 'quest_chief_001',
    deliverItems: { key: 'black_crystal', count: 3 },
  },
  quest_ruins_001: {
    id:          'quest_ruins_001',
    title:       'Эхо руин',
    description: 'Староста просит разведать Древние руины и сразить нежить.',
    npcId:       'elder',
    objective:   { description: 'Убить скелетов или зомби в руинах', required: 5 },
    killTargets: ['Скелет', 'Зомби', 'Призрак', 'Хранитель склепа'],
    reward:      { gold: 250, xp: 300, items: ['greater_healing_potion', 'silver_ring'] },
    requiresQuest: 'quest_shards_001',
  },
  quest_swamp_001: {
    id:          'quest_swamp_001',
    title:       'Тление болот',
    description: 'Староста просит разведать Гнилые болота и истребить порчу.',
    npcId:       'elder',
    objective:   { description: 'Убить слизней, болотников или ядовитых пауков', required: 5 },
    killTargets: ['Слизень', 'Болотник', 'Ядовитый паук', 'Трясинный ужас'],
    reward:      { gold: 300, xp: 350, items: ['greater_healing_potion', 'greater_mana_potion'] },
    requiresQuest: 'quest_ruins_001',
  },
  quest_mine_001: {
    id:          'quest_mine_001',
    title:       'Глубины шахты',
    description: 'Староста просит разведать Заброшенную шахту и истребить нежить и големов.',
    npcId:       'elder',
    objective:   { description: 'Убить врагов в шахте', required: 5 },
    killTargets: ['Голем', 'Летучая мышь', 'Шахтёр-зомби', 'Каменный страж'],
    reward:      { gold: 400, xp: 450, items: ['greater_healing_potion', 'iron_helm'] },
    requiresQuest: 'quest_swamp_001',
  },
  quest_pass_001: {
    id:          'quest_pass_001',
    title:       'Каменный перевал',
    description: 'Староста просит очистить Каменный перевал от горных тварей.',
    npcId:       'elder',
    objective:   { description: 'Убить врагов на перевале', required: 5 },
    killTargets: ['Горный тролль', 'Гарпия', 'Голем', 'Владыка перевала'],
    reward:      { gold: 500, xp: 550, items: ['greater_healing_potion', 'plate_armor'] },
    requiresQuest: 'quest_mine_001',
  },
  quest_ice_001: {
    id:          'quest_ice_001',
    title:       'Ледяная крепость',
    description: 'Староста просит войти в Ледяную крепость и сразить стражей холода.',
    npcId:       'elder',
    objective:   { description: 'Убить врагов в крепости', required: 5 },
    killTargets: ['Рыцарь льда', 'Маг льда', 'Йети', 'Ледяной волк', 'Король льда'],
    reward:      { gold: 700, xp: 800, items: ['greater_healing_potion', 'greater_mana_potion'] },
    requiresQuest: 'quest_pass_001',
  },
  quest_yeti_001: {
    id:          'quest_yeti_001',
    title:       'Шёпот пиков',
    description: 'Отшельник просит проредить йети на Ледяных пиках.',
    npcId:       'hermit',
    objective:   { description: 'Убить йети или ледяных волков', required: 4 },
    killTargets: ['Йети', 'Ледяной волк'],
    reward:      { gold: 280, xp: 320, items: ['greater_mana_potion'] },
  },
  quest_epilogue_001: {
    id:          'quest_epilogue_001',
    title:       'Осколки Печати',
    description: 'После падения Короля льда староста просит собрать отголоски Бездны — чёрные кристаллы.',
    npcId:       'elder',
    objective:   { description: 'Сдать чёрные кристаллы старосте', required: 5 },
    killTargets: [],
    reward:      { gold: 500, xp: 600, items: ['greater_healing_potion', 'greater_mana_potion'] },
    requiresQuest: 'quest_ice_001',
    deliverItems: { key: 'black_crystal', count: 5 },
  },
  quest_wolf_001: {
    id:          'quest_wolf_001',
    title:       'Охота на волков',
    description: 'Охотник просит шкуры — убейте волков в Тёмном лесу или пещере.',
    npcId:       'hunter',
    objective:   { description: 'Убить волков', required: 4 },
    killTargets: ['Волк', 'Альфа-волк', 'Ледяной волк'],
    reward:      { gold: 80, xp: 120, items: ['leather_armor'] },
  },
  quest_bandit_001: {
    id:          'quest_bandit_001',
    title:       'Чистая дорога',
    description: 'Разведчик просит очистить тракт от разбойников.',
    npcId:       'scout',
    objective:   { description: 'Убить разбойников или наёмников', required: 4 },
    killTargets: ['Разбойник', 'Наёмник', 'Бандит'],
    reward:      { gold: 120, xp: 160, items: ['iron_sword'] },
  },
};

// Испытания 20/40 (см. STEP5_APP.md) — квесты с npcId: 'elder', killTargets
// подхватываются trackKillForQuests автоматически, т.к. он читает QUEST_DEFS.
// TRIAL_QUEST_DEFS импортируется только значением (не типом) — trials.ts берёт
// у нас только типы QuestDef/QuestProgress, циклической зависимости в рантайме нет.
Object.assign(QUEST_DEFS, TRIAL_QUEST_DEFS);

export function getQuestEntry(progress: QuestProgress, questId: string): QuestEntry {
  return progress[questId] ?? { status: 'inactive', current: 0 };
}

export function isQuestCompleted(progress: QuestProgress, questId: string): boolean {
  return getQuestEntry(progress, questId).status === 'completed';
}

export function canOfferQuest(progress: QuestProgress, questId: string): boolean {
  const def = QUEST_DEFS[questId];
  if (!def) return false;
  if (getQuestEntry(progress, questId).status !== 'inactive') return false;
  if (def.requiresQuest && !isQuestCompleted(progress, def.requiresQuest)) return false;
  return true;
}

export function isReadyToComplete(progress: QuestProgress, questId: string): boolean {
  const def   = QUEST_DEFS[questId];
  const entry = getQuestEntry(progress, questId);
  return !!def && entry.status === 'active' && entry.current >= def.objective.required;
}

/** Advance all active quests whose killTargets include this enemy name. */
export function trackKillForQuests(
  progress: QuestProgress,
  enemyName: string,
): { progress: QuestProgress; logs: string[] } {
  const logs: string[] = [];
  let next = progress;
  let changed = false;

  for (const def of Object.values(QUEST_DEFS)) {
    if (!def.killTargets.includes(enemyName)) continue;
    const entry = next[def.id] ?? { status: 'inactive' as const, current: 0 };
    if (entry.status !== 'active' || entry.current >= def.objective.required) continue;
    const newCurrent = entry.current + 1;
    next = { ...next, [def.id]: { status: 'active', current: newCurrent } };
    changed = true;
    logs.push(`📜 ${def.title}: ${newCurrent} / ${def.objective.required}`);
    if (newCurrent >= def.objective.required) {
      logs.push(`✅ Цель «${def.title}» выполнена! Вернитесь к NPC.`);
    }
  }

  return { progress: changed ? next : progress, logs };
}

/** Active quests for HUD tracker (max few). */
export function getActiveQuests(progress: QuestProgress): {
  id: string;
  title: string;
  current: number;
  required: number;
  ready: boolean;
}[] {
  const out: {
    id: string;
    title: string;
    current: number;
    required: number;
    ready: boolean;
  }[] = [];
  for (const def of Object.values(QUEST_DEFS)) {
    const e = getQuestEntry(progress, def.id);
    if (e.status !== 'active') continue;
    out.push({
      id: def.id,
      title: def.title,
      current: e.current,
      required: def.objective.required,
      ready: e.current >= def.objective.required,
    });
  }
  return out;
}


// ─── DAILY QUESTS ─────────────────────────────────────────────────────────────
const DAILY_POOL = [
  {
    id: 'daily_rats',
    title: 'Ежедневно: Крысы',
    description: 'Фермер просит проредить крыс на полях.',
    npcId: 'farmer',
    objective: { description: 'Убить крыс', required: 8 },
    killTargets: ['Крыса'],
    reward: { gold: 40, xp: 50 },
  },
  {
    id: 'daily_wolves',
    title: 'Ежедневно: Волки',
    description: 'Охотник просит шкуры — волки у леса.',
    npcId: 'hunter',
    objective: { description: 'Убить волков', required: 5 },
    killTargets: ['Волк', 'Альфа-волк', 'Ледяной волк'],
    reward: { gold: 70, xp: 90 },
  },
  {
    id: 'daily_goblins',
    title: 'Ежедневно: Гоблины',
    description: 'Староста просит приглушить гоблинов в лесу.',
    npcId: 'elder',
    objective: { description: 'Убить гоблинов', required: 6 },
    killTargets: ['Гоблин'],
    reward: { gold: 80, xp: 100 },
  },
  {
    id: 'daily_bandits',
    title: 'Ежедневно: Разбойники',
    description: 'Разведчик: очисти дорогу от разбойников.',
    npcId: 'scout',
    objective: { description: 'Убить разбойников', required: 5 },
    killTargets: ['Разбойник', 'Лучник', 'Наёмник'],
    reward: { gold: 90, xp: 110 },
  },
] as const;

function daySeed(d = new Date()): number {
  const s = d.toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getDailyQuestDef(d = new Date()) {
  const pool = DAILY_POOL;
  const idx = daySeed(d) % pool.length;
  const base = pool[idx];
  return {
    ...base,
    id: `daily_${base.id}_${d.toISOString().slice(0, 10)}`,
  };
}

/** Ensure today's daily exists in QUEST_DEFS + progress inactive if new day. */
export function ensureDailyQuest(
  progress: QuestProgress,
  d = new Date(),
): { progress: QuestProgress; def: ReturnType<typeof getDailyQuestDef> } {
  const def = getDailyQuestDef(d);
  // register in QUEST_DEFS dynamically
  if (!QUEST_DEFS[def.id]) {
    (QUEST_DEFS as Record<string, QuestDef>)[def.id] = {
      id: def.id,
      title: def.title,
      description: def.description,
      npcId: def.npcId,
      objective: { ...def.objective },
      killTargets: [...def.killTargets],
      reward: { ...def.reward },
    };
  }
  if (!progress[def.id]) {
    return {
      progress: { ...progress, [def.id]: { status: 'inactive', current: 0 } },
      def,
    };
  }
  return { progress, def };
}
