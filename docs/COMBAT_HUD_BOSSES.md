# CombatHUD — боссы + уровень врага

## Файл
`src/components/CombatHUD.tsx`

## App.tsx — одна правка

Было:
```tsx
bossId={BOSS_ID}
```

Стало:
```tsx
import { BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID } from './boss/boss';
// ...
bossIds={[BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID]}
bossId={BOSS_ID}  // можно оставить для совместимости
```

## Что даёт
- Метка **БОСС** у кабана, главаря и хранителя склепа
- У обычных врагов: **Ур. N · HP%** из каталога монстров
- Полоска HP чуть выше и читаемее
