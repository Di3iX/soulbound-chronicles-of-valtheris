// ─── NPC DIALOGUE ─────────────────────────────────────────────────────────────
import type { QuestProgress } from './quests';
import {
  getQuestEntry, QUEST_DEFS, canOfferQuest, isQuestCompleted, ensureDailyQuest,
} from './quests';
import type { Item } from '../inventory';
import { CRAFT_RECIPES, canCraft, recipeRequirementsText } from '../items/craft';

export type DialogAction =
  | { kind: 'accept_quest';   questId: string }
  | { kind: 'complete_quest'; questId: string }
  | { kind: 'craft';          recipeId: string }
  | { kind: 'heal' }
  | { kind: 'open_craft' }
  | { kind: 'open_upgrade' }
  | { kind: 'open_tier' }
  | { kind: 'open_enchant' }
  | { kind: 'open_trial' }
  | { kind: 'dismiss' };

export interface DialogButton {
  label:    string;
  action:   DialogAction;
  primary?: boolean;
  /** If true, button is shown but not clickable (e.g. craft missing mats). */
  disabled?: boolean;
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
  mineGuardianFirstKill?: boolean;
  passLordFirstKill?: boolean;
  iceKingFirstKill?: boolean;
  /** Текущий инвентарь игрока (для проверки рецептов у кузнеца и т.п.). */
  inventory?: Item[];
  /** Сколько бесплатных лечений осталось сегодня у лекаря. */
  freeHealsLeft?: number;
  /** Сколько XP можно вернуть у лекаря после смерти. */
  recoverableXp?: number;
  /** Стоимость платного лечения в золоте. */
  healGoldCost?: number;
  /** id активного испытания (20/40 ур.), если есть и не завершено. */
  activeTrialId?: string;
  /** Цели испытания выполнены — можно сдавать/выбирать путь. */
  trialReady?: boolean;
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

  // Испытание 20/40 ур. (см. STEP5_APP.md) — приоритетнее обычных квестов, пока активно.
  if (flags.activeTrialId) {
    return {
      ...base,
      lines: flags.trialReady
        ? ['Цели испытания выполнены. Готов принять решение?']
        : ['Испытание ещё не завершено. Убей отмеченные цели и возвращайся.'],
      buttons: [
        { label: '🏆 Испытание', action: { kind: 'open_trial' }, primary: true },
        { label: 'Уйти', action: { kind: 'dismiss' } },
      ],
    };
  }

  // 1) Intro — first talk with elder
  const intro = getQuestEntry(progress, 'quest_intro_001');
  if (canOfferQuest(progress, 'quest_intro_001') || intro.status === 'active') {
    if (intro.status !== 'completed') {
      return questFlow(
        progress,
        'quest_intro_001',
        base,
        [
          'Добро пожаловать в Дубовую Долину, путник.',
          'Я староста. Земли вокруг ещё держатся, но зверь ведёт себя странно.',
          'Сходи к фермеру на Тихие поля — ему нужна помощь с крысами.',
          'А когда разберёшься — возвращайся. Мне есть что рассказать.',
        ],
        ['Иди к фермеру на юг — к Тихим полям.'],
        [
          'Хорошо, что выслушал. Держи немного золота на дорогу.',
          'Фермер укажет, с чего начать.',
        ],
      );
    }
  }

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
          'Они тащат в чащу чёрные осколки.',
          'Убей 5 гоблинов. Нам нужна передышка.',
        ],
        ['Гоблины в Тёмном лесу. Осторожнее.'],
        [
          'Хорошо. Лес чуть притих… но это только начало.',
          'В чаще есть охотник — ему нужны волки. И бандиты всё ещё там.',
        ],
      );
    }
  }

  // Bandits in the forest
  const bandit = getQuestEntry(progress, 'quest_bandit_001');
  if (canOfferQuest(progress, 'quest_bandit_001') || bandit.status === 'active') {
    if (bandit.status !== 'completed') {
      return questFlow(
        progress,
        'quest_bandit_001',
        base,
        [
          'В Тёмном лесу засели бандиты — грабят путников.',
          'Убей 3 бандитов. Путь станет безопаснее.',
        ],
        ['Ищи лагеря в восточной части леса.'],
        ['Отлично. Бандиты разбежались. Теперь можно думать о пещере.'],
      );
    }
  }

  // Cave clear
  const cave = getQuestEntry(progress, 'quest_cave_001');
  if (canOfferQuest(progress, 'quest_cave_001') || cave.status === 'active') {
    if (cave.status !== 'completed') {
      return questFlow(
        progress,
        'quest_cave_001',
        base,
        [
          'На востоке леса — Волчья пещера. Вход кишит мышами и волками.',
          'Зачисти нору: 6 тварей. Потом поговорим о главате.',
        ],
        ['Вход в пещеру — с востока Тёмного леса.'],
        ['Нора тише. Но в глубине сидит тот, кто ими командует…'],
      );
    }
  }

  // Chief
  const chief = getQuestEntry(progress, 'quest_chief_001');
  if (canOfferQuest(progress, 'quest_chief_001') || chief.status === 'active') {
    if (chief.status !== 'completed') {
      return questFlow(
        progress,
        'quest_chief_001',
        base,
        [
          'В глубине Волчьей пещеры — Главарь гоблинов.',
          'Срази его. Это ключ к тому, что происходит с лесом.',
        ],
        ['Главарь в Волчьей пещере. Готовь зелья.'],
        [
          'Главарь пал… Значит, путь глубже открыт.',
          'Возвращайся, когда будешь готов доложить всё, что видел.',
        ],
      );
    }
  }

  // Report after chief
  const report = getQuestEntry(progress, 'quest_report_001');
  if (canOfferQuest(progress, 'quest_report_001') || report.status === 'active') {
    if (report.status !== 'completed') {
      return questFlow(
        progress,
        'quest_report_001',
        base,
        [
          'Расскажи, что видел в пещере.',
          'Чёрные осколки, звери, главарь — всё связано.',
        ],
        ['Мне нужен твой доклад о пещере.'],
        [
          'Спасибо. Теперь ясно: порча идёт из-под земли.',
          'Если найдёшь чёрные кристаллы — принеси три штуки.',
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

  // Epilogue — shards of the Seal
  const epi = getQuestEntry(progress, 'quest_epilogue_001');
  if (canOfferQuest(progress, 'quest_epilogue_001') || epi.status === 'active') {
    if (epi.status !== 'completed') {
      const need = QUEST_DEFS.quest_epilogue_001.deliverItems?.count ?? 5;
      const have = flags.crystalCount ?? 0;
      if (epi.status === 'inactive') {
        return questFlow(
          progress,
          'quest_epilogue_001',
          base,
          [
            'Король льда пал, но чёрный лёд в тронном зале не растаял до конца.',
            'Это осколки Печати — той, что держала Бездну за порогом мира.',
            'Принеси 5 чёрных кристаллов. Сложим их у алтаря долины — хотя бы заткнём трещину.',
          ],
          [],
          [],
        );
      }
      if (have >= need) {
        return {
          ...base,
          lines: [
            `У тебя ${have} кристаллов. Хватит на обряд.`,
            'Отдай их. Пусть Долина ещё подержит тишину.',
          ],
          buttons: [
            { label: '🏆 Отдать кристаллы', action: { kind: 'complete_quest', questId: 'quest_epilogue_001' }, primary: true },
            { label: 'Уйти', action: { kind: 'dismiss' } },
          ],
        };
      }
      return {
        ...base,
        lines: [
          `Нужно ${need} чёрных кристалла. У тебя: ${have}.`,
          'Их роняют звери у порчи и боссы. Поля, лес, руины, болота…',
        ],
        buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
      };
    }
  }

  if (isQuestCompleted(progress, 'quest_epilogue_001')) {
    return {
      ...base,
      lines: [
        'Кристаллы лежат у алтаря. Печать… не цела, но и не разбита.',
        'Ты прошёл от амбаров Дубовой Долины до ледяного трона.',
        'Бездна отступила на шаг. Когда откроются новые земли — ты услышишь зов.',
        'А пока — отдых, кузнец, лекарь. Долина — твой дом.',
      ],
      buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
    };
  }

  if (isQuestCompleted(progress, 'quest_ice_001')) {
    const lines = [
      'Дубовая Долина стоит благодаря тебе.',
      'От полей до ледяного трона — весь путь. Мы не забудем.',
      'Зайди ко мне снова — есть дело про осколки Печати.',
    ];
    if (flags.iceKingFirstKill) {
      lines.unshift('Король льда пал. Корона вечной зимы холодит даже огонь очага.');
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

  // 2) Крысы
  const rats = getQuestEntry(progress, 'quest_rats_001');
  if (canOfferQuest(progress, 'quest_rats_001') || (rats.status === 'active')) {
    if (rats.status !== 'completed') {
      return questFlow(
        progress,
        'quest_rats_001',
        base,
        [
          'Здорово, путник. Крысы у амбара сжирают зерно.',
          'Убей 5 крыс — без них посевная встанет.',
        ],
        ['Крысы шныряют по полям у амбара. Давай, не тяни.'],
        ['Спасибо! Зерно в безопасности. Но кабаны всё ещё топчут огород…'],
      );
    }
  }

  // 3) Кабаны
  const boars = getQuestEntry(progress, 'quest_boars_001');
  if (canOfferQuest(progress, 'quest_boars_001') || (boars.status === 'active')) {
    if (boars.status !== 'completed') {
      return questFlow(
        progress,
        'quest_boars_001',
        base,
        [
          'Молодые кабаны вытоптали грядки.',
          'Прикончи 3 молодых кабанов — тогда можно сеять.',
        ],
        ['Кабаны бродят по южной и западной части полей.'],
        ['Отличная работа! Огород снова наш.'],
      );
    }
  }

  // 4) Общая зачистка полей
  const fields = getQuestEntry(progress, 'quest_fields_001');
  if (canOfferQuest(progress, 'quest_fields_001') || (fields.status === 'active')) {
    if (fields.status !== 'completed') {
      return questFlow(
        progress,
        'quest_fields_001',
        base,
        [
          'Ещё просьба: прореди 5 крыс или кабанов — поля кишат зверём.',
          'В борозде нашёл чёрный камень. Отнёс старосте — поговори с ним потом.',
        ],
        ['Держись дороги. Зверь сегодня злой.'],
        [
          'Спасибо! Теперь можно сеять спокойно.',
          'Староста ждёт тебя в деревне — у него есть дело посерьёзнее.',
        ],
      );
    }
  }

  const daily = tryDailyDialogue(progress, 'farmer', base);
  if (daily) return daily;

  const lines = [
    'Поля пока живы. Спасибо ещё раз.',
    'Староста копается в кристаллах — говорит, плохая примета.',
  ];
  if (flags.fieldBoarFirstKill) {
    lines.push('Слышал, ты положил Огромного Кабана. Земля после него пахнет гарью.');
  }
  return {
    ...base,
    lines,
    buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
  };
}

function hunterDialogue(progress: QuestProgress, _flags: DialogueFlags): NpcDialogue {
  const base = { npcId: 'hunter', name: 'Охотник', emoji: '🏹' };
  const wolf = getQuestEntry(progress, 'quest_wolf_001');
  if (wolf.status === 'completed') {
    const daily = tryDailyDialogue(progress, 'hunter', base);
    if (daily) return daily;
  }
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

function hermitDialogue(progress: QuestProgress, _flags: DialogueFlags): NpcDialogue {
  const base = { npcId: 'hermit', name: 'Отшельник', emoji: '🧙' };
  const entry = getQuestEntry(progress, 'quest_yeti_001');
  if (entry.status !== 'completed') {
    return questFlow(
      progress,
      'quest_yeti_001',
      base,
      [
        'Мало кто доходит до этих пиков живым.',
        'Йети и ледяные волки слишком громко топчут снег — мешают думать.',
        'Убей 4. Огонь им не люб — помни это.',
      ],
      ['Ищи следы у скал. Крепость ещё севернее — туда не торопись.'],
      [
        'Тише стало. Спасибо, странник.',
        'Печать слабеет. Если пойдёшь в крепость — бери зелья и не смотри в чёрный лёд слишком долго.',
      ],
    );
  }
  return {
    ...base,
    lines: [
      'Пики помнят твоё имя. Йети реже воют.',
      'Крепость ждёт. Король льда не спит — он слушает Бездну.',
      'Возвращайся, если выживешь. Мне будет что рассказать опечам.',
    ],
    buttons: [{ label: 'Уйти', action: { kind: 'dismiss' } }],
  };
}


function smithDialogue(_progress: QuestProgress, flags: DialogueFlags): NpcDialogue {
  const lines = [
    'Горн горячий. Свитки рецептов — с врагов и за дела.',
    'Открою книгу кузницы: оружие, броня, амулеты…',
  ];
  if (flags.caveChiefFirstKill) {
    lines.push('Кристаллы с главаря хорошо идут в оправу.');
  }
  return {
    npcId: 'smith',
    name: 'Кузнец',
    emoji: '⚒️',
    lines,
    buttons: [
      { label: '⚒️ Открыть кузницу', action: { kind: 'open_craft' }, primary: true },
      { label: '✨ Улучшение +N', action: { kind: 'open_upgrade' } },
      { label: '⬆️ Прокачка тира', action: { kind: 'open_tier' } },
      { label: '🔮 Зачарование', action: { kind: 'open_enchant' } },
      { label: 'Уйти', action: { kind: 'dismiss' } },
    ],
  };
}

function healerDialogue(_p: QuestProgress, flags: DialogueFlags): NpcDialogue {
  const free = flags.freeHealsLeft ?? 10;
  const recXp = flags.recoverableXp ?? 0;
  const cost = flags.healGoldCost ?? 25;
  const lines = [
    'Раненый? Садись. Дубовая Долина не бросает своих.',
    free > 0
      ? `Бесплатных исцелений сегодня: ${free} из 10.`
      : `Бесплатные на сегодня кончились. Исцеление — ${cost} золота.`,
  ];
  if (recXp > 0) {
    lines.push(`У меня хранится ${recXp} твоего опыта с последнего поражения — верну при исцелении.`);
  }
  lines.push('Не лезь в крепость без зелий. Я не чудотворец.');

  const healLabel = free > 0
    ? `💚 Исцелиться (бесплатно, осталось ${free})`
    : `💚 Исцелиться (${cost}💰)`;

  return {
    npcId: 'healer',
    name: 'Лекарь',
    emoji: '💚',
    lines,
    buttons: [
      { label: healLabel, action: { kind: 'heal' }, primary: true },
      { label: 'Уйти', action: { kind: 'dismiss' } },
    ],
  };
}


/** If today's daily belongs to this NPC, fold it into dialogue priority. */
function tryDailyDialogue(
  progress: QuestProgress,
  npcId: string,
  base: { npcId: string; name: string; emoji: string },
): NpcDialogue | null {
  const { progress: p2, def } = ensureDailyQuest(progress);
  // side-effect: ensure def registered; progress may need App sync — dialog uses passed progress for status
  if (def.npcId !== npcId) return null;
  const entry = getQuestEntry(progress, def.id);
  if (entry.status === 'completed') return null;
  if (entry.status === 'inactive' && !canOfferQuest(progress, def.id)) {
    // daily has no requiresQuest — canOffer if inactive
  }
  if (entry.status === 'inactive' || entry.status === 'active') {
    return questFlow(
      progress,
      def.id,
      base,
      [def.description, `Цель: ${def.objective.description} (×${def.objective.required}).`],
      [`Прогресс: ${entry.current}/${def.objective.required}.`],
      ['Готово! Вот награда за сегодняшний труд.'],
    );
  }
  return null;
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
  if (npcId === 'healer') return healerDialogue(progress, flags);
  return null;
}
