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

function questFlow(
  progress: QuestProgress,
  questId: string,
  base: { npcId: string; name: string; emoji: string },
  intro: string[],
  activeHint: string[],
  doneLines: string[],
): NpcDialogue {
  const def   = QUEST_DEFS[questId];
  const entry = getQuestEntry(progress, questId);

  if (entry.status === 'inactive') {
    return {
      ...base,
      lines: intro,
      buttons: [
        { label: '✅ Принять задание', action: { kind: 'accept_quest', questId }, primary: true },
        { label: 'Уйти', action: { kind: 'dismiss' } },
      ],
    };
  }
  if (entry.status === 'active') {
    const required = def.objective.required;
    if (entry.current >= required) {
      return {
        ...base,
        lines: [
          'Ты справился!',
          `Цель выполнена: ${entry.current} / ${required}.`,
          'Возьми награду.',
        ],
        buttons: [
          { label: '🏆 Получить награду', action: { kind: 'complete_quest', questId }, primary: true },
          { label: 'Уйти', action: { kind: 'dismiss' } },
        ],
      };
    }
    return {
      ...base,
      lines: [...activeHint, `Прогресс: ${entry.current} / ${required}`],
      buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
    };
  }
  return {
    ...base,
    lines: doneLines,
    buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
  };
}

function elderDialogue(progress: QuestProgress): NpcDialogue {
  return questFlow(
    progress,
    'quest_goblin_001',
    { npcId: 'elder', name: 'Староста', emoji: '👴' },
    [
      'Добро пожаловать в Дубовую Долину, путник.',
      'В Тёмном лесу расплодились гоблины.',
      'Убей 5 гоблинов — и деревня будет спокойнее.',
    ],
    ['Удачи. Гоблины живут в Тёмном лесу на севере от полей.'],
    ['Благодарю тебя. Долина помнит своих защитников.'],
  );
}

function farmerDialogue(progress: QuestProgress): NpcDialogue {
  return questFlow(
    progress,
    'quest_fields_001',
    { npcId: 'farmer', name: 'Фермер', emoji: '👨' },
    [
      'Здорово, путник. Крысы и кабаны портят урожай.',
      'Убей 5 крыс или молодых кабанов на этих полях.',
      'Награда будет скромная, но честная.',
    ],
    ['Они всё ещё рыщут по полям. Держись дороги.'],
    ['Спасибо! Теперь можно сеять спокойно.'],
  );
}

function hunterDialogue(progress: QuestProgress): NpcDialogue {
  return questFlow(
    progress,
    'quest_wolf_001',
    { npcId: 'hunter', name: 'Охотник', emoji: '🏹' },
    [
      'Тише… Мне нужны волчьи шкуры.',
      'Убей 4 волка — обычных, альфу или ледяных, без разницы.',
      'За это дам хорошую кожаную броню.',
    ],
    ['Волки в Тёмном лесу и в пещере на востоке.'],
    ['Отличная работа. Шкуры пригодятся зимой.'],
  );
}

function scoutDialogue(progress: QuestProgress): NpcDialogue {
  return questFlow(
    progress,
    'quest_bandit_001',
    { npcId: 'scout', name: 'Разведчик', emoji: '🕵️' },
    [
      'Эта дорога кишит разбойниками.',
      'Убери 4 разбойников или наёмников — путь станет безопаснее.',
    ],
    ['Они прячутся вдоль тракта. Не дай себя окружить.'],
    ['Тракт снова дышит. Спасибо, воин.'],
  );
}

function hermitDialogue(_p: QuestProgress): NpcDialogue {
  return {
    npcId: 'hermit', name: 'Отшельник', emoji: '🧙',
    lines: [
      'Мало кто доходит до этих пиков живым.',
      'Йети боятся огня. Крепость на севере — вотчина льда.',
    ],
    buttons: [{ label: 'Понял', action: { kind: 'dismiss' }, primary: true }],
  };
}

export function getNpcDialogue(npcId: string, progress: QuestProgress): NpcDialogue | null {
  if (npcId === 'elder')  return elderDialogue(progress);
  if (npcId === 'farmer') return farmerDialogue(progress);
  if (npcId === 'hunter') return hunterDialogue(progress);
  if (npcId === 'hermit') return hermitDialogue(progress);
  if (npcId === 'scout')  return scoutDialogue(progress);
  return null;
}
