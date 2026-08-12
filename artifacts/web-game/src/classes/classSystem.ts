/**
 * Soulbound: Chronicles of Valtheris — Class / Profession / Specialization system
 * Aggregator: re-exports shared types + every archetype's paths from ./paths/,
 * then builds the cross-archetype lookup tables and the level-40 specializations.
 * Levels: 1–20 archetype → 20 profession → 40 specialization.
 */
export type {
  ArchetypeId, ProfessionId, SpecializationId, ResourceType, PrimaryStat,
  StatBlock, ClassSkillDef, TalentNode, ClassPathDef,
} from './paths/shared';
export { S, skill, makeTalentTree } from './paths/shared';

import type { ArchetypeId, ProfessionId, SpecializationId, ClassPathDef, ClassSkillDef, StatBlock } from './paths/shared';
import { S, skill, makeTalentTree } from './paths/shared';
import { WARRIOR_TALENT_THEMES, WARRIOR, BERSERKER, GUARDIAN, DUELIST } from './paths/warrior';
import { RANGER, ARCHER, ASSASSIN, HUNTER } from './paths/ranger';
import { MAGE, PYROMANCER, CRYOMANCER, SPELLBINDER } from './paths/mage';
import { ACOLYTE, PRIEST, PALADIN, SHAMAN } from './paths/acolyte';

export { WARRIOR, BERSERKER, GUARDIAN, DUELIST } from './paths/warrior';
export { RANGER, ARCHER, ASSASSIN, HUNTER } from './paths/ranger';
export { MAGE, PYROMANCER, CRYOMANCER, SPELLBINDER } from './paths/mage';
export { ACOLYTE, PRIEST, PALADIN, SHAMAN } from './paths/acolyte';

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
