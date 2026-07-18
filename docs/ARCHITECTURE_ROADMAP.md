# Soulbound: Chronicles of Valtheris

# Architecture Roadmap

This document tracks the technical evolution of the project.

---

# Goal

Transform the project into a scalable architecture suitable for long-term development and future MMORPG support.

---

# Stage 1 — Project Cleanup

Status: Planned

## Constants

- ⬜ Create src/constants/
- ⬜ Move game constants
- ⬜ Move UI constants
- ⬜ Move balance values
- ⬜ Move rarity colors

---

## Utilities

- ⬜ Create src/utils/
- ⬜ Move helper functions
- ⬜ Move formatting functions
- ⬜ Move random helpers
- ⬜ Remove duplicated utility code

---

## Types

- ⬜ Create src/types/
- ⬜ Move shared interfaces
- ⬜ Move enums
- ⬜ Centralize type definitions

---

# Stage 2 — Data Separation

Status: Planned

Create src/data/

- ⬜ enemies.ts
- ⬜ bosses.ts
- ⬜ items.ts
- ⬜ quests.ts
- ⬜ merchant.ts
- ⬜ locations.ts

Goal:

Separate game data from gameplay logic.

---

# Stage 3 — Player System

Status: Planned

Create src/player/

- ⬜ playerState.ts
- ⬜ playerStats.ts
- ⬜ leveling.ts
- ⬜ experience.ts

Goal:

All player logic should live in one place.

---

# Stage 4 — World System

Status: Planned

Create src/world/

- ⬜ movement.ts
- ⬜ transitions.ts
- ⬜ mapRenderer.tsx
- ⬜ fogOfWar.ts
- ⬜ minimap.ts

Goal:

Move world logic out of App.tsx.

---

# Stage 5 — Combat System

Status: Planned

- ⬜ Separate combat engine
- ⬜ Separate enemy AI
- ⬜ Separate boss logic
- ⬜ Separate damage calculation

---

# Stage 6 — UI

Status: Planned

Create src/components/

- ⬜ HUD
- ⬜ Character Panel
- ⬜ Inventory Panel
- ⬜ Quest Panel
- ⬜ Merchant Panel
- ⬜ Skill Panel
- ⬜ Boss Panel
- ⬜ Minimap

Goal:

Keep UI independent from gameplay.

---

# Stage 7 — Performance

Status: Planned

- ⬜ Remove duplicated code
- ⬜ Optimize rendering
- ⬜ Optimize state updates
- ⬜ Reduce unnecessary re-renders

---

# Final Goal

App.tsx should become the application coordinator.

Target size:

Less than 500 lines.

App.tsx should only:

- Initialize systems
- Connect components
- Manage global providers
