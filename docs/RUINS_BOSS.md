# Босс руин — Хранитель склепа

## Файлы
- `src/boss/boss.ts`
- `src/hooks/useCombat.ts`
- `src/quests/quests.ts` (убитый хранитель считается в «Эхо руин»)
- `src/quests/npc.ts`

## Как работает
1. Зачисти нежить в **Древних руинах**
2. Появляется **Хранитель склепа** (⚰️)
3. Награда: XP/золото, лут, при первом убийстве — **Печать склепа** (эпический амулет)
4. Респавн ~12 мин после смерти

## App.tsx (1 строка)

В `getNpcDialogue` флаги добавь:

```ts
ruinsKeeperFirstKill: bossStateRef.current.ruinsKeeper?.firstKillDone,
```

## Старые сейвы
В `boss.ts` есть `normalizeBossState`. При загрузке:

```ts
import { normalizeBossState, INITIAL_BOSS_STATE } from './boss/boss';
// ...
const [bossState, setBossState] = useState(
  normalizeBossState(sv?.bossState) ?? INITIAL_BOSS_STATE
);
```

Без этого старый save без `ruinsKeeper` может упасть при обращении к полю.

## Проверка
Уровень 15+ → руины → убить 5 мобов → босс → победа → диалог старосты
