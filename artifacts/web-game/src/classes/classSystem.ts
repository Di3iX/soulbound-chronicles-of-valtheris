/**
 * Soulbound: Chronicles of Valtheris — Class / Profession / Specialization system
 * Data layer for programmers. Levels: 1–20 archetype → 20 profession → 40 specialization.
 */

export type ArchetypeId = 'warrior' | 'ranger' | 'mage' | 'acolyte';
export type ProfessionId =
  | 'berserker' | 'guardian' | 'duelist'
  | 'archer' | 'assassin' | 'hunter'
  | 'pyromancer' | 'cryomancer' | 'spellbinder'
  | 'priest' | 'paladin' | 'shaman';
export type SpecializationId =
  | 'bloodreaver' | 'warlord'           // Berserker
  | 'bulwark' | 'aegis'                 // Guardian
  | 'blademaster' | 'riposte'           // Duelist
  | 'sharpshooter' | 'pathfinder'       // Archer
  | 'shadowblade' | 'nightblade'        // Assassin
  | 'beastmaster' | 'trapper'           // Hunter
  | 'infernalist' | 'ashwalker'         // Pyromancer
  | 'frostweaver' | 'glacier'           // Cryomancer
  | 'arcanist' | 'runekeeper'           // Spellbinder
  | 'hierophant' | 'oracle'             // Priest
  | 'templar' | 'crusader'              // Paladin
  | 'spiritwalker' | 'stormcaller';     // Shaman

export type ResourceType =
  | 'rage' | 'stamina' | 'focus' | 'mana' | 'faith' | 'essence';

export type PrimaryStat = 'str' | 'agi' | 'int' | 'spi' | 'vit' | 'lck';

export interface StatBlock {
  str: number; agi: number; int: number; spi: number; vit: number; lck: number;
}

export interface ClassSkillDef {
  id: string;
  name: string;
  emoji: string;
  /** Unlock level within current path (1–40). */
  unlockLevel: number;
  kind: 'active' | 'passive';
  description: string;
  /** Resource cost (0 for passive). */
  cost: number;
  /** Cooldown seconds (0 for passive). */
  cooldownSec: number;
  /**
   * Damage formula tokens, evaluated at cast time:
   *  base + coeff * STAT + weapon * wpnCoeff
   * Example: { base: 20, coeff: 1.2, stat: 'str', wpnCoeff: 0.8 }
   */
  damage?: {
    base: number;
    coeff: number;
    stat: PrimaryStat;
    wpnCoeff?: number;
    damageType?: 'physical' | 'fire' | 'frost' | 'arcane' | 'holy' | 'nature' | 'shadow';
  };
  heal?: { base: number; coeff: number; stat: PrimaryStat };
  effects?: string[];
}

export interface TalentNode {
  id: string;
  name: string;
  description: string;
  /** Column in tree 0–4, row 0–6 → ~35 nodes. */
  col: number;
  row: number;
  maxRank: number;
  costPerRank: number;
  requires?: string[];
  effect: string;
}

export interface ClassPathDef {
  id: ArchetypeId | ProfessionId | SpecializationId;
  kind: 'archetype' | 'profession' | 'specialization';
  name: string;
  emoji: string;
  parent?: ArchetypeId | ProfessionId;
  lore: string;
  concept: string;
  rolePve: string;
  rolePvp: string;
  strengths: string[];
  weaknesses: string[];
  counters: string[];
  resource: ResourceType;
  resourceName: string;
  /** How resource generates / regenerates. */
  resourceRules: string;
  weapons: string[];
  armor: string[];
  baseStats: StatBlock;
  /** Per level growth (applied each level while on this path). */
  growth: StatBlock;
  skills: ClassSkillDef[];
  talents: TalentNode[];
  legendaryTalent: { id: string; name: string; description: string };
  builds: Array<{ name: string; focus: string; keyTalents: string[]; playstyle: string }>;
  /** Trial at profession unlock (level 20) or specialization (40). */
  trial?: {
    name: string;
    location: string;
    objective: string;
    reward: string;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const S = (str: number, agi: number, int: number, spi: number, vit: number, lck: number): StatBlock =>
  ({ str, agi, int, spi, vit, lck });

function skill(
  id: string, name: string, emoji: string, unlockLevel: number,
  kind: 'active' | 'passive', description: string,
  cost = 0, cooldownSec = 0,
  extra: Partial<ClassSkillDef> = {},
): ClassSkillDef {
  return { id, name, emoji, unlockLevel, kind, description, cost, cooldownSec, ...extra };
}

function talent(
  id: string, name: string, description: string,
  col: number, row: number, maxRank = 3, requires?: string[], effect = '',
): TalentNode {
  return {
    id, name, description, col, row, maxRank, costPerRank: 1,
    requires, effect: effect || description,
  };
}

/** Generate a dense 5×7 talent grid (~35 nodes) with thematic names. */
function makeTalentTree(
  prefix: string,
  themes: Array<{ name: string; desc: string; effect: string }>,
): TalentNode[] {
  const nodes: TalentNode[] = [];
  let i = 0;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if (i >= themes.length) {
        nodes.push(talent(
          `${prefix}_t${row}_${col}`,
          `Мастерство ${row + 1}.${col + 1}`,
          `Усиление пути (+${1 + row}% к ключевой метрике).`,
          col, row, row < 5 ? 3 : 1,
          row > 0 ? [`${prefix}_t${row - 1}_${col}`] : undefined,
          `+${1 + row}% эффективности класса`,
        ));
      } else {
        const th = themes[i];
        nodes.push(talent(
          `${prefix}_${i}`,
          th.name,
          th.desc,
          col, row,
          row >= 5 ? 1 : 3,
          row > 0 && col < 5 ? [`${prefix}_${Math.max(0, i - 5)}`] : undefined,
          th.effect,
        ));
      }
      i++;
    }
  }
  return nodes;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHETYPE: WARRIOR
// ═══════════════════════════════════════════════════════════════════════════════

const WARRIOR_TALENT_THEMES = [
  { name: 'Железная хватка', desc: '+2% урона оружием за ранг', effect: '+2% weapon dmg / rank' },
  { name: 'Твёрдая стойка', desc: '+3% брони за ранг', effect: '+3% armor / rank' },
  { name: 'Кровь битвы', desc: '+1% вампиризма за ранг', effect: '+1% lifesteal / rank' },
  { name: 'Удар щитом', desc: 'Пассив: шанс оглушить 2%', effect: '+2% stun on hit / rank' },
  { name: 'Ярость новичка', desc: 'Ярость копится на 5% быстрее', effect: '+5% rage gen / rank' },
  { name: 'Рассечение', desc: '+4% крит. урона', effect: '+4% crit dmg / rank' },
  { name: 'Несокрушимость', desc: '+2% макс. HP', effect: '+2% max HP / rank' },
  { name: 'Контрудар', desc: '+3% урона после блока', effect: '+3% dmg after block / rank' },
  { name: 'Боевой клич', desc: 'Снижение КД «Клич» на 1 с', effect: '-1s shout CD / rank' },
  { name: 'Стальной нерв', desc: 'Сопротивление контролю +2%', effect: '+2% CC resist / rank' },
  { name: 'Тяжёлый шаг', desc: '+5% угрозы (танк)', effect: '+5% threat / rank' },
  { name: 'Кровожадность', desc: 'Добивание даёт +5 ярости', effect: '+5 rage on kill / rank' },
  { name: 'Щит стены', desc: 'Блок снижает урон ещё на 2%', effect: '+2% block reduction / rank' },
  { name: 'Вихрь клинков', desc: 'AoE скиллы +3% радиус', effect: '+3% AoE radius / rank' },
  { name: 'Ветераны фронта', desc: '+1% ко всем характеристикам', effect: '+1% all stats / rank' },
  { name: 'Пробитие брони', desc: '+2% игнор брони цели', effect: '+2% armor pen / rank' },
  { name: 'Вторая кожа', desc: 'Получаемый урон −1%', effect: '-1% damage taken / rank' },
  { name: 'Спринт войны', desc: '+2% скорости в бою', effect: '+2% combat MS / rank' },
  { name: 'Казнь', desc: '+5% урона по целям <30% HP', effect: '+5% execute / rank' },
  { name: 'Боевой медик', desc: 'Зелья лечения +8%', effect: '+8% potion heal / rank' },
  { name: 'Знамя отряда', desc: 'Ауры группы +2%', effect: '+2% group aura / rank' },
  { name: 'Глухая оборона', desc: 'Пока HP <40%: броня +5%', effect: '+5% armor under 40% HP / rank' },
  { name: 'Яростный рывок', desc: 'Рывок наносит +10% урона', effect: '+10% charge dmg / rank' },
  { name: 'Мастер оружия', desc: 'Двуручное/одноручное +3%', effect: '+3% weapon mastery / rank' },
  { name: 'Непреклонность', desc: 'Смертельный удар оставляет 1 HP (1/бой, ранг 1)', effect: 'cheat death 1/fight' },
  { name: 'Полководец', desc: 'Кулдауны −3%', effect: '-3% all CD / rank' },
  { name: 'Крушитель', desc: 'Крит. шанс +1%', effect: '+1% crit / rank' },
  { name: 'Стена щитов', desc: 'Союзники за вами получают −2% урона', effect: 'cover allies -2% dmg / rank' },
  { name: 'Кровавый пир', desc: 'Убийство восстанавливает 2% HP', effect: '+2% HP on kill / rank' },
  { name: 'Легенда фронта', desc: 'Финальный узел: +5% урона и брони', effect: '+5% dmg & armor' },
  { name: 'Гвардия долины', desc: '+3% к опыту в группе', effect: '+3% group XP / rank' },
  { name: 'Закалка', desc: 'Сопр. огню/льду +2%', effect: '+2% elem resist / rank' },
  { name: 'Тактика клина', desc: 'Первый удар в бою +8%', effect: '+8% opening strike / rank' },
  { name: 'Ревень войны', desc: 'Клич даёт союзникам +2% урона', effect: 'shout allies +2% dmg / rank' },
  { name: 'Абсолютный воин', desc: 'Ключевой узел: +4% ко всему боевому', effect: '+4% combat power' },
];

export const WARRIOR: ClassPathDef = {
  id: 'warrior',
  kind: 'archetype',
  name: 'Воин',
  emoji: '⚔️',
  lore:
    'Воины Дубовой Долины — наследники Хранителя. В эпоху Печати они стояли стеной между деревнями и тварями Бездны. Их клятвы высечены на щите Старосты: «Сталь помнит, кровь платит».',
  concept:
    'Ближний бой, высокая живучесть, контроль темпа боя через Ярость. Универсальный фронт: может и танковать, и давить урон до выбора профессии.',
  rolePve: 'Танк / физический DPS ближнего боя',
  rolePvp: 'Брузер, давление, контроль через стан/рывок',
  strengths: ['Высокий HP и броня', 'Стабильный урон', 'Простой вход для новичков'],
  weaknesses: ['Слаб против дальнего кита', 'Мало мобильности до 20 ур.', 'Зависит от Ярости в долгих боях'],
  counters: ['Маг (киты)', 'Ассасин (бёрст)', 'Лучник (kite)'],
  resource: 'rage',
  resourceName: 'Ярость',
  resourceRules: '0–100. +10 за удар, +15 за получение урона, −5/сек вне боя. Навыки тратят ярость.',
  weapons: ['Одноручный меч + щит', 'Двуручный топор/меч', 'Булава'],
  armor: ['Тяжёлая (латы)', 'Средняя до 10 ур.'],
  baseStats: S(12, 6, 3, 4, 11, 4),
  growth: S(2, 1, 0, 0, 2, 0),
  skills: [
    skill('w_slash', 'Удар', '🗡️', 1, 'active', 'Базовая атака оружием.', 0, 0, {
      damage: { base: 8, coeff: 1.0, stat: 'str', wpnCoeff: 1.0, damageType: 'physical' },
    }),
    skill('w_charge', 'Рывок', '💨', 3, 'active', 'Бросок к цели, короткий стан 0.5 с.', 20, 12, {
      damage: { base: 15, coeff: 0.8, stat: 'str', damageType: 'physical' },
      effects: ['stun_0.5s'],
    }),
    skill('w_shout', 'Боевой клич', '📢', 6, 'active', '+10% урона себе на 8 с.', 25, 20),
    skill('w_cleave', 'Рассечение', '🌀', 10, 'active', 'Удар по дуге, до 3 целей.', 30, 8, {
      damage: { base: 12, coeff: 0.9, stat: 'str', wpnCoeff: 0.7, damageType: 'physical' },
    }),
    skill('w_iron', 'Железная кожа', '🛡️', 14, 'active', '−25% входящего урона на 5 с.', 40, 30),
    skill('w_exec', 'Добивание', '☠️', 18, 'active', '+50% урона по целям ниже 25% HP.', 35, 15, {
      damage: { base: 25, coeff: 1.4, stat: 'str', wpnCoeff: 1.0, damageType: 'physical' },
    }),
    skill('w_pass_armor', 'Закалка', '🧱', 5, 'passive', '+8% брони постоянно.'),
    skill('w_pass_rage', 'Вторая кровь', '🩸', 12, 'passive', 'При HP <30% ярость растёт вдвое.'),
  ],
  talents: makeTalentTree('war', WARRIOR_TALENT_THEMES),
  legendaryTalent: {
    id: 'war_legend',
    name: 'Клинок Хранителя',
    description: 'Раз в 3 мин.: 8 с неуязвимости к контролю и +20% урона. Символ клятвы Долины.',
  },
  builds: [
    { name: 'Стена', focus: 'Защита', keyTalents: ['Твёрдая стойка', 'Щит стены', 'Глухая оборона'], playstyle: 'Танк для группы' },
    { name: 'Жнец', focus: 'Урон', keyTalents: ['Кровожадность', 'Казнь', 'Крушитель'], playstyle: 'Соло-фарм и бёрст' },
  ],
  trial: {
    name: 'Испытание Стали',
    location: 'Тренировочный двор Дубовой Долины / арена у кузницы',
    objective: 'Победить трёх чемпионов (щит, двуруч, дуэль) без смерти. Выбор пути определяет профессию.',
    reward: 'Профессия Воина + уникальный титул «Испытанный Сталью»',
  },
};

// ── Warrior professions ──────────────────────────────────────────────────────

export const BERSERKER: ClassPathDef = {
  id: 'berserker',
  kind: 'profession',
  name: 'Берсерк',
  emoji: '🪓',
  parent: 'warrior',
  lore: 'Те, кто впустил ярость Бездны в кровь, но не отдал ей разум. Берсерки бьют сильнее, чем выдерживает тело.',
  concept: 'Высокий риск / высокая награда. Чем ниже HP, тем выше урон.',
  rolePve: 'Основной melee DPS',
  rolePvp: 'Бёрст-давление, all-in',
  strengths: ['Огромный урон в красной зоне HP', 'Сильный execute'],
  weaknesses: ['Хрупкий', 'Слабый старт боя'],
  counters: ['Контроль (стан-локи)', 'Киты'],
  resource: 'rage',
  resourceName: 'Ярость',
  resourceRules: 'Ярость + бонус урона (100−%HP)×0.4%.',
  weapons: ['Двуручный топор', 'Двуручный меч'],
  armor: ['Средняя / тяжёлая без щита'],
  baseStats: S(14, 7, 3, 3, 10, 4),
  growth: S(3, 1, 0, 0, 1, 0),
  skills: [
    skill('ber_frenzy', 'Бешенство', '🔥', 20, 'active', '+30% скорости атаки на 6 с, получаемый урон +10%.', 40, 25),
    skill('ber_blood', 'Кровавый удар', '🩸', 24, 'active', 'Урон растёт по мере потери HP.', 35, 10, {
      damage: { base: 30, coeff: 1.5, stat: 'str', wpnCoeff: 1.1, damageType: 'physical' },
    }),
    skill('ber_roar', 'Рёв', '😤', 28, 'active', 'Страх 1.5 с по конусу.', 30, 22),
    skill('ber_ramp', 'Неистовство', '💥', 32, 'passive', 'Каждое убийство продлевает Бешенство на 1 с.'),
    skill('ber_last', 'Последний рубеж', '☠️', 36, 'active', 'На 4 с: нельзя умереть, но HP = 1 в конце.', 0, 120),
  ],
  talents: makeTalentTree('ber', WARRIOR_TALENT_THEMES.map((t, i) => ({
    ...t,
    name: i < 5 ? ['Жажда крови', 'Слом кости', 'Красная пелена', 'Рваная рана', 'Смерч топоров'][i] : t.name,
  }))),
  legendaryTalent: {
    id: 'ber_legend',
    name: 'Сердце Бездны',
    description: 'При HP <20% все навыки без стоимости ярости на 5 с (раз в бой).',
  },
  builds: [
    { name: 'Кровавый жнец', focus: 'Execute', keyTalents: ['Казнь', 'Кровожадность'], playstyle: 'Добивание пачек' },
    { name: 'Тотальный бёрст', focus: 'Frenzy', keyTalents: ['Бешенство', 'Крушитель'], playstyle: 'PvP all-in' },
  ],
  trial: {
    name: 'Кровь и сталь',
    location: 'Волчья пещера — арена главаря',
    objective: 'Победить эхо Берсерка, удерживая HP ниже 50% не менее 20 с суммарно.',
    reward: 'Профессия Берсерк',
  },
};

export const GUARDIAN: ClassPathDef = {
  id: 'guardian',
  kind: 'profession',
  name: 'Страж',
  emoji: '🛡️',
  parent: 'warrior',
  lore: 'Стражи клянутся щитом Долины. Их место — между ударом и союзником.',
  concept: 'Классический танк: угроза, провокация, щиты.',
  rolePve: 'Основной танк',
  rolePvp: 'Пелер, анти-бёрст, защита кэри',
  strengths: ['Лучшая выживаемость', 'Групповая защита'],
  weaknesses: ['Низкий урон', 'Слаб в соло-фарме'],
  counters: ['Магический бёрст через щит', 'Анти-танк яды'],
  resource: 'rage',
  resourceName: 'Ярость',
  resourceRules: 'Ярость от блоков и провокаций.',
  weapons: ['Меч/булава + щит'],
  armor: ['Тяжёлая + щит'],
  baseStats: S(11, 5, 3, 5, 14, 3),
  growth: S(1, 0, 0, 1, 3, 0),
  skills: [
    skill('gua_taunt', 'Провокация', '🎯', 20, 'active', 'Принудительная угроза 4 с.', 15, 8),
    skill('gua_wall', 'Стена щитов', '🧱', 24, 'active', 'Союзники в радиусе −15% урона на 6 с.', 35, 25),
    skill('gua_bash', 'Удар щитом', '🔨', 28, 'active', 'Стан 1.5 с.', 25, 12, {
      damage: { base: 18, coeff: 0.6, stat: 'str', damageType: 'physical' },
      effects: ['stun_1.5s'],
    }),
    skill('gua_last', 'Последний бастион', '🏰', 34, 'active', 'Перенаправляет 40% урона с союзника на себя 5 с.', 40, 40),
  ],
  talents: makeTalentTree('gua', WARRIOR_TALENT_THEMES),
  legendaryTalent: {
    id: 'gua_legend',
    name: 'Щит Хранителя',
    description: 'Раз в 2 мин.: абсолютный блок всех атак 3 с.',
  },
  builds: [
    { name: 'Бастион', focus: 'Группа', keyTalents: ['Стена щитов', 'Знамя отряда'], playstyle: 'Рейдовый танк' },
  ],
  trial: {
    name: 'Щит Долины',
    location: 'Деревня — защита NPC от волн',
    objective: 'Удержать старосту живым 3 волны, не используя зелья >2 раз.',
    reward: 'Профессия Страж',
  },
};

export const DUELIST: ClassPathDef = {
  id: 'duelist',
  kind: 'profession',
  name: 'Дуэлянт',
  emoji: '🤺',
  parent: 'warrior',
  lore: 'Школа клинка с восточного тракта. Честь — в точности, а не в силе удара.',
  concept: 'Парирование, рипост, мобильный fencing-стиль.',
  rolePve: 'Гибкий melee DPS',
  rolePvp: 'Дуэли 1v1, контр-атака',
  strengths: ['Парирование', 'Мобильность'],
  weaknesses: ['Слабее против AoE', 'Требует тайминга'],
  counters: ['Массовый AoE', 'Непрерывный DoT'],
  resource: 'stamina',
  resourceName: 'Выносливость',
  resourceRules: '0–100, реген 8/с вне ударов. Навыки тратят выносливость.',
  weapons: ['Шпага', 'Парные клинки', 'Рапира'],
  armor: ['Средняя'],
  baseStats: S(10, 12, 3, 4, 9, 5),
  growth: S(1, 2, 0, 0, 1, 1),
  skills: [
    skill('due_parry', 'Парирование', '⚔️', 20, 'active', '1.2 с окно парирования → автоматический рипост.', 20, 10),
    skill('due_lunge', 'Выпад', '🗡️', 24, 'active', 'Дальний укол + замедление.', 25, 8, {
      damage: { base: 22, coeff: 1.1, stat: 'agi', wpnCoeff: 1.0, damageType: 'physical' },
    }),
    skill('due_flour', 'Фехтовальный цвет', '✨', 30, 'active', '3 быстрых удара.', 35, 14, {
      damage: { base: 12, coeff: 0.7, stat: 'agi', damageType: 'physical' },
    }),
  ],
  talents: makeTalentTree('due', WARRIOR_TALENT_THEMES),
  legendaryTalent: {
    id: 'due_legend',
    name: 'Зеркальный клинок',
    description: 'Успешное парирование отражает 50% урона атакующему.',
  },
  builds: [
    { name: 'Рипост', focus: 'Парирование', keyTalents: ['Контрудар', 'Парирование'], playstyle: '1v1' },
  ],
  trial: {
    name: 'Честь клинка',
    location: 'Заброшенная дорога — дуэльный круг',
    objective: 'Победить мастера дуэли, парировав не менее 5 атак.',
    reward: 'Профессия Дуэлянт',
  },
};

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

// ── Level 40 specializations (brief, code-ready) ─────────────────────────────

function spec(
  id: SpecializationId, name: string, emoji: string, parent: ProfessionId,
  concept: string, legendary: string,
): ClassPathDef {
  return {
    id, kind: 'specialization', name, emoji, parent,
    lore: `${name} — путь, открывающийся на 40 уровне после глубокого испытания профессии.`,
    concept,
    rolePve: 'Углубление роли профессии',
    rolePvp: 'Уникальная механика спека',
    strengths: ['Сильнее в узкой нише'],
    weaknesses: ['Меньше гибкости'],
    counters: ['Контр-спеки'],
    resource: 'mana',
    resourceName: 'По ресурсу родителя',
    resourceRules: 'Наследует профессию + уникальный модификатор спека.',
    weapons: ['Как у профессии'],
    armor: ['Как у профессии'],
    baseStats: S(8, 8, 8, 8, 8, 5),
    growth: S(1, 1, 1, 1, 1, 0),
    skills: [
      skill(`${id}_capstone`, `Ключ: ${name}`, emoji, 40, 'active', concept, 40, 45),
    ],
    talents: makeTalentTree(id.slice(0, 5), WARRIOR_TALENT_THEMES),
    legendaryTalent: { id: `${id}_leg`, name: `Легенда: ${name}`, description: legendary },
    builds: [{ name: 'Основной', focus: concept, keyTalents: [], playstyle: concept }],
    trial: {
      name: `Испытание ${name}`,
      location: 'По сюжета (шахта / перевал / крепость)',
      objective: 'Уникальный сценарий профессии на 40 уровне.',
      reward: `Специализация ${name}`,
    },
  };
}

export const SPECIALIZATIONS: ClassPathDef[] = [
  spec('bloodreaver', 'Кровопийца', '🩸', 'berserker', 'Вампирический берсерк', 'Убийства полностью лечат'),
  spec('warlord', 'Воевода', '👑', 'berserker', 'Ауры ярости для группы', 'Группа +15% урона 10 с'),
  spec('bulwark', 'Бастион', '🧱', 'guardian', 'Непробиваемый танк', 'Стена на 5 с для рейда'),
  spec('aegis', 'Эгида', '🪞', 'guardian', 'Отражение урона', 'Отражает 30% 4 с'),
  spec('blademaster', 'Мастер клинка', '⚔️', 'duelist', 'Серии комбо', '5-я атака ×2'),
  spec('riposte', 'Рипостер', '🪞', 'duelist', 'Идеальный парир', 'Парир сбрасывает КД'),
  spec('sharpshooter', 'Снайпер', '🎯', 'archer', 'Макс. дистанция', 'Выстрел через стены (линия)'),
  spec('pathfinder', 'Первопроходец', '🗺️', 'archer', 'Мобильный лучник', 'Выстрел в движении без штрафа'),
  spec('shadowblade', 'Теневой клинок', '🌑', 'assassin', 'Двойной стелс-бёрст', 'Вторая засада'),
  spec('nightblade', 'Ночной клинок', '🗡️', 'assassin', 'DoT-яд', 'Яды не снимаются'),
  spec('beastmaster', 'Повелитель зверей', '🐻', 'hunter', 'Два питомца', 'Второй пет 60% силы'),
  spec('trapper', 'Зверолов', '🪤', 'hunter', 'Капканы-мины', '3 капкана сразу'),
  spec('infernalist', 'Инферналист', '😈', 'pyromancer', 'Демон-огонь', 'Имп-помощник'),
  spec('ashwalker', 'Пеплоход', '🌫️', 'pyromancer', 'Мобильный поджог', 'Телепорт в огонь'),
  spec('frostweaver', 'Ткач льда', '🕸️', 'cryomancer', 'Зоны льда', 'Пол арены — лёд'),
  spec('glacier', 'Ледник', '🏔️', 'cryomancer', 'Абсолютный контроль', 'Пермачill'),
  spec('arcanist', 'Арканист', '💠', 'spellbinder', 'Чистый бёрст', 'Двойной каст'),
  spec('runekeeper', 'Хранитель рун', '🔠', 'spellbinder', 'Поддержка рунами', 'Руны на союзников'),
  spec('hierophant', 'Иерофант', '📿', 'priest', 'Рейд-хил', 'Глобальный хот'),
  spec('oracle', 'Оракул', '🔮', 'priest', 'Предвидение', 'Щит до удара'),
  spec('templar', 'Тамплиер', '🛡️', 'paladin', 'Танк света', 'Святая провокация'),
  spec('crusader', 'Крестоносец', '⚔️', 'paladin', 'Holy DPS', 'Кара-волна'),
  spec('spiritwalker', 'Духоход', '👻', 'shaman', 'Духи-питомцы', 'Предок сражается'),
  spec('stormcaller', 'Зовущий бурю', '⛈️', 'shaman', 'Молнии AoE', 'Гроза на зону'),
];

/** Full registry for lookups */
export const ALL_PATHS: Record<string, ClassPathDef> = {
  warrior: WARRIOR,
  berserker: BERSERKER,
  guardian: GUARDIAN,
  duelist: DUELIST,
  ranger: RANGER,
  archer: ARCHER,
  assassin: ASSASSIN,
  hunter: HUNTER,
  mage: MAGE,
  pyromancer: PYROMANCER,
  cryomancer: CRYOMANCER,
  spellbinder: SPELLBINDER,
  acolyte: ACOLYTE,
  priest: PRIEST,
  paladin: PALADIN,
  shaman: SHAMAN,
  ...Object.fromEntries(SPECIALIZATIONS.map(s => [s.id, s])),
};

export const ARCHETYPE_PROFESSIONS: Record<ArchetypeId, ProfessionId[]> = {
  warrior: ['berserker', 'guardian', 'duelist'],
  ranger: ['archer', 'assassin', 'hunter'],
  mage: ['pyromancer', 'cryomancer', 'spellbinder'],
  acolyte: ['priest', 'paladin', 'shaman'],
};

export const PROFESSION_SPECS: Record<ProfessionId, SpecializationId[]> = {
  berserker: ['bloodreaver', 'warlord'],
  guardian: ['bulwark', 'aegis'],
  duelist: ['blademaster', 'riposte'],
  archer: ['sharpshooter', 'pathfinder'],
  assassin: ['shadowblade', 'nightblade'],
  hunter: ['beastmaster', 'trapper'],
  pyromancer: ['infernalist', 'ashwalker'],
  cryomancer: ['frostweaver', 'glacier'],
  spellbinder: ['arcanist', 'runekeeper'],
  priest: ['hierophant', 'oracle'],
  paladin: ['templar', 'crusader'],
  shaman: ['spiritwalker', 'stormcaller'],
};

/** Player progression state (save-friendly). */
export interface PlayerClassState {
  archetype: ArchetypeId;
  profession?: ProfessionId;
  specialization?: SpecializationId;
  classPoints: number;
  spentClassTalents: Record<string, number>;
}

export function damageFromSkill(
  skill: ClassSkillDef,
  stats: StatBlock,
  weaponDmg = 0,
): number {
  if (!skill.damage) return 0;
  const { base, coeff, stat, wpnCoeff = 0 } = skill.damage;
  return Math.floor(base + coeff * stats[stat] + weaponDmg * wpnCoeff);
}
