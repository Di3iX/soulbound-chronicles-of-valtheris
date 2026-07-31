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
  /** How many black_crystal the player carries. */
  crystalCount?: number;
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

  // Chief quest (after goblins)
  const chief = getQuestEntry(progress, 'quest_chief_001');
  if (canOfferQuest(progress, 'quest_chief_001') || chief.status === 'active') {
    if (chief.status !== 'completed') {
      return questFlow(
        progress,
        'quest_chief_001',
        base,
        [
          'Гоблины — лишь стая. У них есть главарь в Волчьей пещере.',
          'Говорят, он носит корону из чёрного стекла.',
          'Срази Главаря гоблинов. Это уже не просьба деревни — это удар по Тьме.',
        ],
        [
          'Пещера на востоке Тёмного леса. Зачисти зал — главарь явится сам.',
          'Не входи раненым. Возьми зелья у торговца.',
        ],
        [
          'Ты… ты и правда сразил его.',
          'Корона, осколки, карта руин — всё сходится.',
          'Впереди Древние руины. Печать слабеет. Мы только у порога.',
          'Отдохни. Когда будешь готов — иди глубже. Долина будет ждать вестей.',
        ],
      );
    }
  }

  // Shards deliver quest
  const shards = getQuestEntry(progress, 'quest_shards_001');
  if (canOfferQuest(progress, 'quest_shards_001') || shards.status === 'active') {
    if (shards.status !== 'completed') {
      const need = QUEST_DEFS.quest_shards_001.deliverItems?.count ?? 3;
      const have = flags.crystalCount ?? 0;
      if (shards.status === 'inactive') {
        return questFlow(
          progress,
          'quest_shards_001',
          base,
          [
            'Главарь пал, но кристаллы всё ещё сыплются с тварей.',
            'Принеси мне 3 чёрных кристалла — сравню с теми, что у главаря.',
            'Их роняют крысы у порчи, кабаны, гоблины… и сам главарь.',
          ],
          [],
          [],
        );
      }
      // active
      if (have >= need) {
        return {
          ...base,
          lines: [
            `У тебя ${have} кристаллов. Этого хватит.`,
            'Отдай их — я попробую понять, откуда в них холод Бездны.',
          ],
          buttons: [
            { label: '🏆 Отдать кристаллы', action: { kind: 'complete_quest', questId: 'quest_shards_001' }, primary: true },
            { label: 'Уйти', action: { kind: 'dismiss' } },
          ],
        };
      }
      return {
        ...base,
        lines: [
          `Нужно ${need} чёрных кристалла. У тебя: ${have}.`,
          'Ищи на полях, в лесу и в пещере. Они плохо лежат в руке — как лёд.',
        ],
        buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
      };
    }
  }

  if (isQuestCompleted(progress, 'quest_chief_001')) {
    const lines = [
      'Долина пока стоит. Благодаря тебе.',
      'Кабан, кристаллы, гоблины, главарь… Тьма отступает, но не сдаётся.',
      'Старые называют это шёпотом Бездны. Теперь и я начинаю верить.',
      'Метка на таких, как ты, появляется не просто так.',
      'Руины, дорога, север — ищи, откуда растёт тьма. Мы здесь, если понадобимся.',
    ];
    if (flags.caveChiefFirstKill) {
      lines.push('Путь в руины открыт. Береги себя.');
    }
    return {
      ...base,
      lines,
      buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
    };
  }

  if (isQuestCompleted(progress, 'quest_goblin_001')) {
    return {
      ...base,
      lines: [
        'Гоблинов стало меньше — хорошо.',
        'Но без главаря стая соберётся снова. Загляни ко мне, когда будешь готов к пещере.',
      ],
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
