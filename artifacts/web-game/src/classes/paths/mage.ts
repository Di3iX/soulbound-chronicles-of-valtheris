import { S, skill, makeTalentTree, type ClassPathDef } from './shared';

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHETYPE: MAGE
// ═══════════════════════════════════════════════════════════════════════════════

const MAGE_THEMES = [
  { name: 'Искра', desc: '+2% силы заклинаний', effect: '+2% SP / rank' },
  { name: 'Ясный ум', desc: '+3% маны', effect: '+3% mana / rank' },
  { name: 'Быстрый каст', desc: '−2% времени каста', effect: '-2% cast / rank' },
  { name: 'Ожог', desc: 'Огненный DoT +3%', effect: '+3% ignite / rank' },
  { name: 'Иней', desc: 'Замедление от льда +2%', effect: '+2% chill / rank' },
  { name: 'Дуга', desc: 'Шанс цепи +3%', effect: '+3% chain / rank' },
  { name: 'Барьер', desc: 'Щит от заклинаний +4%', effect: '+4% barrier / rank' },
  { name: 'Критическая руна', desc: '+1% крита закл.', effect: '+1% spell crit / rank' },
  { name: 'Глубокий резервуар', desc: 'Реген маны +3%', effect: '+3% mana regen / rank' },
  { name: 'Концентрация', desc: 'Прерывание каста −10% шанс', effect: 'pushback resist' },
  { name: 'Взрыв', desc: 'AoE +3%', effect: '+3% AoE / rank' },
  { name: 'Чародейский фокус', desc: 'Стоимость маны −2%', effect: '-2% mana cost / rank' },
  { name: 'Стихийное мастерство', desc: '+2% к стихиям', effect: '+2% elements / rank' },
  { name: 'Замедление времени', desc: 'КД −2%', effect: '-2% CD / rank' },
  { name: 'Стеклянная пушка', desc: '+4% урона, −1% HP', effect: '+4% dmg -1% HP / rank' },
  { name: 'Морозный щит', desc: 'При ударе мили — замедление атакующего', effect: 'melee chill' },
  { name: 'Пламя души', desc: 'Убийство восстанавливает 2% маны', effect: '+2% mana on kill' },
  { name: 'Руна силы', desc: '+1 int за ранг (макс 3)', effect: '+1 int / rank' },
  { name: 'Цепная реакция', desc: 'DoT взрывается с шансом 2%', effect: 'DoT explode' },
  { name: 'Арканный щит', desc: '1 заряд щита каждые 30 с', effect: 'periodic shield' },
  { name: 'Перегрев', desc: 'После 3 огненных — +5% урона', effect: 'fire stack buff' },
  { name: 'Ледяная вена', desc: 'Крит льда замораживает 0.3 с', effect: 'frost crit root' },
  { name: 'Слово власти', desc: 'Контроль +0.2 с', effect: '+0.2s CC' },
  { name: 'Эхо заклинания', desc: 'Шанс повтора 2%', effect: '2% echo' },
  { name: 'Магический проводник', desc: 'Оружие-посох +3%', effect: '+3% staff' },
  { name: 'Разрушитель чар', desc: 'Урон по щитам +5%', effect: '+5% vs absorb' },
  { name: 'Мудрость Вальтариса', desc: '+2% опыта закл. убийств', effect: '+2% XP' },
  { name: 'Стабильность', desc: 'Сопр. прерыванию +5%', effect: 'interrupt resist' },
  { name: 'Катаклизм', desc: 'Финальные ультиматки +6%', effect: '+6% ult' },
  { name: 'Архимаг', desc: '+5% силы заклинаний', effect: '+5% SP' },
  { name: 'Линия силовых', desc: 'Каст на бегу 10% скорости', effect: 'move cast' },
  { name: 'Чистая мана', desc: 'Первые 10 с боя −5% стоимости', effect: 'open mana' },
  { name: 'Сфера защиты', desc: 'Союзный щит +3%', effect: '+3% ally shield' },
  { name: 'Гибкость школы', desc: 'Смена стихии без штрафа', effect: 'no school penalty' },
  { name: 'Абсолютный маг', desc: '+4% боевой мощи', effect: '+4% power' },
];

export const MAGE: ClassPathDef = {
  id: 'mage',
  kind: 'archetype',
  name: 'Маг',
  emoji: '🔮',
  lore:
    'Маги Вальтариса черпают силу из трещин Печати. В Дубовой Долине их мало — Староста не доверяет «огоньку из пустоты», но Лекарь знает: без арканы Язву не сдержать.',
  concept: 'Кастовый урон, контроль зоны, мана как главный ресурс.',
  rolePve: 'Burst / sustained magic DPS',
  rolePvp: 'Зонный контроль, кит, бурст',
  strengths: ['Высокий урон', 'AoE', 'Контроль'],
  weaknesses: ['Мало HP', 'Долгие касты', 'Мана'],
  counters: ['Прерывания', 'Мили-давление'],
  resource: 'mana',
  resourceName: 'Мана',
  resourceRules: 'Пул от Int/Spi. Реген вне боя высокий, в бою низкий.',
  weapons: ['Посох', 'Жезл', 'Книга/сфера'],
  armor: ['Ткань'],
  baseStats: S(3, 5, 13, 8, 6, 4),
  growth: S(0, 0, 3, 1, 1, 0),
  skills: [
    skill('m_bolt', 'Стрела чар', '✨', 1, 'active', 'Базовый снаряд.', 8, 0, {
      damage: { base: 12, coeff: 1.1, stat: 'int', damageType: 'arcane' },
    }),
    skill('m_frost', 'Обморожение', '❄️', 4, 'active', 'Урон + замедление 30%.', 18, 6, {
      damage: { base: 14, coeff: 1.0, stat: 'int', damageType: 'frost' },
      effects: ['slow_30_4s'],
    }),
    skill('m_fire', 'Огненный шар', '🔥', 8, 'active', 'AoE взрыв.', 28, 10, {
      damage: { base: 20, coeff: 1.2, stat: 'int', damageType: 'fire' },
    }),
    skill('m_shield', 'Щит маны', '🔵', 12, 'active', 'Поглощает урон = 15% макс. HP.', 30, 22),
    skill('m_blink', 'Скачок', '🌀', 16, 'active', 'Короткий телепорт.', 25, 14),
    skill('m_nova', 'Вспышка', '💥', 19, 'active', 'Нова вокруг кастера.', 40, 18, {
      damage: { base: 25, coeff: 1.3, stat: 'int', damageType: 'arcane' },
    }),
  ],
  talents: makeTalentTree('mag', MAGE_THEMES),
  legendaryTalent: {
    id: 'mag_legend',
    name: 'Печать Вальтариса',
    description: 'Раз в 3 мин: следующий каст мгновенный и не расходует ману.',
  },
  builds: [
    { name: 'Пиро', focus: 'Огонь', keyTalents: ['Ожог', 'Взрыв'], playstyle: 'AoE-фарм' },
    { name: 'Контроль', focus: 'Лёд', keyTalents: ['Иней', 'Слово власти'], playstyle: 'PvP кит' },
  ],
  trial: {
    name: 'Испытание Искры',
    location: 'Древние руины',
    objective: 'Победить трёх элементалей (огонь, лёд, аркана), используя только магию соответствующей школы.',
    reward: 'Выбор профессии Мага',
  },
};

export const PYROMANCER: ClassPathDef = {
  id: 'pyromancer', kind: 'profession', name: 'Пиромант', emoji: '🔥', parent: 'mage',
  lore: 'Огонь Печати обжигает разум. Пироманты учатся жечь врагов, не сгорев сами.',
  concept: 'DoT, поджоги, AoE.',
  rolePve: 'AoE magic DPS', rolePvp: 'Зона + давление',
  strengths: ['Пачки мобов'], weaknesses: ['Одиночная цель слабее крио'],
  counters: ['Высокая огнестойкость'],
  resource: 'mana', resourceName: 'Мана', resourceRules: 'Мана; Перегрев даёт бонус.',
  weapons: ['Посох огня'], armor: ['Ткань'],
  baseStats: S(3, 5, 15, 6, 6, 4), growth: S(0, 0, 3, 1, 1, 0),
  skills: [
    skill('py_ignite', 'Поджог', '🔥', 20, 'active', 'Сильный DoT огня.', 25, 6, {
      damage: { base: 10, coeff: 0.9, stat: 'int', damageType: 'fire' },
    }),
    skill('py_wave', 'Огненная волна', '🌊', 26, 'active', 'Конус огня.', 35, 12, {
      damage: { base: 28, coeff: 1.3, stat: 'int', damageType: 'fire' },
    }),
    skill('py_meteor', 'Метеор', '☄️', 34, 'active', 'Задержка 1.5 с, огромный AoE.', 50, 30, {
      damage: { base: 60, coeff: 2.0, stat: 'int', damageType: 'fire' },
    }),
  ],
  talents: makeTalentTree('pyr', MAGE_THEMES),
  legendaryTalent: { id: 'pyr_legend', name: 'Солнце Печати', description: 'Метеор поджигает землю на 6 с.' },
  builds: [{ name: 'Пожар', focus: 'AoE', keyTalents: ['Взрыв', 'Ожог'], playstyle: 'Фарм пачек' }],
  trial: { name: 'Пылающее сердце', location: 'Руины', objective: 'Сжечь 30 целей поджогом за один бой с элитой.', reward: 'Пиромант' },
};

export const CRYOMANCER: ClassPathDef = {
  id: 'cryomancer', kind: 'profession', name: 'Криомант', emoji: '❄️', parent: 'mage',
  lore: 'Лёд Ледяных пиков и крепости — их учитель. Контроль важнее пепла.',
  concept: 'Замедления, корни, щиты льда.',
  rolePve: 'Controlled DPS', rolePvp: 'Пик контроля',
  strengths: ['Контроль', 'Выживаемость'], weaknesses: ['Ниже чистый DPS огня'],
  counters: ['Иммун к замедлению'],
  resource: 'mana', resourceName: 'Мана', resourceRules: 'Мана; криты льда усиливают контроль.',
  weapons: ['Посох льда'], armor: ['Ткань'],
  baseStats: S(3, 5, 14, 8, 7, 4), growth: S(0, 0, 2, 2, 1, 0),
  skills: [
    skill('cr_freeze', 'Заморозка', '🧊', 20, 'active', 'Корень 2 с.', 30, 14, {
      damage: { base: 18, coeff: 1.0, stat: 'int', damageType: 'frost' },
    }),
    skill('cr_lance', 'Ледяное копьё', '🔱', 26, 'active', 'Сильный single-target.', 28, 8, {
      damage: { base: 36, coeff: 1.5, stat: 'int', damageType: 'frost' },
    }),
    skill('cr_armor', 'Ледяной доспех', '🛡️', 32, 'active', '+броня, мили-атакующие замедляются.', 35, 25),
  ],
  talents: makeTalentTree('cry', MAGE_THEMES),
  legendaryTalent: { id: 'cry_legend', name: 'Сердце ледника', description: 'Раз в 2 мин: все враги в радиусе замораживаются на 2 с.' },
  builds: [{ name: 'Ледник', focus: 'CC', keyTalents: ['Иней', 'Слово власти'], playstyle: 'PvP' }],
  trial: { name: 'Дыхание зимы', location: 'Ледяные пики', objective: 'Победить йети, удерживая его замедленным ≥50% боя.', reward: 'Криомант' },
};

export const SPELLBINDER: ClassPathDef = {
  id: 'spellbinder', kind: 'profession', name: 'Заклинатель', emoji: '📜', parent: 'mage',
  lore: 'Ткачи рун Печати. Аркана — нить, что связывает мир.',
  concept: 'Чистая аркана, щиты, манипуляция.',
  rolePve: 'Burst arcane', rolePvp: 'Щиты + бёрст',
  strengths: ['Гибкость'], weaknesses: ['Сложнее ротация'],
  counters: ['Снятие щитов'],
  resource: 'mana', resourceName: 'Мана', resourceRules: 'Мана; руны снижают стоимость.',
  weapons: ['Книга', 'Сфера'], armor: ['Ткань'],
  baseStats: S(3, 5, 14, 9, 6, 5), growth: S(0, 0, 3, 2, 0, 0),
  skills: [
    skill('sp_missile', 'Арканы', '🔷', 20, 'active', '3 снаряда арканы.', 30, 6, {
      damage: { base: 14, coeff: 0.9, stat: 'int', damageType: 'arcane' },
    }),
    skill('sp_bubble', 'Пузырь', '🫧', 26, 'active', 'Иммун 2 с (нельзя атаковать).', 40, 40),
    skill('sp_power', 'Мощь', '⚡', 33, 'active', '+25% силы заклинаний 8 с.', 20, 30),
  ],
  talents: makeTalentTree('spb', MAGE_THEMES),
  legendaryTalent: { id: 'spb_legend', name: 'Руна Печати', description: 'Пузырь можно применить на союзника.' },
  builds: [{ name: 'Арканный', focus: 'Burst', keyTalents: ['Искра', 'Катаклизм'], playstyle: 'Босс' }],
  trial: { name: 'Узел рун', location: 'Руины', objective: 'Активировать 3 руны под давлением мобов.', reward: 'Заклинатель' },
};

