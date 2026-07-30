// ─── NPC DIALOGUE ─────────────────────────────────────────────────────────────
import type { QuestProgress } from './quests';
import { getQuestEntry, QUEST_DEFS } from './quests';

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
      buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
    };
  }
  return {
    ...base,
    lines: [
      'Благодарю тебя, герой.',
      'Дубовая Долина в безопасности благодаря тебе.',
    ],
    buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
  };
}

function farmerDialogue(_p: QuestProgress): NpcDialogue {
  return {
    npcId: 'farmer', name: 'Фермер', emoji: '👨',
    lines: [
      'Здорово, путник. Я обрабатываю эти поля.',
      'Дорога на восток — к заброшенному тракту, там разбойники.',
      'На севере Тёмный лес. Туда лучше с оружием.',
    ],
    buttons: [{ label: 'Понял, спасибо', action: { kind: 'dismiss' }, primary: true }],
  };
}

function hunterDialogue(_p: QuestProgress): NpcDialogue {
  return {
    npcId: 'hunter', name: 'Охотник', emoji: '🏹',
    lines: [
      'Тише… В этом лесу полно волков и гоблинов.',
      'На востоке — волчья пещера. Альфа-волк не любит гостей.',
      'На севере холодные пики, на западе — гнилые болота.',
      'Бандиты разбили лагерь у перекрёстка. Осторожнее.',
    ],
    buttons: [{ label: 'Спасибо за совет', action: { kind: 'dismiss' }, primary: true }],
  };
}

function hermitDialogue(_p: QuestProgress): NpcDialogue {
  return {
    npcId: 'hermit', name: 'Отшельник', emoji: '🧙',
    lines: [
      'Мало кто доходит до этих пиков живым.',
      'Йети бродят по склонам. Огонь — их слабость.',
      'Дальше на север — Ледяная крепость. Там служат холоду.',
    ],
    buttons: [{ label: 'Понял', action: { kind: 'dismiss' }, primary: true }],
  };
}

function scoutDialogue(_p: QuestProgress): NpcDialogue {
  return {
    npcId: 'scout', name: 'Разведчик', emoji: '🕵️',
    lines: [
      'Эта дорога давно не охраняется.',
      'Разбойники берут пошлину с путников — силой.',
      'Дальше на восток — древние руины. Оттуда веет могильным холодом.',
    ],
    buttons: [{ label: 'Уйти', action: { kind: 'dismiss' }, primary: true }],
  };
}

export function getNpcDialogue(
  npcId:    string,
  progress: QuestProgress,
): NpcDialogue | null {
  if (npcId === 'elder')  return elderDialogue(progress);
  if (npcId === 'farmer') return farmerDialogue(progress);
  if (npcId === 'hunter') return hunterDialogue(progress);
  if (npcId === 'hermit') return hermitDialogue(progress);
  if (npcId === 'scout')  return scoutDialogue(progress);
  return null;
}
