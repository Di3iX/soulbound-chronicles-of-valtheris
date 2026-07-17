// ─── QUEST SYSTEM ─────────────────────────────────────────────────────────────

export type QuestStatus = 'inactive' | 'active' | 'completed';

// ── Quest definition (static catalogue data) ─────────────────────────────────
export interface QuestDef {
  id:          string;
  title:       string;
  description: string;
  /** ID of the NPC that gives and completes this quest. */
  npcId:       string;
  objective:   { description: string; required: number };
  reward:      { gold: number; xp: number; items?: string[] };
}

// ── Quest runtime entry (mutable progress per save) ───────────────────────────
export interface QuestEntry {
  status:  QuestStatus;
  current: number;
}

/** Keyed by quest ID. Stored in the save file. */
export type QuestProgress = Record<string, QuestEntry>;

// ── Quest catalogue ───────────────────────────────────────────────────────────
export const QUEST_DEFS: Record<string, QuestDef> = {
  quest_goblin_001: {
    id:          'quest_goblin_001',
    title:       'Гоблинская угроза',
    description: 'Лес стал опасным. Уничтожьте 5 гоблинов, чтобы защитить деревню.',
    npcId:       'elder',
    objective:   { description: 'Убить гоблинов', required: 5 },
    reward:      { gold: 100, xp: 150, items: ['rusty_sword'] },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the current entry for a quest, defaulting to inactive / 0. */
export function getQuestEntry(
  progress: QuestProgress,
  questId:  string,
): QuestEntry {
  return progress[questId] ?? { status: 'inactive', current: 0 };
}

/** True when objectives are fully met and the reward hasn't been claimed yet. */
export function isReadyToComplete(
  progress: QuestProgress,
  questId:  string,
): boolean {
  const def   = QUEST_DEFS[questId];
  const entry = getQuestEntry(progress, questId);
  return !!def && entry.status === 'active' && entry.current >= def.objective.required;
}
