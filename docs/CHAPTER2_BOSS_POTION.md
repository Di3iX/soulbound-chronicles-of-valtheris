# Главарь + зелье в бою

## Файлы
- `src/quests/quests.ts`
- `src/quests/npc.ts`
- `src/hooks/useCombat.ts` (спавн босса в **wolfcave**, квест на главаря)
- `src/components/ControlsPanel.tsx`

## Цепочка
1. Чума на полях → 2. Чёрные кристаллы (кабан) → 3. Тень леса (гоблины)
4. **Главарь в пещере** (Главаря гоблинов)
5. После победы — путь к руинам (как и раньше по firstKill)

## Багфикс
Босс пещеры спавнился при `location === 'cave'`, а id локации — **`wolfcave`**.
Теперь зачистка Волчьей пещеры реально вызывает главаря.

## App.tsx — зелье в бою

### 1) Подсчёт зелий (перед return, рядом с derived values)

```ts
const POTION_KEYS = ['healing_potion', 'greater_healing_potion', 'raw_meat'] as const;
const potionCount = inventory.filter(i => (POTION_KEYS as readonly string[]).includes(i.key)).length;
const canUsePotion = phase === 'combat' && potionCount > 0 && playerHp < playerMaxHp;

const handleQuickPotion = useCallback(() => {
  if (phaseRef.current !== 'combat') return;
  if (playerHpRef.current >= playerMaxHpRef.current) {
    log('❤️ HP уже максимально!');
    return;
  }
  const order = ['greater_healing_potion', 'healing_potion', 'raw_meat'];
  const item = order
    .map(k => inventoryRef.current.find(i => i.key === k))
    .find(Boolean);
  if (!item) {
    log('🧪 Нет зелий в инвентаре!');
    return;
  }
  handleUseItem(item);
}, [log, handleUseItem]);
```

### 2) ControlsPanel

```tsx
<ControlsPanel
  phase={phase}
  movePlayer={movePlayer}
  skillsCd={skillsCd}
  playerMp={playerMp}
  useSkill={useSkill}
  onUsePotion={handleQuickPotion}
  potionCount={potionCount}
  canUsePotion={canUsePotion}
/>
```

`handleUseItem` уже есть из `useEconomy` — он снимает предмет и лечит.
