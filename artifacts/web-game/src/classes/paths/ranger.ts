import { S, skill, makeTalentTree, type ClassPathDef } from './shared';

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHETYPE: RANGER
// ═══════════════════════════════════════════════════════════════════════════════

const RANGER_THEMES = [
  { name: 'Верный глаз', desc: '+2% шанса крита', effect: '+2% crit / rank' },
  { name: 'Лёгкий шаг', desc: '+2% скорости', effect: '+2% MS / rank' },
  { name: 'Отравленная стрела', desc: 'DoT +3%', effect: '+3% poison / rank' },
  { name: 'Маскировка', desc: 'Время незаметности +0.5 с', effect: '+0.5s stealth / rank' },
  { name: 'Тропа зверя', desc: 'Урон по животным +4%', effect: '+4% beast dmg / rank' },
  { name: 'Дальняя рука', desc: '+3% дальность', effect: '+3% range / rank' },
  { name: 'Скоростной выстрел', desc: '+2% скорости атаки', effect: '+2% AS / rank' },
  { name: 'Капкан', desc: 'Длительность контроля +0.3 с', effect: '+0.3s root / rank' },
  { name: 'Орлиный взор', desc: 'Крит. урон +4%', effect: '+4% crit dmg / rank' },
  { name: 'Скрытый клинок', desc: 'Урон из незаметности +5%', effect: '+5% ambush / rank' },
  { name: 'Стайный вой', desc: 'Питомцы +3% урона', effect: '+3% pet dmg / rank' },
  { name: 'Точное дыхание', desc: 'Стоимость фокуса −3%', effect: '-3% focus cost / rank' },
  { name: 'Ветровой шаг', desc: 'Рывок/перекат КД −1 с', effect: '-1s dash CD / rank' },
  { name: 'Метка жертвы', desc: 'Метка увеличивает урон +2%', effect: '+2% mark / rank' },
  { name: 'Теневой покров', desc: 'Урон в спину +3%', effect: '+3% backstab / rank' },
  { name: 'Сбор трофеев', desc: '+5% золота и шкур', effect: '+5% loot gold / rank' },
  { name: 'Быстрая рука', desc: 'Смена оружия без задержки', effect: 'weapon swap instant' },
  { name: 'Яд паука', desc: 'Замедление от яда +2%', effect: '+2% slow / rank' },
  { name: 'Лесная тень', desc: 'В лесу/полях незаметность сильнее', effect: 'terrain stealth' },
  { name: 'Снайпер', desc: 'Неподвижность 2 с: +6% урона', effect: '+6% stationary / rank' },
  { name: 'Разрывной', desc: 'AoE стрелы +3%', effect: '+3% AoE arrow / rank' },
  { name: 'Контратака', desc: 'После уклонения +5% урона', effect: '+5% after dodge / rank' },
  { name: 'Охотничий инстинкт', desc: 'К элитам +3% урона', effect: '+3% elite / rank' },
  { name: 'Тишина', desc: 'Снятие с аггро при выходе из боя быстрее', effect: 'faster drop combat' },
  { name: 'Двойной выстрел', desc: 'Шанс 2-й стрелы 3%', effect: '+3% multishot proc / rank' },
  { name: 'Костяной наконечник', desc: 'Бронепробитие +2%', effect: '+2% pen / rank' },
  { name: 'Сердце леса', desc: '+2% ко всем хар-кам', effect: '+2% stats / rank' },
  { name: 'Ночной охотник', desc: 'Ночью +3% крита', effect: '+3% night crit / rank' },
  { name: 'Мастер капканов', desc: 'До +1 капкана', effect: '+1 trap / rank' },
  { name: 'Легенда тропы', desc: '+5% дальнего урона', effect: '+5% ranged' },
  { name: 'Следопыт Долины', desc: '+4% опыта в полях/лесу', effect: '+4% zone XP' },
  { name: 'Глаз бури', desc: 'Игнор 5% уклонения цели', effect: '5% hit vs dodge' },
  { name: 'Стальная тетива', desc: 'Оружие дальнего боя +3%', effect: '+3% bow' },
  { name: 'Тень и стрела', desc: 'Скиллы из стелса −1 с КД', effect: '-1s stealth skill CD' },
  { name: 'Абсолютный следопыт', desc: '+4% к боевой эффективности', effect: '+4% power' },
];

export const RANGER: ClassPathDef = {
  id: 'ranger',
  kind: 'archetype',
  name: 'Следопыт',
  emoji: '🏹',
  lore:
    'Следопыты хранят карты Тихих полей и Тёмного леса. Они читают след кабана и шёпот ветра у Волчьей пещеры. Их учителем был Охотник с пасеки — тот, что первым увидел Огромного Кабана.',
  concept: 'Дальний бой, контроль пространства, разведка. Фокус — ресурс точности.',
  rolePve: 'Ranged DPS / килл-приоритет',
  rolePvp: 'Кит, контроль, точечный урон',
  strengths: ['Дальность', 'Безопасный фарм', 'Утилита (метки, капканы)'],
  weaknesses: ['Хрупкий в мили', 'Зависит от дистанции'],
  counters: ['Рывок Воина', 'Ассасин в спину'],
  resource: 'focus',
  resourceName: 'Фокус',
  resourceRules: '0–100. Реген 6/с; выстрелы и навыки тратят фокус.',
  weapons: ['Лук', 'Арбалет', 'Кинжалы (для ассасин-ветки позже)'],
  armor: ['Лёгкая', 'Средняя'],
  baseStats: S(5, 12, 4, 5, 7, 6),
  growth: S(0, 2, 0, 1, 1, 1),
  skills: [
    skill('r_shot', 'Выстрел', '🏹', 1, 'active', 'Базовый выстрел.', 0, 0, {
      damage: { base: 10, coeff: 1.0, stat: 'agi', wpnCoeff: 1.0, damageType: 'physical' },
    }),
    skill('r_mark', 'Метка', '🎯', 4, 'active', 'Цель получает +10% урона от вас 10 с.', 15, 12),
    skill('r_trap', 'Капкан', '🕸️', 8, 'active', 'Корень 2 с в точке.', 20, 16),
    skill('r_roll', 'Перекат', '💨', 11, 'active', 'Короткое неуязвимое перемещение.', 10, 10),
    skill('r_volley', 'Град стрел', '🌧️', 15, 'active', 'AoE по области.', 35, 18, {
      damage: { base: 14, coeff: 0.8, stat: 'agi', damageType: 'physical' },
    }),
    skill('r_camou', 'Маскировка', '🌫️', 19, 'active', 'Незаметность 3 с вне боя / 1.5 с в бою.', 30, 24),
  ],
  talents: makeTalentTree('rng', RANGER_THEMES),
  legendaryTalent: {
    id: 'rng_legend',
    name: 'Глаз Орла',
    description: 'Следующие 3 выстрела гарантированно критические (раз в 2 мин).',
  },
  builds: [
    { name: 'Снайпер', focus: 'Крит', keyTalents: ['Верный глаз', 'Снайпер'], playstyle: 'Одиночные цели' },
    { name: 'Контролёр', focus: 'Капканы', keyTalents: ['Капкан', 'Яд паука'], playstyle: 'Групповой саппорт-урон' },
  ],
  trial: {
    name: 'Тропа охотника',
    location: 'Тихие поля → Тёмный лес',
    objective: 'Выследить и добить отмеченную добычу, не входя в мили-зону босса более 5 с.',
    reward: 'Выбор профессии Следопыта',
  },
};

export const ARCHER: ClassPathDef = {
  id: 'archer', kind: 'profession', name: 'Лучник', emoji: '🎯', parent: 'ranger',
  lore: 'Лучники Долины — стражи дорог. Их залпы останавливали банды на Заброшенной дороге.',
  concept: 'Чистый ranged DPS на максимальной дистанции.',
  rolePve: 'Ranged single-target / cleave', rolePvp: 'Кит + бёрст',
  strengths: ['Дальность', 'Стабильный DPS'], weaknesses: ['Мили-давление'],
  counters: ['Рывки', 'Телепорты'],
  resource: 'focus', resourceName: 'Фокус',
  resourceRules: 'Фокус; «Заряженный выстрел» копит точность.',
  weapons: ['Лук', 'Длинный лук'], armor: ['Лёгкая'],
  baseStats: S(4, 14, 4, 4, 7, 6), growth: S(0, 3, 0, 0, 1, 1),
  skills: [
    skill('ar_charge', 'Заряженный выстрел', '💫', 20, 'active', 'Канал 1.2 с, высокий урон.', 30, 6, {
      damage: { base: 40, coeff: 1.6, stat: 'agi', wpnCoeff: 1.2, damageType: 'physical' },
    }),
    skill('ar_rain', 'Дождь стрел', '🏹', 26, 'active', 'Сильный AoE.', 40, 20, {
      damage: { base: 20, coeff: 1.0, stat: 'agi', damageType: 'physical' },
    }),
    skill('ar_head', 'Выстрел в голову', '🎯', 32, 'active', 'Гарантированный крит, долгий КД.', 35, 28, {
      damage: { base: 35, coeff: 1.8, stat: 'agi', damageType: 'physical' },
    }),
  ],
  talents: makeTalentTree('arc', RANGER_THEMES),
  legendaryTalent: { id: 'arc_legend', name: 'Стрела Судьбы', description: 'Раз в 3 мин выстрел игнорирует иммунитеты и броню.' },
  builds: [{ name: 'Снайпер Долины', focus: 'Заряд', keyTalents: ['Снайпер', 'Орлиный взор'], playstyle: 'Босс-килл' }],
  trial: { name: 'Дальняя стрела', location: 'Тихие поля', objective: 'Убить Огромного Кабана, не подходя ближе 6 клеток.', reward: 'Лучник' },
};

export const ASSASSIN: ClassPathDef = {
  id: 'assassin', kind: 'profession', name: 'Ассасин', emoji: '🗡️', parent: 'ranger',
  lore: 'Тень тракта. Ассасины служили и страже, и тем, кто платил золотом — теперь их путь связан с Печатью.',
  concept: 'Стелс, бёрст в спину, кинжалы.',
  rolePve: 'Burst DPS', rolePvp: 'Открытие боя, пик-оффы',
  strengths: ['Огромный открывающий урон'], weaknesses: ['После бёрста уязвим'],
  counters: ['Обнаружение', 'Парирование Дуэлянта'],
  resource: 'focus', resourceName: 'Фокус',
  resourceRules: 'Фокус; стелс восстанавливает фокус.',
  weapons: ['Парные кинжалы'], armor: ['Лёгкая'],
  baseStats: S(6, 14, 3, 4, 6, 7), growth: S(1, 3, 0, 0, 0, 1),
  skills: [
    skill('as_ambush', 'Засада', '🌑', 20, 'active', 'Из стелса: огромный урон в спину.', 40, 12, {
      damage: { base: 50, coeff: 2.0, stat: 'agi', damageType: 'shadow' },
    }),
    skill('as_bleed', 'Вспарывание', '🩸', 25, 'active', 'Сильный DoT.', 25, 8),
    skill('as_vanish', 'Исчезновение', '💨', 30, 'active', 'Принудительный стелс на 1.5 с в бою.', 50, 45),
  ],
  talents: makeTalentTree('asn', RANGER_THEMES),
  legendaryTalent: { id: 'asn_legend', name: 'Клинок Ночи', description: 'Засада всегда критует и накладывает немоту 1 с.' },
  builds: [{ name: 'Тень', focus: 'Стелс', keyTalents: ['Скрытый клинок', 'Маскировка'], playstyle: 'PvP opener' }],
  trial: { name: 'Нож в тени', location: 'Тёмный лес', objective: 'Убить 5 элитных целей из стелса без обнаружения.', reward: 'Ассасин' },
};

export const HUNTER: ClassPathDef = {
  id: 'hunter', kind: 'profession', name: 'Охотник', emoji: '🐺', parent: 'ranger',
  lore: 'Ученики пастуха и охотника с полей. Звери — союзники, а не только добыча.',
  concept: 'Питомец + ловушки + средний урон.',
  rolePve: 'Hybrid pet DPS', rolePvp: 'Контроль + питомец',
  strengths: ['Дополнительная цель (пет)', 'Утилита'], weaknesses: ['Микропитомца'],
  counters: ['AoE по пету', 'Страх зверей'],
  resource: 'focus', resourceName: 'Фокус',
  resourceRules: 'Фокус делится с командами питомца.',
  weapons: ['Лук', 'Копьё'], armor: ['Средняя'],
  baseStats: S(6, 11, 4, 6, 8, 5), growth: S(1, 2, 0, 1, 1, 0),
  skills: [
    skill('hu_pet', 'Призыв зверя', '🐺', 20, 'active', 'Призыв волка/кабана-спутника.', 0, 5),
    skill('hu_mend', 'Лечение зверя', '💚', 24, 'active', 'Лечит питомца.', 25, 10, {
      heal: { base: 40, coeff: 1.2, stat: 'spi' },
    }),
    skill('hu_pack', 'Приказ: рвать', '🐾', 30, 'active', 'Питомец бьёт усиленно 6 с.', 30, 16),
  ],
  talents: makeTalentTree('hun', RANGER_THEMES),
  legendaryTalent: { id: 'hun_legend', name: 'Вожак стаи', description: 'Питомец перерождается раз в 3 мин с 50% HP.' },
  builds: [{ name: 'Стая', focus: 'Пет', keyTalents: ['Стайный вой'], playstyle: 'Соло с питомцем' }],
  trial: { name: 'Зов стаи', location: 'Волчья пещера', objective: 'Победить альфу вместе с питомцем, питомец должен выжить.', reward: 'Охотник' },
};

