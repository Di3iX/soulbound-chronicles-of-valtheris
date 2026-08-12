/**
 * Soulbound: Chronicles of Valtheris — Class / Profession / Specialization system
 * Shared types + data-builder helpers used by every archetype file in ./paths/.
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

export const S = (str: number, agi: number, int: number, spi: number, vit: number, lck: number): StatBlock =>
  ({ str, agi, int, spi, vit, lck });

export function skill(
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
export function makeTalentTree(
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
