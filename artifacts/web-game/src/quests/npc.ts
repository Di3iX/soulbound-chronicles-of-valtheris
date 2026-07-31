// ─── NPC DIALOGUE ─────────────────────────────────────────────────────────────
import type { QuestProgress } from './quests';
import {
  getQuestEntry, QUEST_DEFS, canOfferQuest, isQuestCompleted,
} from './quests';

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

/** Optional flags from the game world (boss kills, etc.). */
export interface DialogueFlags {
  fieldBoarFirstKill?: boolean;
  caveChiefFirstKill?: boolean;
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

function elderDialogue(progress: QuestProgress, flags: DialogueFlags): NpcDialogue {
  const base = { npcId: 'elder', name: 'Староста', emoji: '👴' };

  // Crystal quest (after fields)
  const crystal = getQuestEntry(progress, 'quest_crystal_001');
  if (canOfferQuest(progress, 'quest_crystal_001') || crystal.status === 'active') {
    if (crystal.status !== 'completed') {
      return questFlow(
        progress,
        'quest_crystal_001',
        base,
        [
          'Фермер говорил, что ты помог с полями. Спасибо.',
          'В земле находят чёрные кристаллы. Звери рядом с ними бесятся.',
          'На полях видели Огромного Кабана — тварь не из этих мест.',
          'Убей его. Мне нужно понять, откуда идёт порча.',
        ],
        [
          'Кабан бродит по Тихим полям. Говорят, появляется снова и снова.',
          'Возле него находят те самые чёрные осколки.',
        ],
        [
          'Ты убил зверя… На клыке и в земле — тот же чёрный блеск.',
          'Это не простая болезнь животных. Что-то будит Тьму на окраине королевства.',
          'Если готов идти дальше — слушай про лес.',
        ],
      );
    }
  }

  // Goblin quest (after crystals)
  const goblin = getQuestEntry(progress, 'quest_goblin_001');
  if (canOfferQuest(progress, 'quest_goblin_001') || goblin.status === 'active') {
    if (goblin.status !== 'completed') {
      return questFlow(
        progress,
        'quest_goblin_001',
        base,
        [
          'К северу от полей — Тёмный лес. Там расплодились гоблины.',
          'Они тащат в чащу те же чёрные осколки.',
          'Убей 5 гоблинов. Нам нужна передышка — и зацепка, куда ведёт тропа.',
        ],
        ['Гоблины в Тёмном лесу. Осторожнее: лес уже не тот, что в сказках.'],
        [
          'Хорошо. Лес чуть притих… но это только начало.',
          'Если заметишь на руке странную метку — не пугайся вслух при всех.',
          'Приходи, когда будешь сильнее. Впереди руины и то, о чём молчат хроники.',
        ],
      );
    }
  }

  if (isQuestCompleted(progress, 'quest_goblin_001')) {
    const lines = [
      'Долина пока стоит. Благодаря тебе.',
      'Чёрные кристаллы, взбесившиеся звери, гоблины с осколками…',
      'Старые называют это шёпотом Бездны. Я ещё не готов в это верить.',
      'Но метка, что бывает у таких, как ты, появляется не просто так.',
      'Иди в лес, к пещере, на дорогу — ищи, откуда растёт тьма.',
    ];
    if (flags.fieldBoarFirstKill) {
      lines.push('Тот кабан был лишь первым стражем. Впереди будут хуже.');
    }
    return {
      ...base,
      lines,
      buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
    };
  }

  return {
    ...base,
    lines: [
      'Добро пожаловать в Дубовую Долину, путник.',
      'Мы — окраина бывшего королевства. Здесь тихо… пока.',
      'Поговори с фермером на полях — у него беда с зверьём.',
      'Когда разберёшься, вернись ко мне.',
    ],
    buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
  };
}

function farmerDialogue(progress: QuestProgress, flags: DialogueFlags): NpcDialogue {
  const base = { npcId: 'farmer', name: 'Фермер', emoji: '👨' };
  const entry = getQuestEntry(progress, 'quest_fields_001');

  if (entry.status !== 'completed') {
    return questFlow(
      progress,
      'quest_fields_001',
      base,
      [
        'Здорово, путник. Крысы и кабаны портят урожай.',
        'В борозде нашёл чёрный камень — холодный, как ночь.',
        'Убей 5 крыс или молодых кабанов. Награда скромная, но честная.',
      ],
      [
        'Они всё ещё рыщут по полям. Держись дороги.',
        'Если увидишь Огромного Кабана — это уже не мой огород.',
      ],
      [
        'Спасибо! Теперь можно сеять спокойно.',
        'Тот чёрный камень я отнёс старосте. Поговори с ним в деревне.',
      ],
    );
  }

  const lines = [
    'Поля пока живы. Спасибо ещё раз.',
    'Староста копается в этих кристаллах — говорит, плохая примета.',
  ];
  if (flags.fieldBoarFirstKill) {
    lines.push('Слышал, ты положил Огромного Кабана. Земля после него пахнет гарью и железом.');
  }
  return {
    ...base,
    lines,
    buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
  };
}

function hunterDialogue(progress: QuestProgress, _flags: DialogueFlags): NpcDialogue {
  return questFlow(
    progress,
    'quest_wolf_001',
    { npcId: 'hunter', name: 'Охотник', emoji: '🏹' },
    [
      'Тише… Мне нужны волчьи шкуры.',
      'Звери злее обычного — будто кто-то шепчет им в ухо.',
      'Убей 4 волка: обычных, альфу или ледяных — без разницы.',
    ],
    ['Волки в Тёмном лесу и в пещере. Не ходи туда ночью… хотя дни теперь не лучше.'],
    [
      'Отличная работа. Шкуры пригодятся зимой.',
      'Если увидишь в чаще чёрный блеск — не бери голыми руками.',
    ],
  );
}

function scoutDialogue(progress: QuestProgress, _flags: DialogueFlags): NpcDialogue {
  return questFlow(
    progress,
    'quest_bandit_001',
    { npcId: 'scout', name: 'Разведчик', emoji: '🕵️' },
    [
      'Эта дорога кишит разбойниками.',
      'Некоторые носят осколки чёрного стекла на шее — как талисманы.',
      'Убери 4 разбойников или наёмников — путь станет безопаснее.',
    ],
    ['Они прячутся вдоль тракта. Не дай себя окружить.'],
    [
      'Тракт снова дышит. Спасибо, воин.',
      'Те талисманы… лучше сдать старосте, чем продавать в деревне.',
    ],
  );
}

function hermitDialogue(_p: QuestProgress, _flags: DialogueFlags): NpcDialogue {
  return {
    npcId: 'hermit', name: 'Отшельник', emoji: '🧙',
    lines: [
      'Мало кто доходит до этих пиков живым.',
      'Йети боятся огня. Крепость на севере — вотчина льда.',
      'Печать слабеет. Ты это уже чувствуешь — иначе не стоял бы здесь.',
    ],
    buttons: [{ label: 'Понял', action: { kind: 'dismiss' }, primary: true }],
  };
}

/**
 * Resolve dialogue for an NPC.
 * Pass optional flags (e.g. fieldBoarFirstKill) from App for story branches.
 */
export function getNpcDialogue(
  npcId: string,
  progress: QuestProgress,
  flags: DialogueFlags = {},
): NpcDialogue | null {
  if (npcId === 'elder')  return elderDialogue(progress, flags);
  if (npcId === 'farmer') return farmerDialogue(progress, flags);
  if (npcId === 'hunter') return hunterDialogue(progress, flags);
  if (npcId === 'hermit') return hermitDialogue(progress, flags);
  if (npcId === 'scout')  return scoutDialogue(progress, flags);
  return null;
}
