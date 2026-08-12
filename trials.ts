/**
 * Step 5: Profession (20) & Specialization (40) trials.
 * Kill-based quests + turn-in at elder unlocks chooseProfession / chooseSpecialization.
 */
import type { QuestDef, QuestProgress } from '../quests/quests';
import type { ArchetypeId, ProfessionId, SpecializationId } from './classSystem';
import { ALL_PATHS, ARCHETYPE_PROFESSIONS, PROFESSION_SPECS } from './classSystem';
import type { PlayerClassState } from './playerClass';
import { chooseProfession, chooseSpecialization } from './playerClass';

export interface TrialDef {
  id: string;
  tier: 20 | 40;
  /** Which path this trial belongs to (archetype for 20, profession for 40). */
  forPath: string;
  /** Profession or specialization unlocked on completion (player still picks if multiple). */
  unlocks: string[];
  quest: QuestDef;
}

function trialQuest(
  id: string,
  title: string,
  description: string,
  objective: string,
  required: number,
  killTargets: string[],
  xp: number,
  gold: number,
): QuestDef {
  return {
    id,
    title,
    description,
    npcId: 'elder',
    objective: { description: objective, required },
    killTargets,
    reward: { gold, xp, items: ['greater_healing_potion'] },
  };
}

/** Level 20 — one trial per archetype (shared objective; choice of 3 professions after). */
export const TRIALS_20: TrialDef[] = [
  {
    id: 'trial_warrior_20',
    tier: 20,
    forPath: 'warrior',
    unlocks: ['berserker', 'guardian', 'duelist'],
    quest: trialQuest(
      'trial_warrior_20',
      'Испытание Стали',
      'Староста: «Докажи, что клинок Долины тебе по плечу. Победи достойных врагов в открытом поле и у пещеры.»',
      'Убить сильных врагов (кабан, волк, гоблин, бандит)',
      12,
      ['Молодой кабан', 'Огромный Кабан', 'Волк', 'Гоблин', 'Бандит', 'Альфа-волк'],
      400,
      200,
    ),
  },
  {
    id: 'trial_ranger_20',
    tier: 20,
    forPath: 'ranger',
    unlocks: ['archer', 'assassin', 'hunter'],
    quest: trialQuest(
      'trial_ranger_20',
      'Тропа охотника',
      'Охотник и Староста ждут: отмеченная добыча в полях и лесу. Держи дистанцию — стиль следопыта.',
      'Убить зверей и разведцели леса',
      12,
      ['Кролик', 'Ворон', 'Молодой кабан', 'Волк', 'Гоблин', 'Огромный Кабан'],
      400,
      200,
    ),
  },
  {
    id: 'trial_mage_20',
    tier: 20,
    forPath: 'mage',
    unlocks: ['pyromancer', 'cryomancer', 'spellbinder'],
    quest: trialQuest(
      'trial_mage_20',
      'Испытание Искры',
      'Только магия против скверны руин и леса. Староста не любит аркану — но Печать требует силы.',
      'Убить магически уязвимых (скелет, призрак, гоблин, слизень)',
      10,
      ['Скелет', 'Призрак', 'Зомби', 'Гоблин', 'Слизень'],
      420,
      220,
    ),
  },
  {
    id: 'trial_acolyte_20',
    tier: 20,
    forPath: 'acolyte',
    unlocks: ['priest', 'paladin', 'shaman'],
    quest: trialQuest(
      'trial_acolyte_20',
      'Испытание Веры',
      'Лекарь и Староста: защити живых. Срази нежить и яд болот — и сохрани себя.',
      'Убить скверну (нежить, пауки, болотники)',
      10,
      ['Скелет', 'Зомби', 'Призрак', 'Ядовитый паук', 'Болотник', 'Слизень'],
      420,
      220,
    ),
  },
];

/** Level 40 — one trial per profession. */
export const TRIALS_40: TrialDef[] = [
  ...(['berserker', 'guardian', 'duelist'] as ProfessionId[]).map(pid => ({
    id: `trial_${pid}_40`,
    tier: 40 as const,
    forPath: pid,
    unlocks: [...PROFESSION_SPECS[pid]],
    quest: trialQuest(
      `trial_${pid}_40`,
      `Путь: ${ALL_PATHS[pid].name}`,
      ALL_PATHS[pid].trial?.objective
        ?? 'Победи элиту шахты, перевала или крепости — докажи мастерство профессии.',
      'Убить элитных врагов (боссы и сильные мобы конца игры)',
      8,
      [
        'Каменный страж', 'Владыка перевала', 'Король льда',
        'Горный тролль', 'Голем', 'Рыцарь льда', 'Маг льда',
      ],
      900,
      500,
    ),
  })),
  ...(['archer', 'assassin', 'hunter'] as ProfessionId[]).map(pid => ({
    id: `trial_${pid}_40`,
    tier: 40 as const,
    forPath: pid,
    unlocks: [...PROFESSION_SPECS[pid]],
    quest: trialQuest(
      `trial_${pid}_40`,
      `Путь: ${ALL_PATHS[pid].name}`,
      'Испытание дальнего пути и тени: элита гор и крепости.',
      'Убить элитных врагов',
      8,
      [
        'Каменный страж', 'Владыка перевала', 'Король льда',
        'Гарпия', 'Йети', 'Рыцарь льда',
      ],
      900,
      500,
    ),
  })),
  ...(['pyromancer', 'cryomancer', 'spellbinder'] as ProfessionId[]).map(pid => ({
    id: `trial_${pid}_40`,
    tier: 40 as const,
    forPath: pid,
    unlocks: [...PROFESSION_SPECS[pid]],
    quest: trialQuest(
      `trial_${pid}_40`,
      `Путь: ${ALL_PATHS[pid].name}`,
      'Стихии против льда крепости и камня шахты.',
      'Убить элитных врагов',
      8,
      [
        'Каменный страж', 'Король льда', 'Маг льда', 'Рыцарь льда',
        'Хранитель склепа', 'Трясинный ужас',
      ],
      900,
      500,
    ),
  })),
  ...(['priest', 'paladin', 'shaman'] as ProfessionId[]).map(pid => ({
    id: `trial_${pid}_40`,
    tier: 40 as const,
    forPath: pid,
    unlocks: [...PROFESSION_SPECS[pid]],
    quest: trialQuest(
      `trial_${pid}_40`,
      `Путь: ${ALL_PATHS[pid].name}`,
      'Вера против тьмы крепости и перевала.',
      'Убить элитных врагов',
      8,
      [
        'Король льда', 'Владыка перевала', 'Каменный страж',
        'Рыцарь льда', 'Горный тролль',
      ],
      900,
      500,
    ),
  })),
];

export const ALL_TRIALS: TrialDef[] = [...TRIALS_20, ...TRIALS_40];

export const TRIAL_QUEST_DEFS: Record<string, QuestDef> = Object.fromEntries(
  ALL_TRIALS.map(t => [t.quest.id, t.quest]),
);

/** Merge into QUEST_DEFS in App or quests.ts */
export function mergeTrialQuests(
  base: Record<string, QuestDef>,
): Record<string, QuestDef> {
  return { ...base, ...TRIAL_QUEST_DEFS };
}

export function getTrial20ForArchetype(archetype: ArchetypeId): TrialDef | undefined {
  return TRIALS_20.find(t => t.forPath === archetype);
}

export function getTrial40ForProfession(profession: ProfessionId): TrialDef | undefined {
  return TRIALS_40.find(t => t.forPath === profession);
}

export function isTrialReady(
  progress: QuestProgress,
  trialId: string,
): boolean {
  const e = progress[trialId];
  const def = TRIAL_QUEST_DEFS[trialId];
  if (!def || !e || e.status !== 'active') return false;
  return e.current >= def.objective.required;
}

export function isTrialCompleted(progress: QuestProgress, trialId: string): boolean {
  return progress[trialId]?.status === 'completed';
}

/** Offer trial quest when level gate reached and not yet taken. */
export function offerTrialIfEligible(
  progress: QuestProgress,
  classState: PlayerClassState,
  level: number,
): { progress: QuestProgress; offered?: TrialDef; log?: string } {
  if (level >= 20 && !classState.profession) {
    const t = getTrial20ForArchetype(classState.archetype);
    if (t && (!progress[t.id] || progress[t.id].status === 'inactive')) {
      return {
        progress: {
          ...progress,
          [t.id]: { status: 'active', current: progress[t.id]?.current ?? 0 },
        },
        offered: t,
        log: `📜 Испытание доступно: «${t.quest.title}». Сдай у Старосты.`,
      };
    }
  }
  if (level >= 40 && classState.profession && !classState.specialization) {
    const t = getTrial40ForProfession(classState.profession);
    if (t && (!progress[t.id] || progress[t.id].status === 'inactive')) {
      return {
        progress: {
          ...progress,
          [t.id]: { status: 'active', current: progress[t.id]?.current ?? 0 },
        },
        offered: t,
        log: `📜 Испытание мастерства: «${t.quest.title}».`,
      };
    }
  }
  return { progress };
}

/**
 * Complete trial at elder: mark quest done, return unlock list for UI pick.
 */
export function completeTrial(
  progress: QuestProgress,
  classState: PlayerClassState,
  trialId: string,
  level: number,
): {
  progress: QuestProgress;
  classState: PlayerClassState;
  unlocks: string[];
  tier: 20 | 40;
  logs: string[];
  error?: string;
} {
  const trial = ALL_TRIALS.find(t => t.id === trialId);
  if (!trial) {
    return { progress, classState, unlocks: [], tier: 20, logs: [], error: 'Нет испытания' };
  }
  if (!isTrialReady(progress, trialId) && progress[trialId]?.status !== 'completed') {
    // allow complete only if ready
    if (!isTrialReady(progress, trialId)) {
      return {
        progress, classState, unlocks: [], tier: trial.tier, logs: [],
        error: 'Цели испытания не выполнены',
      };
    }
  }
  const nextProgress: QuestProgress = {
    ...progress,
    [trialId]: { status: 'completed', current: trial.quest.objective.required },
  };
  const logs = [
    `✅ Испытание «${trial.quest.title}» завершено!`,
    `💰 +${trial.quest.reward.gold} золота · ✨ +${trial.quest.reward.xp} опыта`,
  ];
  return {
    progress: nextProgress,
    classState,
    unlocks: trial.unlocks,
    tier: trial.tier,
    logs,
  };
}

/** After player picks from unlocks list. */
export function applyTrialChoice(
  classState: PlayerClassState,
  choiceId: string,
  tier: 20 | 40,
  level: number,
): { classState: PlayerClassState; error?: string; log?: string } {
  if (tier === 20) {
    const r = chooseProfession(classState, choiceId as ProfessionId, level);
    if (r.error) return { classState, error: r.error };
    return {
      classState: r.state,
      log: `⚔️ Профессия: ${ALL_PATHS[choiceId]?.name ?? choiceId}`,
    };
  }
  const r = chooseSpecialization(classState, choiceId as SpecializationId, level);
  if (r.error) return { classState, error: r.error };
  return {
    classState: r.state,
    log: `✨ Специализация: ${ALL_PATHS[choiceId]?.name ?? choiceId}`,
  };
}

export function professionsForArchetype(a: ArchetypeId): ProfessionId[] {
  return ARCHETYPE_PROFESSIONS[a];
}
