// ─── SKILL TREE DEFINITIONS ───────────────────────────────────────────────────

export const SKILL_POINTS_PER_LEVEL = 1;

export interface SkillDef {
  id:          string;
  name:        string;
  description: string;
  maxLevel:    number;
  cost:        number;          // skill points per upgrade (always 1)
  tree:        'warrior' | 'ranger' | 'mage';
}

export interface SkillTree {
  id:     'warrior' | 'ranger' | 'mage';
  name:   string;
  emoji:  string;
  skills: SkillDef[];
}

export const SKILL_TREES: SkillTree[] = [
  {
    id: 'warrior', name: 'Воин', emoji: '⚔️',
    skills: [
      {
        id: 'power_strike', name: 'Мощный удар', tree: 'warrior',
        description: '+5% к урону за уровень',
        maxLevel: 5, cost: 1,
      },
      {
        id: 'iron_skin', name: 'Железная кожа', tree: 'warrior',
        description: '+10 максимального HP за уровень',
        maxLevel: 5, cost: 1,
      },
    ],
  },
  {
    id: 'ranger', name: 'Рейнджер', emoji: '🏹',
    skills: [
      {
        id: 'quick_hands', name: 'Быстрые руки', tree: 'ranger',
        description: '+3% к скорости атаки за уровень',
        maxLevel: 5, cost: 1,
      },
      {
        id: 'precision', name: 'Меткость', tree: 'ranger',
        description: '+2% к шансу крит. удара за уровень',
        maxLevel: 5, cost: 1,
      },
    ],
  },
  {
    id: 'mage', name: 'Маг', emoji: '🧙',
    skills: [
      {
        id: 'arcane_knowledge', name: 'Тайные знания', tree: 'mage',
        description: '+5 маны за уровень (в разработке)',
        maxLevel: 5, cost: 1,
      },
      {
        id: 'wisdom', name: 'Мудрость', tree: 'mage',
        description: '+2% к получаемому опыту за уровень',
        maxLevel: 5, cost: 1,
      },
    ],
  },
];

/** Fast lookup by skill id. */
export const ALL_SKILLS_MAP: Record<string, SkillDef> = Object.fromEntries(
  SKILL_TREES.flatMap(t => t.skills).map(s => [s.id, s]),
);
