/**
 * UI icon registry — icons_64x64 pack.
 * Path: src/game/ui/uiIcons.ts
 * Files: public/assets/sprites/icons/icon_XXX_....png
 */
export const ICON_BASE = '/assets/sprites/icons';

/** Semantic → filename in the pack */
export const UI_ICONS = {
  // Top / panels (main toolbar — adjust if wrong after visual check)
  character: 'icon_000_main_r0_c0.png',
  inventory: 'icon_001_main_r0_c1.png',
  quests:    'icon_002_main_r0_c2.png',
  map:       'icon_003_main_r0_c3.png',
  skills:    'icon_004_main_r0_c4.png',
  shop:      'icon_005_main_r1_c0.png',
  class:     'icon_006_main_r1_c1.png',
  mail:      'icon_007_main_r1_c2.png',
  friends:   'icon_008_main_r1_c3.png',
  settings:  'icon_009_main_r1_c4.png',

  // Combat skills (row matching reference: strike, guard, aoe, dash, rage, lock)
  skill_strike: 'icon_010_combat_r0_c0.png',
  skill_guard:  'icon_011_combat_r0_c1.png',
  skill_aoe:    'icon_012_combat_r0_c2.png',
  skill_dash:   'icon_013_combat_r0_c3.png',
  skill_rage:   'icon_014_combat_r0_c4.png',
  skill_lock:   'icon_015_combat_r2_c0.png',
  skill_heal:   'icon_016_combat_r2_c1.png',
  skill_buff:   'icon_017_combat_r2_c2.png',
  skill_bolt:   'icon_018_combat_r2_c3.png',
  skill_fire:   'icon_019_combat_r2_c4.png',

  // Currency
  gold:   'icon_020_currency_r0_c0.png',
  gem:    'icon_021_currency_r0_c1.png',
  crystal:'icon_022_currency_r0_c2.png',
  token:  'icon_023_currency_r0_c3.png',
  coin:   'icon_024_currency_r0_c4.png',

  // Items / potion
  potion: 'icon_029_items_r0_c0.png',
  potion_mana: 'icon_030_items_r0_c1.png',
  scroll: 'icon_031_items_r0_c2.png',
  key:    'icon_032_items_r0_c3.png',
  chest:  'icon_033_items_r0_c4.png',

  // Interface
  close:  'icon_044_interface_r0_c0.png',
  check:  'icon_045_interface_r0_c1.png',
  arrow:  'icon_046_interface_r0_c2.png',
  menu:   'icon_047_interface_r0_c3.png',
  info:   'icon_048_interface_r0_c4.png',
} as const;

export type UiIconId = keyof typeof UI_ICONS;

export function iconUrl(id: UiIconId | string): string {
  const file = (UI_ICONS as Record<string, string>)[id] ?? id;
  if (!file) return '';
  if (file.startsWith('http') || file.startsWith('/')) return file;
  return `${ICON_BASE}/${file}`;
}

/** Heuristic skill-id → combat icon */
export function skillIconFile(skillId: string, skillName: string): string {
  const s = `${skillId} ${skillName}`.toLowerCase();
  if (s.includes('shield') || s.includes('защит') || s.includes('guard') || s.includes('block')) {
    return UI_ICONS.skill_guard;
  }
  if (s.includes('heal') || s.includes('исцел') || s.includes('лечен')) {
    return UI_ICONS.skill_heal;
  }
  if (s.includes('rage') || s.includes('ярость') || s.includes('berserk')) {
    return UI_ICONS.skill_rage;
  }
  if (s.includes('dash') || s.includes('рывок') || s.includes('sprint')) {
    return UI_ICONS.skill_dash;
  }
  if (s.includes('aoe') || s.includes('круг') || s.includes('whirl') || s.includes('spin')) {
    return UI_ICONS.skill_aoe;
  }
  if (s.includes('fire') || s.includes('огн')) {
    return UI_ICONS.skill_fire;
  }
  if (s.includes('bolt') || s.includes('молни') || s.includes('arcane')) {
    return UI_ICONS.skill_bolt;
  }
  if (s.includes('buff') || s.includes('клич') || s.includes('aura')) {
    return UI_ICONS.skill_buff;
  }
  return UI_ICONS.skill_strike;
}
