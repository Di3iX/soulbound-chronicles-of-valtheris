// ─── WORLD MOVEMENT (tile movement, location transitions, world-map travel, aggro) ─
// Extracted from App.tsx: everything that moves the player around the map,
// intercepts NPCs/enemies/chests/exits on the destination tile, and the two
// aggro effects that only make sense while exploring.
import { useCallback, useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Item } from '../inventory';
import { addToInventory } from '../inventory';
import type { LocationId, Phase, Enemy } from '../combat';
import { makeLocationEnemies } from '../combat';
import {
  MAP_COLS, MAP_ROWS, LOCATION_META, LOCATION_SPAWN, LOCATION_EXITS, LOCATION_MAPS, LOCATION_NPCS,
  getLocation, type NpcDef,
} from '../world/locations';
import { canEnterLocation } from '../world/progression';
import { type OpenedChests, getChestsAt, openChest } from '../world/chests';
import { updateAggro, stepAggroEnemies, clearAllAggro } from '../aggro';
import type { QuestProgress } from '../quests/quests';
import { type NpcDialogue, getNpcDialogue } from '../quests/npc';
import type { BossState } from '../boss/boss';
import type { FloatingNum } from '../types/ui';

export interface WorldMovementCtx {
  phase: Phase;
  currentLocation: LocationId;
  floatingNums: FloatingNum[];

  transitioningRef:  MutableRefObject<boolean>;
  playerAttackTimeout: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  enemyAttackTimeout:  MutableRefObject<ReturnType<typeof setTimeout> | null>;
  currentLocationRef: MutableRefObject<LocationId>;
  playerPosRef:       MutableRefObject<{ x: number; y: number }>;
  enemiesRef:         MutableRefObject<Enemy[]>;
  phaseRef:           MutableRefObject<Phase>;
  activeEnemyIdRef:   MutableRefObject<number | null>;
  playerHpRef:        MutableRefObject<number>;
  playerMaxHpRef:     MutableRefObject<number>;
  playerLevelRef:     MutableRefObject<number>;
  playerGoldRef:      MutableRefObject<number>;
  inventoryRef:       MutableRefObject<Item[]>;
  questProgressRef:   MutableRefObject<QuestProgress>;
  openedChestsRef:    MutableRefObject<OpenedChests>;
  bossStateRef:       MutableRefObject<BossState>;

  setTransitioning:  Dispatch<SetStateAction<boolean>>;
  setCurrentLocation: Dispatch<SetStateAction<LocationId>>;
  setPlayerPos:      Dispatch<SetStateAction<{ x: number; y: number }>>;
  setEnemies:        Dispatch<SetStateAction<Enemy[]>>;
  setPhase:          Dispatch<SetStateAction<Phase>>;
  setActiveEnemyId:  Dispatch<SetStateAction<number | null>>;
  setShieldActive:   Dispatch<SetStateAction<boolean>>;
  setSkillsCd:       Dispatch<SetStateAction<Record<string, number>>>;
  setFloatingNums:   Dispatch<SetStateAction<FloatingNum[]>>;
  setPlayerHp:       Dispatch<SetStateAction<number>>;
  setPlayerGold:     Dispatch<SetStateAction<number>>;
  setInventory:      Dispatch<SetStateAction<Item[]>>;
  setLootNotif:      Dispatch<SetStateAction<string | null>>;
  setOpenedChests:   Dispatch<SetStateAction<OpenedChests>>;
  setQuestDialogue:  Dispatch<SetStateAction<NpcDialogue | null>>;
  setNpcDialog:      Dispatch<SetStateAction<string | null>>;
  setShowWorldMap:   Dispatch<SetStateAction<boolean>>;

  log:           (msg: string) => void;
  showGateNotif: (msg: string) => void;
  spawnFloat:    (value: string, col: number, row: number, type: FloatingNum['type']) => void;
  openPanel:     (key: 'shop') => void;
  buildDialogueFlags: (crystalCount: number) => Parameters<typeof getNpcDialogue>[2];
}

export function useWorldMovement(ctx: WorldMovementCtx) {
  const {
    phase, currentLocation, floatingNums,
    transitioningRef, playerAttackTimeout, enemyAttackTimeout, currentLocationRef, playerPosRef,
    enemiesRef, phaseRef, activeEnemyIdRef, playerHpRef, playerMaxHpRef, playerLevelRef, playerGoldRef,
    inventoryRef, questProgressRef, openedChestsRef, bossStateRef,
    setTransitioning, setCurrentLocation, setPlayerPos, setEnemies, setPhase, setActiveEnemyId,
    setShieldActive, setSkillsCd, setFloatingNums, setPlayerHp, setPlayerGold, setInventory,
    setLootNotif, setOpenedChests, setQuestDialogue, setNpcDialog, setShowWorldMap,
    log, showGateNotif, spawnFloat, openPanel, buildDialogueFlags,
  } = ctx;

  // ── Location transition ───────────────────────────────────────────────────
  const handleLocationTransition = useCallback((to: LocationId, spawnAt: { x: number; y: number }) => {
    if (transitioningRef.current) return;
    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
    if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }
    transitioningRef.current = true;
    setTransitioning(true);
    setTimeout(() => {
      const fresh = makeLocationEnemies(to);
      currentLocationRef.current  = to;
      playerPosRef.current        = spawnAt;
      enemiesRef.current          = fresh;
      phaseRef.current            = 'explore';
      activeEnemyIdRef.current    = null;
      transitioningRef.current    = false;
      setCurrentLocation(to);
      setPlayerPos(spawnAt);
      setEnemies(fresh);
      setPhase('explore');
      setActiveEnemyId(null);
      setShieldActive(false);
      setSkillsCd({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      setFloatingNums([]);
      setTransitioning(false);
      log(`📍 Вы прибыли: ${LOCATION_META[to].label}`);
      // Restore full HP when entering a safe zone
      if (getLocation(to).isSafeZone) {
        const fullHp = playerMaxHpRef.current;
        playerHpRef.current = fullHp;
        setPlayerHp(fullHp);
        log('💚 Добро пожаловать! HP полностью восстановлено.');
      }
    }, 800);
  }, [log]);

  // ── Movement ─────────────────────────────────────────────────────────────
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (phaseRef.current !== 'explore') return;
    if (transitioningRef.current) return;
    const { x, y } = playerPosRef.current;
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= MAP_COLS || ny >= MAP_ROWS) { log('Путь заблокирован!'); return; }
    const currentMap = LOCATION_MAPS[currentLocationRef.current];
    const tileType = currentMap[ny]?.[nx] ?? 1;
    // NPC intercept
    const npc = (LOCATION_NPCS[currentLocationRef.current] ?? []).find((n: NpcDef) => n.x === nx && n.y === ny);
    if (npc) {
      // Merchant → open shop (same special-case as the "Говорить" button)
      if (npc.id === 'merchant') {
        openPanel('shop');
        return;
      }
      const crystalCount = inventoryRef.current.filter(i => i.key === 'black_crystal').length;
      const dlg = getNpcDialogue(npc.id, questProgressRef.current, buildDialogueFlags(crystalCount));
      if (dlg) { setQuestDialogue(dlg); }
      else { setNpcDialog(`${npc.emoji} ${npc.name}: «Скоро здесь будут квесты и торговля! Следите за обновлениями.»`); }
      return;
    }
    // Enemy intercept
    const hitEnemy = enemiesRef.current.find(e => !e.dead && e.x === nx && e.y === ny);
    if (hitEnemy) {
      phaseRef.current = 'combat'; activeEnemyIdRef.current = hitEnemy.id;
      setActiveEnemyId(hitEnemy.id); setPhase('combat');
      log(`⚔️ Бой с ${hitEnemy.name}!`); return;
    }
    // Chest intercept
    {
      const chest = getChestsAt(currentLocationRef.current, nx, ny, openedChestsRef.current);
      if (chest) {
        const loot = openChest(chest);
        playerGoldRef.current += loot.gold;
        setPlayerGold(playerGoldRef.current);
        if (loot.item) {
          inventoryRef.current = addToInventory(inventoryRef.current, loot.item);
          setInventory(prev => addToInventory(prev, loot.item!));
          setLootNotif(loot.item.name);
          setTimeout(() => setLootNotif(null), 2500);
        }
        const nextOpened = { ...openedChestsRef.current, [chest.id]: true };
        openedChestsRef.current = nextOpened;
        setOpenedChests(nextOpened);
        for (const msg of loot.logs) log(msg);

        // Всплывашки над героем (как с мобами).
        const pp = playerPosRef.current;
        spawnFloat(`+${loot.gold}💰`, pp.x, pp.y, 'gold');
        if (loot.item) {
          setTimeout(() => spawnFloat(`📦 ${loot.item!.name}`, pp.x, pp.y, 'loot'), 200);
        }

        // встать на клетку сундука
        playerPosRef.current = { x: nx, y: ny };
        setPlayerPos({ x: nx, y: ny });
        return;
      }
    }
    // Exit tile intercept
    if (tileType === 4) {
      const exits = LOCATION_EXITS[currentLocationRef.current];
      const exit = exits?.get(`${nx},${ny}`);
      if (exit) {
        const gate = canEnterLocation(exit.to, playerLevelRef.current);
        if (!gate.ok) {
          log(`⛔ Нужен ${gate.required} уровень, чтобы войти (у вас ${playerLevelRef.current}).`);
          showGateNotif(`🔒 Нужен ${gate.required} уровень, чтобы войти в «${LOCATION_META[exit.to].label}»`);
          return;
        }
        // Block Cave → Ruins until Goblin Chief has been defeated for the first time
        if (currentLocationRef.current === 'wolfcave' && exit.to === 'ruins' && !bossStateRef.current.caveChief.firstKillDone) {
          log('⚠️ Путь заблокирован! Победите Главаря гоблинов, чтобы пройти в Руины.');
          showGateNotif('⚠️ Победите Главаря гоблинов, чтобы пройти в Руины');
          return;
        }
        handleLocationTransition(exit.to, exit.spawnAt);
        return;
      }
    }
    if (tileType !== 0) { log('Путь заблокирован!'); return; }
    playerPosRef.current = { x: nx, y: ny }; setPlayerPos({ x: nx, y: ny });

    // Аггро: подсветить мобов, оказавшихся в радиусе обнаружения (см. aggro.ts)
    const aggroed = updateAggro(enemiesRef.current, playerPosRef.current);
    if (aggroed !== enemiesRef.current) {
      enemiesRef.current = aggroed;
      setEnemies(aggroed);
    }
  }, [log, showGateNotif, handleLocationTransition, spawnFloat, buildDialogueFlags, openPanel]);

  // ── Floating number cleanup ───────────────────────────────────────────────
  useEffect(() => {
    if (floatingNums.length === 0) return;
    const t = setInterval(() => {
      const now = Date.now();
      setFloatingNums(prev => prev.filter(f => now - f.timestamp < 1300));
    }, 200);
    return () => clearInterval(t);
  }, [floatingNums]);

  // ── Aggro chase timer (explore only) — see aggro.ts ─────────────────────────
  useEffect(() => {
    if (phase !== 'explore') return;
    const t = setInterval(() => {
      const map = LOCATION_MAPS[currentLocationRef.current];
      const { enemies: next, engageId } = stepAggroEnemies(
        enemiesRef.current,
        playerPosRef.current,
        map,
      );
      if (next !== enemiesRef.current) {
        enemiesRef.current = next;
        setEnemies(next);
      }
      if (engageId != null) {
        const enemy = next.find(e => e.id === engageId);
        phaseRef.current = 'combat';
        activeEnemyIdRef.current = engageId;
        setActiveEnemyId(engageId);
        setPhase('combat');
        if (enemy) log(`⚔️ ${enemy.name} догнал вас!`);
      }
    }, 450);
    return () => clearInterval(t);
  }, [phase, currentLocation, log]);

  // После победы / поражения / бегства / сброса — снять аггро со всех мобов.
  useEffect(() => {
    if (phase !== 'explore') return;
    const cleared = clearAllAggro(enemiesRef.current);
    if (cleared !== enemiesRef.current) {
      enemiesRef.current = cleared;
      setEnemies(cleared);
    }
  }, [phase]);

  // ── World map travel ──────────────────────────────────────────────────────
  const handleWorldMapTravel = useCallback((to: LocationId) => {
    if (phaseRef.current !== 'explore') return;
    if (transitioningRef.current) return;
    const gate = canEnterLocation(to, playerLevelRef.current);
    if (!gate.ok) {
      log(`⛔ Нужен ${gate.required} уровень для «${LOCATION_META[to].label}» (у вас ${playerLevelRef.current}).`);
      showGateNotif(`🔒 Нужен ${gate.required} уровень, чтобы войти в «${LOCATION_META[to].label}»`);
      return;
    }
    setShowWorldMap(false);
    handleLocationTransition(to, LOCATION_SPAWN[to]);
  }, [handleLocationTransition, log, showGateNotif]);

  return { handleLocationTransition, movePlayer, handleWorldMapTravel };
}
