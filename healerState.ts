// ─── HEALER STATE ─────────────────────────────────────────────────────────────
// Extracted from App.tsx: free-heal-per-day tracking (localStorage) and
// recoverable-XP-on-death tracking (sessionStorage). Pure, no React involved —
// shared by App.tsx's buildDialogueFlags and the 'heal' quest-dialogue action.
export const HEAL_COST    = 25;
export const FREE_PER_DAY = 10;

export function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function loadHealState() {
  try {
    const day  = localStorage.getItem('sb_heal_day');
    const left = Number(localStorage.getItem('sb_free_heals') ?? FREE_PER_DAY);
    if (day !== todayKey()) {
      localStorage.setItem('sb_heal_day', todayKey());
      localStorage.setItem('sb_free_heals', String(FREE_PER_DAY));
      return FREE_PER_DAY;
    }
    return Math.max(0, left);
  } catch {
    return FREE_PER_DAY;
  }
}

export function getRecoverableXp() {
  try { return Number(sessionStorage.getItem('sb_recoverable_xp') || '0'); }
  catch { return 0; }
}
