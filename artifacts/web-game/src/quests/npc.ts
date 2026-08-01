// ─── NPC DIALOGUE ─────────────────────────────────────────────────────────────
import type { QuestProgress } from './quests';
import {
  getQuestEntry, QUEST_DEFS, canOfferQuest, isQuestCompleted,
} from './quests';

export type DialogAction =
  | { kind: 'accept_quest';   questId: string }
  | { kind: 'complete_quest'; questId: string }
  | { kind: 'craft';          recipeId: string }
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
  ruinsKeeperFirstKill?: boolean;
  swampHorrorFirstKill?: boolean;
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

  // Ruins quest (Chapter III) — after shards delivered
  const ruins = getQuestEntry(progress, 'quest_ruins_001');
  if (canOfferQuest(progress, 'quest_ruins_001') || ruins.status === 'active') {
    if (ruins.status !== 'completed') {
      return questFlow(
        progress,
        'quest_ruins_001',
        base,
        [
          'Кристаллы подтвердили худшее: порча идёт из Древних руин.',
          'Путь: Тёмный лес → Волчья пещера → Руины. Нужен примерно 15 уровень.',
          'Убей 5 скелетов, зомби или призраков — и расскажи, что видел.',
        ],
        [
          'Руины за пещерой. Нежить не спит.',
          'Если метка загорится у чёрных стен — не пугайся. Это твой якорь.',
        ],
        [
          'Ты вернулся из руин… и жив.',
          'Значит, Печать ещё держится. Но трещины уже видны.',
          'Дальше — болота, шахта, север. Мы только начали, воин.',
          'Отдохни в долине. Когда будешь готов — снова в путь.',
        ],
      );
    }
  }

  // Swamp quest (Chapter IV) — after ruins
  const swamp = getQuestEntry(progress, 'quest_swamp_001');
  if (canOfferQuest(progress, 'quest_swamp_001') || swamp.status === 'active') {
    if (swamp.status !== 'completed') {
      return questFlow(
        progress,
        'quest_swamp_001',
        base,
        [
          'Руины открыли трещину. Западнее Тёмного леса — Гнилые болота.',
          'Там воздух тяжёлый, а твари плюются ядом. Нужен примерно 18 уровень.',
          'Убей 5 слизней, болотников или ядовитых пауков — и вернись.',
        ],
        [
          'Из леса на запад. Мост топкий — не спеши.',
          'Возьми зелья. Яд болот не прощает жадность.',
        ],
        [
          'Ты вышел из болот… пахнешь тиной и победой.',
          'Порча там гуще, чем в руинах. Печать слабеет быстрее, чем мы думали.',
          'Дальше — шахта и горы. Отдохни. Долина тобой гордится.',
        ],
      );
    }
  }

  // Mine quest (Chapter V)
  const mine = getQuestEntry(progress, 'quest_mine_001');
  if (canOfferQuest(progress, 'quest_mine_001') || mine.status === 'active') {
    if (mine.status !== 'completed') {
      return questFlow(
        progress,
        'quest_mine_001',
        base,
        [
          'Из руин ведёт путь в Заброшенную шахту. Там големы и мёртвые забойщики.',
          'Нужен примерно 25 уровень. Убей 5 тварей шахты — и расскажи, что видел.',
        ],
        [
          'Шахта холодна и глубока. Не оставайся в темноте дольше нужного.',
        ],
        [
          'Ты вышел из шахты. Камень и кость остались позади.',
          'Перевал и лёд ждут сильнее. Мы держим долину — ты держи фронт.',
        ],
      );
    }
  }

  // Pass quest (Chapter VI)
  const pass = getQuestEntry(progress, 'quest_pass_001');
  if (canOfferQuest(progress, 'quest_pass_001') || pass.status === 'active') {
    if (pass.status !== 'completed') {
      return questFlow(
        progress,
        'quest_pass_001',
        base,
        [
          'За шахтой — Каменный перевал. Тролли и гарпии режут караваны.',
          'Нужен примерно 30 уровень. Убей 5 тварей перевала.',
        ],
        ['Ветер там срывает с ног. Держись скал.'],
        [
          'Перевал затих… на время.',
          'Дальше только лёд и крепость. Печать зовёт на север.',
        ],
      );
    }
  }

  // Ice fortress (Chapter VII — end of known map)
  const ice = getQuestEntry(progress, 'quest_ice_001');
  if (canOfferQuest(progress, 'quest_ice_001') || ice.status === 'active') {
    if (ice.status !== 'completed') {
      return questFlow(
        progress,
        'quest_ice_001',
        base,
        [
          'Ледяная крепость. Последняя точка на наших картах.',
          'Рыцари и маги льда служат тому, кто сидит на троне из чёрного льда.',
          'Нужен примерно 35 уровень. Убей 5 стражей крепости — или самого Короля.',
        ],
        ['С севера от перевала. Не снимай тёплую броню.'],
        [
          'Ты… ты вышел из крепости.',
          'Значит, зима не вечна. Печать ещё может быть спасена.',
          'Отдохни. Настоящая война с Бездной только начинается — но это уже другая история.',
        ],
      );
    }
  }

  if (isQuestCompleted(progress, 'quest_ice_001')) {
    const lines = [
      'Дубовая Долина стоит благодаря тебе.',
      'От полей до ледяного трона — весь путь. Мы не забудем.',
      'Когда будешь готов к новым землям и осколкам Печати — мы найдём карту.',
    ];
    if (flags.iceKingFirstKill) {
      lines.unshift('Король льда пал. Корона вечной зимы холодит даже огонь очага.');
      lines.push('Чёрный лёд в тронном зале… это след Бездны. Сюжет ещё не кончен.');
    }
    return {
      ...base,
      lines,
      buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
    };
  }

  if (isQuestCompleted(progress, 'quest_pass_001')) {
    const lines = [
      'Ты прошёл перевал. Мало кто возвращается.',
      'Когда наберёшь ~35 уровень — поговорим о Ледяной крепости.',
      'Мы будем ждать у ворот.',
    ];
    if (flags.passLordFirstKill) {
      lines.unshift('Владыка перевала пал. Корона ветров — достойный трофей.');
    }
    return {
      ...base,
      lines,
      buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
    };
  }

  if (isQuestCompleted(progress, 'quest_mine_001')) {
    const lines = [
      'Шахта не стала твоей могилой. Хороший знак.',
      'Когда будешь около 30 уровня — поговорим о перевале.',
      'Долина всегда откроет ворота своим защитникам.',
    ];
    if (flags.mineGuardianFirstKill) {
      lines.unshift('Каменный страж пал. Осколок ядра — редкая находка.');
    }
    return {
      ...base,
      lines,
      buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
    };
  }

  if (isQuestCompleted(progress, 'quest_swamp_001')) {
    const lines = [
      'Болота не забрали тебя. Это уже больше, чем удача.',
      'Когда наберёшь сил (~25 ур.) — поговорим о шахте.',
      'Мы здесь. Кузнец, торговец, глупые надежды. Приходи.',
    ];
    if (flags.swampHorrorFirstKill) {
      lines.unshift('Трясинный ужас пал. Сердце трясины — плохая игрушка, но сильный талисман.');
    }
    return {
      ...base,
      lines,
      buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
    };
  }

  if (isQuestCompleted(progress, 'quest_ruins_001')) {
    const lines = [
      'Долина помнит тебя. Руины не сомкнулись над тобой — уже чудо.',
      'Когда наберёшь сил — поговорим о болотах. Около 18 уровня.',
      'Мы будем здесь. С печами, зельями и глупыми надеждами.',
    ];
    if (flags.ruinsKeeperFirstKill) {
      lines.unshift('Ты сразил Хранителя склепа. Печать… настоящая. Холодная.');
    }
    return {
      ...base,
      lines,
      buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
    };
  }

  if (isQuestCompleted(progress, 'quest_chief_001')) {
    const lines = [
      'Главарь пал. Кристаллы и руины ждут своего часа.',
      'Когда соберёшь осколки и наберёшься сил — поговорим о руинах.',
      'Нужен примерно 15 уровень. Не торопись умирать зря.',
    ];
    if (flags.caveChiefFirstKill) {
      lines.push('Путь через пещеру в руины открыт.');
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

function smithDialogue(progress: QuestProgress, flags: DialogueFlags): NpcDialogue {
  const base = { npcId: 'smith', name: 'Кузнец', emoji: '⚒️' };
  // Lazy import avoided — recipes listed by id; App validates craft
  const buttons: DialogButton[] = [
    { label: '🛡️ Кожаный доспех', action: { kind: 'craft', recipeId: 'craft_leather_patch' }, primary: true },
    { label: '🦴 Костяной амулет', action: { kind: 'craft', recipeId: 'craft_wolf_charm' } },
    { label: '🖤 Кулон защиты', action: { kind: 'craft', recipeId: 'craft_crystal_charm' } },
    { label: '🧪 Полевое зелье', action: { kind: 'craft', recipeId: 'craft_field_ration' } },
    { label: '⚔️ Клинок с клыком', action: { kind: 'craft', recipeId: 'craft_boar_blade' } },
    { label: 'Уйти', action: { kind: 'dismiss' } },
  ];
  const lines = [
    'Мех, клыки, кристаллы — таскай сюда. Золота не беру.',
    'Доспех: 2 шкуры волка + шкура кабана.',
    'Амулет: 2 клыка + мясо. Кулон: 2 кристалла + серебряное кольцо.',
    'Зелье: 2 мяса + хвост. Клинок: клык + ржавый меч + кристалл.',
  ];
  if (flags.caveChiefFirstKill) {
    lines.push('Слышал, ты снял главаря. Кристаллы с него — хорошая оправа для кулона.');
  }
  return { ...base, lines, buttons };
}

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
  if (npcId === 'smith')  return smithDialogue(progress, flags);
  return null;
}
