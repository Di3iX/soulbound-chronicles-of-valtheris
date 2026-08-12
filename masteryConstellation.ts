/**
 * Созвездие Мастерства — Soulbound
 * Каждый уровень: +1 очко класса + 1 очко мастерства.
 * ≥250 узлов в 15 ветках.
 */

export type MasteryBranchId =
  | 'strength' | 'agility' | 'intellect' | 'spirit' | 'vitality' | 'luck'
  | 'defense' | 'speed' | 'vampirism' | 'regeneration'
  | 'craft' | 'trade' | 'exploration' | 'pets' | 'elements';

export interface MasteryNode {
  id: string;
  branch: MasteryBranchId;
  index: number; // 0..n within branch
  name: string;
  description: string;
  maxRank: number;
  /** Prerequisite node id in same branch (previous index) unless tier gate. */
  requires?: string;
  /** Min character level to unlock this node. */
  minLevel: number;
  effect: {
    type: string;
    valuePerRank: number;
    unit?: string;
  };
}

export interface MasteryBranch {
  id: MasteryBranchId;
  name: string;
  emoji: string;
  description: string;
  nodes: MasteryNode[];
}

const BRANCH_META: Array<{
  id: MasteryBranchId;
  name: string;
  emoji: string;
  description: string;
  effectType: string;
  value: number;
  unit: string;
  namePrefix: string;
}> = [
  { id: 'strength', name: 'Сила', emoji: '💪', description: 'Физический урон и грузоподъёмность.', effectType: 'str', value: 1, unit: 'stat', namePrefix: 'Железо' },
  { id: 'agility', name: 'Ловкость', emoji: '🏃', description: 'Крит, уклонение, скорость атаки.', effectType: 'agi', value: 1, unit: 'stat', namePrefix: 'Ветер' },
  { id: 'intellect', name: 'Интеллект', emoji: '🧠', description: 'Сила заклинаний и мана.', effectType: 'int', value: 1, unit: 'stat', namePrefix: 'Искра' },
  { id: 'spirit', name: 'Дух', emoji: '🕊️', description: 'Исцеление, вера, реген маны.', effectType: 'spi', value: 1, unit: 'stat', namePrefix: 'Свет' },
  { id: 'vitality', name: 'Выносливость', emoji: '❤️', description: 'Здоровье и стойкость.', effectType: 'vit', value: 1, unit: 'stat', namePrefix: 'Корень' },
  { id: 'luck', name: 'Удача', emoji: '🍀', description: 'Лут, крит, редкие находки.', effectType: 'lck', value: 1, unit: 'stat', namePrefix: 'Удача' },
  { id: 'defense', name: 'Защита', emoji: '🛡️', description: 'Броня и сопротивление.', effectType: 'armor_pct', value: 0.5, unit: '%', namePrefix: 'Щит' },
  { id: 'speed', name: 'Скорость', emoji: '⚡', description: 'Перемещение и скорость атаки.', effectType: 'haste_pct', value: 0.4, unit: '%', namePrefix: 'Миг' },
  { id: 'vampirism', name: 'Вампиризм', emoji: '🩸', description: 'Урон в лечение.', effectType: 'lifesteal_pct', value: 0.3, unit: '%', namePrefix: 'Кровь' },
  { id: 'regeneration', name: 'Регенерация', emoji: '💚', description: 'Восстановление HP/мана вне и в бою.', effectType: 'regen_pct', value: 0.5, unit: '%', namePrefix: 'Росток' },
  { id: 'craft', name: 'Ремесло', emoji: '🔨', description: 'Шанс успеха крафта и качество.', effectType: 'craft_success_pct', value: 0.5, unit: '%', namePrefix: 'Навык' },
  { id: 'trade', name: 'Торговля', emoji: '💰', description: 'Цены торговцев и золото с мобов.', effectType: 'gold_pct', value: 0.6, unit: '%', namePrefix: 'Сделка' },
  { id: 'exploration', name: 'Исследование', emoji: '🗺️', description: 'Опыт, скорость бега по миру, сундуки.', effectType: 'xp_pct', value: 0.5, unit: '%', namePrefix: 'Тропа' },
  { id: 'pets', name: 'Питомцы', emoji: '🐾', description: 'Сила питомцев и спутников.', effectType: 'pet_pct', value: 0.8, unit: '%', namePrefix: 'Стая' },
  { id: 'elements', name: 'Стихии', emoji: '🔥', description: 'Огонь, лёд, природа, аркана, святость.', effectType: 'element_pct', value: 0.5, unit: '%', namePrefix: 'Стихия' },
];

const NODES_PER_BRANCH = 17; // 15 × 17 = 255

function buildBranch(meta: typeof BRANCH_META[0]): MasteryBranch {
  const nodes: MasteryNode[] = [];
  for (let i = 0; i < NODES_PER_BRANCH; i++) {
    const id = `mst_${meta.id}_${i}`;
    const tier = Math.floor(i / 4); // 0..4
    const isCapstone = i === NODES_PER_BRANCH - 1;
    const isMilestone = i > 0 && i % 4 === 3;
    nodes.push({
      id,
      branch: meta.id,
      index: i,
      name: isCapstone
        ? `${meta.namePrefix}: Созвездие`
        : isMilestone
          ? `${meta.namePrefix}: Узел ${tier + 1}`
          : `${meta.namePrefix} ${i + 1}`,
      description: isCapstone
        ? `Финальный узел ветки «${meta.name}»: мощный бонус.`
        : `Усиливает ${meta.description.toLowerCase()}`,
      maxRank: isCapstone ? 1 : isMilestone ? 2 : 3,
      requires: i > 0 ? `mst_${meta.id}_${i - 1}` : undefined,
      minLevel: 1 + i * 2, // spreads to ~33, soft gate
      effect: {
        type: meta.effectType,
        valuePerRank: isCapstone ? meta.value * 5 : isMilestone ? meta.value * 2 : meta.value,
        unit: meta.unit,
      },
    });
  }
  return {
    id: meta.id,
    name: meta.name,
    emoji: meta.emoji,
    description: meta.description,
    nodes,
  };
}

export const MASTERY_BRANCHES: MasteryBranch[] = BRANCH_META.map(buildBranch);

export const ALL_MASTERY_NODES: MasteryNode[] = MASTERY_BRANCHES.flatMap(b => b.nodes);

export const MASTERY_NODE_COUNT = ALL_MASTERY_NODES.length; // 255

export interface PlayerMasteryState {
  points: number;
  ranks: Record<string, number>; // nodeId → rank
}

export function createEmptyMastery(): PlayerMasteryState {
  return { points: 0, ranks: {} };
}

export function canUnlockNode(
  state: PlayerMasteryState,
  node: MasteryNode,
  playerLevel: number,
): { ok: boolean; reason?: string } {
  if (playerLevel < node.minLevel) {
    return { ok: false, reason: `Нужен ${node.minLevel} уровень` };
  }
  const current = state.ranks[node.id] ?? 0;
  if (current >= node.maxRank) {
    return { ok: false, reason: 'Максимальный ранг' };
  }
  if (node.requires) {
    const req = ALL_MASTERY_NODES.find(n => n.id === node.requires);
    if (!req || (state.ranks[req.id] ?? 0) < 1) {
      return { ok: false, reason: 'Сначала предыдущий узел' };
    }
  }
  if (state.points < 1) {
    return { ok: false, reason: 'Нет очков мастерства' };
  }
  return { ok: true };
}

export function spendMasteryPoint(
  state: PlayerMasteryState,
  nodeId: string,
  playerLevel: number,
): PlayerMasteryState {
  const node = ALL_MASTERY_NODES.find(n => n.id === nodeId);
  if (!node) return state;
  const check = canUnlockNode(state, node, playerLevel);
  if (!check.ok) return state;
  return {
    points: state.points - 1,
    ranks: {
      ...state.ranks,
      [nodeId]: (state.ranks[nodeId] ?? 0) + 1,
    },
  };
}

/** Aggregate bonuses from spent mastery (for stats pipeline). */
export function sumMasteryBonuses(state: PlayerMasteryState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [nodeId, rank] of Object.entries(state.ranks)) {
    if (rank <= 0) continue;
    const node = ALL_MASTERY_NODES.find(n => n.id === nodeId);
    if (!node) continue;
    const key = node.effect.type;
    out[key] = (out[key] ?? 0) + node.effect.valuePerRank * rank;
  }
  return out;
}

/** On level-up: grant 1 class point + 1 mastery point. */
export function pointsPerLevel(): { classPoints: number; masteryPoints: number } {
  return { classPoints: 1, masteryPoints: 1 };
}
