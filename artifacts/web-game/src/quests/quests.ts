// ─── QUEST SYSTEM ─────────────────────────────────────────────────────────────

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
