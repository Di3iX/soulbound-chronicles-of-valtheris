# Changelog

All notable changes to this project will be documented here.

---

# v0.1.7

### Added

- Mana system: base pool + level growth + bonuses from the "Arcane Knowledge" skill and equipment
- Mana cost on all skills except the base Strike; insufficient-mana feedback in the skill bar
- Mana regeneration (5 MP/sec) during combat
- Mana potions (regular + greater) sold by the Village Merchant
- Mana bonus rolls on Mage Hood and Arcane Staff
- Mana bar in the combat HUD and character panel

---

# v0.1.6

### Changed

- Major internal refactor: `App.tsx` reduced from 2091 to 811 lines (−61%)
- Combat, equipment, economy, and reset logic extracted into dedicated hooks
- UI split into standalone presentational components (character/inventory/map/HUD/etc.)
- Removed 87 unused files left over from earlier incomplete refactor attempts
- Fixed XP calculation being duplicated in three places (single source of truth now)

### Fixed

- Stale save files could show incorrect XP after a formula/balance change

---

# v0.1.5

### Added

- Random item affixes
- Equipment comparison
- Improved equipment system
- Better item generation
- Improved modular architecture

---

# v0.1.4

### Added

- Talent window
- Character progression improvements
- Better project structure

---

# v0.1.3

### Added

- Character stats
- Equipment bonuses
- Save/Load improvements
- Persistent world progress

---

# v0.1.2

### Added

- Merchant
- Quest system
- Multiple locations
- Zone transitions

---

# v0.1.1

### Added

- Inventory
- Equipment
- Loot system
- Save/Load

---

# v0.1.0

### Added

- Initial project
- First playable prototype
