import { S, skill, makeTalentTree, type ClassPathDef } from './shared';

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHETYPE: WARRIOR
// ═══════════════════════════════════════════════════════════════════════════════

export const WARRIOR_TALENT_THEMES = [
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

