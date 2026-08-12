import { S, skill, makeTalentTree, type ClassPathDef } from './shared';

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHETYPE: ACOLYTE
// ═══════════════════════════════════════════════════════════════════════════════

const ACOLYTE_THEMES = [
  { name: 'Благословение', desc: '+2% силы исцеления', effect: '+2% heal power / rank' },
  { name: 'Твёрдая вера', desc: '+3% маны/веры', effect: '+3% resource / rank' },
  { name: 'Защита света', desc: '+2% брони от заклинаний', effect: '+2% spell armor / rank' },
  { name: 'Кара', desc: '+2% святого урона', effect: '+2% holy dmg / rank' },
  { name: 'Дух предков', desc: 'Исцеление по времени +3%', effect: '+3% HoT / rank' },
  { name: 'Щит веры', desc: 'Щиты +4%', effect: '+4% absorb / rank' },
  { name: 'Чистота', desc: 'Снятие дебаффа −1 с КД', effect: '-1s cleanse CD' },
  { name: 'Аура', desc: 'Ауры группы +2%', effect: '+2% auras' },
  { name: 'Мученик', desc: 'Исцеление при своём HP <50% сильнее на 3%', effect: '+3% heal low HP' },
  { name: 'Правосудие', desc: 'Крит святых заклинаний +1%', effect: '+1% holy crit' },
  { name: 'Цепное исцеление', desc: 'Шанс отскока хила 3%', effect: 'heal jump' },
  { name: 'Медитация', desc: 'Реген вне боя +5%', effect: '+5% OOC regen' },
  { name: 'Стойкость', desc: '+2% HP', effect: '+2% HP' },
  { name: 'Экзорцизм', desc: 'Урон по нежити/демонам +4%', effect: '+4% vs undead' },
  { name: 'Гармония', desc: 'Хил и урон не штрафуют друг друга', effect: 'hybrid no penalty' },
  { name: 'Тотем', desc: 'Длительность тотемов +1 с', effect: '+1s totem' },
  { name: 'Святой удар', desc: 'Мили-святые атаки +3%', effect: '+3% holy melee' },
  { name: 'Жертва', desc: 'Можно хилить ценой своего HP эффективнее', effect: 'HP-cost heal efficiency' },
  { name: 'Рассвет', desc: 'После воскрешения союзник +10% на 5 с', effect: 'rez buff' },
  { name: 'Тихая молитва', desc: 'Хил без угрозы 20%', effect: 'low threat heal' },
  { name: 'Гнев', desc: 'После хила следующий урон +2%', effect: 'heal→dmg' },
  { name: 'Покров', desc: 'Союзник под щитом −2% урона', effect: 'shielded ally' },
  { name: 'Духовное зрение', desc: 'Видит скрытых на 3% чаще', effect: 'detect' },
  { name: 'Резонанс', desc: 'Стоимость −2%', effect: '-2% cost' },
  { name: 'Оплот', desc: 'Стан-резист +3%', effect: '+3% CC resist' },
  { name: 'Свет Долины', desc: '+3% хила в безопасных зонах перехода', effect: 'zone heal' },
  { name: 'Клятва', desc: 'Бонус от квестов веры', effect: 'quest bonus' },
  { name: 'Гармония стихий', desc: '+2% nature/holy', effect: '+2% nature/holy' },
  { name: 'Великое исцеление', desc: 'Большие хилы +4%', effect: '+4% big heal' },
  { name: 'Апостол', desc: '+5% силы исцеления', effect: '+5% heal' },
  { name: 'Связь душ', desc: 'Часть хила на вторую цель 5%', effect: 'splash heal' },
  { name: 'Непреклонность', desc: 'Нельзя прервать хил 1 раз / 30 с', effect: 'uninterruptible' },
  { name: 'Благодать', desc: 'Крит хила +2%', effect: '+2% heal crit' },
  { name: 'Священный гнев', desc: 'Урон после 3 хилов +5%', effect: '3 heal → dmg' },
  { name: 'Абсолютный служитель', desc: '+4% holypower', effect: '+4% power' },
];

export const ACOLYTE: ClassPathDef = {
  id: 'acolyte',
  kind: 'archetype',
  name: 'Послушник',
  emoji: '🙏',
  lore:
    'Послушники учатся у Лекаря Дубовой Долины и у забытых алтарей Хранителя. Их сила — не в убийстве, а в том, чтобы другие смогли дойти до Печати живыми.',
  concept: 'Поддержка, лечение, святой/природный урон. Вера — ресурс.',
  rolePve: 'Хилер / гибрид',
  rolePvp: 'Саппорт, снятие контроля, сейвы',
  strengths: ['Лечение', 'Утилита', 'Групповая ценность'],
  weaknesses: ['Низкий соло-DPS', 'Зависимость от маны/веры'],
  counters: ['Антихил', 'Фокус по хилеру'],
  resource: 'faith',
  resourceName: 'Вера',
  resourceRules: '0–100. Растёт от хилов и карающих ударов, падает при панике (контроль).',
  weapons: ['Булава', 'Посох', 'Священный символ'],
  armor: ['Ткань', 'Кольчуга (позже паладин)'],
  baseStats: S(5, 5, 6, 12, 8, 4),
  growth: S(0, 0, 1, 2, 1, 0),
  skills: [
    skill('a_smite', 'Кара', '✨', 1, 'active', 'Святой урон.', 10, 0, {
      damage: { base: 10, coeff: 0.9, stat: 'spi', damageType: 'holy' },
    }),
    skill('a_heal', 'Малое исцеление', '💚', 2, 'active', 'Лечит цель.', 15, 1, {
      heal: { base: 25, coeff: 1.4, stat: 'spi' },
    }),
    skill('a_renew', 'Обновление', '🌿', 6, 'active', 'HoT 6 с.', 18, 4),
    skill('a_cleanse', 'Очищение', '🧹', 10, 'active', 'Снимает 1 яд/болезнь.', 20, 8),
    skill('a_shield', 'Слово щита', '🛡️', 14, 'active', 'Щит поглощения.', 25, 12),
    skill('a_group', 'Круг света', '☀️', 18, 'active', 'Слабый AoE-хил.', 40, 16, {
      heal: { base: 15, coeff: 0.8, stat: 'spi' },
    }),
  ],
  talents: makeTalentTree('aco', ACOLYTE_THEMES),
  legendaryTalent: {
    id: 'aco_legend',
    name: 'Длань Хранителя',
    description: 'Раз в 3 мин: полное исцеление цели и иммун 1.5 с.',
  },
  builds: [
    { name: 'Пастырь', focus: 'Хил', keyTalents: ['Благословение', 'Великое исцеление'], playstyle: 'Группа' },
    { name: 'Каратель', focus: 'Гибрид', keyTalents: ['Кара', 'Гнев'], playstyle: 'Соло' },
  ],
  trial: {
    name: 'Испытание Веры',
    location: 'Деревня + Тихие поля',
    objective: 'Провести раненого NPC через поля, поддерживая его HP >40%.',
    reward: 'Выбор профессии Послушника',
  },
};

export const PRIEST: ClassPathDef = {
  id: 'priest', kind: 'profession', name: 'Жрец', emoji: '✝️', parent: 'acolyte',
  lore: 'Жрецы несут свет алтарей. Их молитвы слышны даже в Гнилых болотах.',
  concept: 'Чистый хилер.',
  rolePve: 'Main healer', rolePvp: 'Сейвы, диспел',
  strengths: ['Лучший хил'], weaknesses: ['Слабый урон'],
  counters: ['Фокус-килл'],
  resource: 'faith', resourceName: 'Вера', resourceRules: 'Вера от успешных критических хилов.',
  weapons: ['Посох', 'Символ'], armor: ['Ткань'],
  baseStats: S(3, 4, 6, 15, 8, 4), growth: S(0, 0, 1, 3, 1, 0),
  skills: [
    skill('pr_big', 'Великое исцеление', '💚', 20, 'active', 'Сильный прямой хил.', 35, 2, {
      heal: { base: 80, coeff: 2.2, stat: 'spi' },
    }),
    skill('pr_spirit', 'Дух', '🕊️', 28, 'active', 'Быстрый хил с малым ходом.', 20, 6),
    skill('pr_rez', 'Воскрешение', '✨', 35, 'active', 'Вне боя воскрешает союзника (в ММО).', 50, 60),
  ],
  talents: makeTalentTree('pri', ACOLYTE_THEMES),
  legendaryTalent: { id: 'pri_legend', name: 'Чудо', description: 'Раз в 5 мин: массовое исцеление на 40% HP группы.' },
  builds: [{ name: 'Свет', focus: 'Throughput', keyTalents: ['Благословение'], playstyle: 'Рейд' }],
  trial: { name: 'Белая ночь', location: 'Болота', objective: 'Вылечить группу из 3 NPC в бою с болотником.', reward: 'Жрец' },
};

export const PALADIN: ClassPathDef = {
  id: 'paladin', kind: 'profession', name: 'Паладин', emoji: '⚜️', parent: 'acolyte',
  lore: 'Воин света. Клинок и молитва — одно.',
  concept: 'Hybrid tank/heal/melee holy.',
  rolePve: 'Офф-танк / гибрид', rolePvp: 'Брузер-саппорт',
  strengths: ['Универсальность'], weaknesses: ['Не лучший в узкой роли'],
  counters: ['Чистый кит'],
  resource: 'faith', resourceName: 'Вера', resourceRules: 'Вера от ударов и хилов.',
  weapons: ['Меч + щит', 'Двуруч'], armor: ['Тяжёлая'],
  baseStats: S(10, 5, 4, 10, 11, 3), growth: S(2, 0, 0, 1, 2, 0),
  skills: [
    skill('pa_strike', 'Удар света', '⚔️', 20, 'active', 'Святой мили-удар.', 20, 4, {
      damage: { base: 22, coeff: 1.0, stat: 'str', damageType: 'holy' },
    }),
    skill('pa_heal', 'Светлая длань', '✋', 24, 'active', 'Средний хил.', 25, 5, {
      heal: { base: 40, coeff: 1.2, stat: 'spi' },
    }),
    skill('pa_bubble', 'Божественный щит', '🟡', 32, 'active', 'Иммун 3 с, −50% исходящего урона.', 0, 90),
  ],
  talents: makeTalentTree('pal', ACOLYTE_THEMES),
  legendaryTalent: { id: 'pal_legend', name: 'Клятва Хранителя', description: 'Божественный щит снимает все контроли.' },
  builds: [{ name: 'Защитник', focus: 'Танк/хил', keyTalents: ['Оплот', 'Щит веры'], playstyle: 'Группа' }],
  trial: { name: 'Клятва щита', location: 'Деревня', objective: 'Защитить лекаря, нанеся святой урон ≥30% общего.', reward: 'Паладин' },
};

export const SHAMAN: ClassPathDef = {
  id: 'shaman', kind: 'profession', name: 'Шаман', emoji: '🌪️', parent: 'acolyte',
  lore: 'Голос духов леса, болот и гор. Тотемы — якоря мира.',
  concept: 'Тотемы, природа, гибрид хил/урон.',
  rolePve: 'Hybrid support', rolePvp: 'Утилита, тотемы',
  strengths: ['Гибкость', 'Зональный саппорт'], weaknesses: ['Сложность'],
  counters: ['Уничтожение тотемов'],
  resource: 'essence', resourceName: 'Сущность',
  resourceRules: 'Сущность от тотемов и ударов стихий.',
  weapons: ['Посох', 'Топор'], armor: ['Кольчуга'],
  baseStats: S(6, 6, 7, 11, 8, 5), growth: S(1, 0, 1, 2, 1, 0),
  skills: [
    skill('sh_totem', 'Тотем жизни', '🪴', 20, 'active', 'HoT в радиусе.', 30, 20),
    skill('sh_bolt', 'Молния', '⚡', 24, 'active', 'Природный урон.', 22, 5, {
      damage: { base: 24, coeff: 1.2, stat: 'int', damageType: 'nature' },
    }),
    skill('sh_purge', 'Развеивание', '🌬️', 30, 'active', 'Снимает 1 бафф с врага.', 20, 10),
  ],
  talents: makeTalentTree('sha', ACOLYTE_THEMES),
  legendaryTalent: { id: 'sha_legend', name: 'Круг духов', description: 'До 3 тотемов одновременно.' },
  builds: [{ name: 'Духи', focus: 'Тотемы', keyTalents: ['Тотем', 'Гармония стихий'], playstyle: 'Саппорт' }],
  trial: { name: 'Голос духов', location: 'Тёмный лес', objective: 'Удержать 2 тотема 45 с под давлением волков.', reward: 'Шаман' },
};

