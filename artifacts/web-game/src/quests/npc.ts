// ─── NPC DIALOGUE ─────────────────────────────────────────────────────────────
import type { QuestProgress } from './quests';
import { getQuestEntry, QUEST_DEFS } from './quests';

// ── Dialogue types ────────────────────────────────────────────────────────────
export type DialogAction =
  | { kind: 'accept_quest';   questId: string }
  | { kind: 'complete_quest'; questId: string }
  | { kind: 'dismiss' };

export interface DialogButton {
  label:    string;
  action:   DialogAction;
  primary?: boolean;
}

export interface NpcDialogue {
  npcId:   string;
  name:    string;
  emoji:   string;
  lines:   string[];
  buttons: DialogButton[];
}

// ── Village Elder (Староста) ─────────────────────────────────────────────────
function elderDialogue(progress: QuestProgress): NpcDialogue {
  const QUEST_ID = 'quest_goblin_001';
  const def      = QUEST_DEFS[QUEST_ID];
  const entry    = getQuestEntry(progress, QUEST_ID);
  const base     = { npcId: 'elder', name: 'Староста', emoji: '👴' };

  if (entry.status === 'inactive') {
    return {
      ...base,
      lines: [
        'Добро пожаловать в Дубовую Долину, путник.',
        'Тихие поля стали опаснее обычного.',
        'Можешь ли ты расчистить путь — убить 5 крыс или кабанов?',
      ],
      buttons: [
        { label: '✅ Принять задание', action: { kind: 'accept_quest', questId: QUEST_ID }, primary: true },
        { label: 'Уйти',               action: { kind: 'dismiss' } },
      ],
    };
  }

  if (entry.status === 'active') {
    const required = def.objective.required;
    if (entry.current >= required) {
      return {
        ...base,
        lines: [
          'Ты сделал это, герой!',
          `Все ${required} тварей повержены.`,
          'Возьми свою заслуженную награду.',
        ],
        buttons: [
          { label: '🏆 Получить награду', action: { kind: 'complete_quest', questId: QUEST_ID }, primary: true },
          { label: 'Уйти',                action: { kind: 'dismiss' } },
        ],
      };
    }
    return {
      ...base,
      lines: [
        'Удачи тебе, герой.',
        'На полях рыщут крысы и кабаны.',
        `Прогресс: ${entry.current} / ${required}`,
      ],
      buttons: [
        { label: 'Уйти', action: { kind: 'dismiss' } },
      ],
    };
  }

  // completed — reward already claimed
  return {
    ...base,
    lines: [
      'Благодарю тебя, герой.',
      'Дубовая Долина в безопасности благодаря тебе.',
    ],
    buttons: [
      { label: 'Уйти', action: { kind: 'dismiss' } },
    ],
  };
}

/** Route NPC id → dialogue builder. Returns null for NPCs with no quest dialogue. */
export function getNpcDialogue(
  npcId:    string,
  progress: QuestProgress,
): NpcDialogue | null {
  if (npcId === 'elder') return elderDialogue(progress);
  return null;
}
