# PianoVibe — PRD Index

**Project:** PianoVibe  
**Scope:** v1 MVP  
**Status:** ✅ All PRDs Complete  

---

## Overview

This directory contains the complete PRD documentation for PianoVibe, organized into focused documents by system area.

### PRD Documents

| PRD | Title | Status |
|-----|-------|--------|
| [PRD 1](./prd-01-core-game-engine-play-mode.md) | Core Game Engine & Play Mode | ✅ Complete |
| [PRD 2](./prd-02-input-system.md) | Input System Architecture | ✅ Complete |
| [PRD 3](./prd-03-song-library.md) | Song Library & Data Management | ✅ Complete |
| [PRD 4](./prd-04-profiles-progression.md) | User Profiles & Progression | ✅ Complete |
| [PRD 5](./prd-05-ui-design-onboarding.md) | UI/UX, Visual Design & Onboarding | ✅ Complete |
| [PRD 6](./prd-06-learn-mode.md) | Learn Mode (Sheet Music Drills) | ⏸️ Deferred (v1.5) |

---

## v1 MVP Scope Summary

### What's In v1

| System | Features |
|--------|----------|
| **Play Mode** | Falling notes, gem-shaped with gradients, hand color coding, auto-zoom/scroll |
| **Timing & Scoring** | 3 presets (Relaxed/Standard/Strict), Perfect/Good/OK grading, streak multiplier (4x cap), A/B/C/D grades |
| **Practice Tools** | Speed slider (25-150%), A-B looping, Practice vs Performance modes |
| **Visual Feedback** | Note color changes, particle bursts, floating feedback text, streak escalation effects |
| **Input Methods** | Microphone (Pitchy), Touch keyboard (multi-touch), common InputBridge |
| **Song Library** | 10 bundled classical songs, MIDI parsing (@tonejs/midi), drag-and-drop import |
| **Track Selection** | Auto-detect piano tracks, manual override, track selector UI |
| **Profiles** | Guest profile, named profiles, emoji avatars, profile switcher |
| **Progression** | XP system, 10 levels, 3 difficulty tiers (unlocks at L1, L3, L5) |
| **Run History** | Last 50 stored, last 10 displayed, filterable |
| **UI/UX** | Animated splash, game-style main menu, dark polished theme |
| **Onboarding** | 60-second tutorial, skippable, mic permission flow |
| **Persistence** | IndexedDB for all data, per-profile isolation |

### What's Out (v1.5 / v2)

| Feature | Version |
|---------|---------|
| Learn Mode (sheet music drills) | v1.5 |
| Web MIDI input | v1.5 |
| Theme customization | v1.5 |
| Achievements & daily streaks | v1.5 |
| PWA / offline support | v1.5 |
| Algorithmic fingering for imports | v2 |
| AI Practice Coach | v2 |
| Audio-to-MIDI conversion | v2 |
| Licensed song catalog | Future |

---

## Implementation Priority

### Phase 1: Foundation
1. Project setup (React + Phaser)
2. Input Bridge architecture
3. Microphone input (Pitchy)
4. Touch keyboard

### Phase 2: Core Game
5. Game engine & falling notes
6. Hit detection & timing
7. Scoring system
8. Visual feedback & particles

### Phase 3: Content
9. Song library & MIDI parsing
10. Bundled songs (10 classical pieces)
11. Track selector
12. User import

### Phase 4: Profiles & Progression
13. Profile system
14. XP & leveling
15. Tier unlocks
16. Run history

### Phase 5: Polish
17. UI screens (menu, library, splash)
18. Onboarding tutorial
19. Settings & preferences
20. Final polish & testing

---

## Key Files

| File | Purpose |
|------|---------|
| `pianovibe.md` | Parent product spec |
| `pianovibe-eval.md` | Faithfulness evaluation checklist |
| `research/piano-midi-sources.md` | Research on available MIDI sources |
| `*.png` | UI mockups and screenshots |

---

## Dependencies

### Core Libraries
| Library | Purpose |
|---------|---------|
| React 18 | UI shell |
| Phaser 3 | Game engine |
| @tonejs/midi | MIDI parsing |
| pitchy | Pitch detection |
| idb | IndexedDB wrapper |

### Browser APIs
| API | Purpose |
|-----|---------|
| Web Audio API | Audio capture & processing |
| getUserMedia | Microphone access |
| IndexedDB | Local data persistence |
| Web MIDI API | MIDI input (v1.5) |

---

## Getting Started

1. Read `pianovibe.md` for product overview
2. Review relevant PRD for detailed specs
3. Use `pianovibe-eval.md` to verify implementation faithfulness
4. Follow the implementation phases above

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-23 | Initial PRD index created |

---

*Last updated: 2026-03-23*
