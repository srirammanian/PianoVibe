# PianoVibe — Faithfulness Eval

> **Purpose:** Gate every output (spec revision, design doc, implementation plan, code) against the actual user requirements. Catches scope creep, added assumptions, and silent omissions before they compound.
>
> **How to use:** Run this checklist on any artifact before it advances to the next phase. Score each section. A failing gate blocks progress until resolved.

---

## Part 1: Hard Requirements Checklist

Every item below was explicitly agreed to during the design interview. Each must be present and unmodified. Mark PASS / FAIL / N/A (if the artifact doesn't cover that area).

### 1.1 Platform & Architecture

| # | Requirement | Source | PASS/FAIL |
|---|---|---|---|
| 1 | Web app, fully client-side, no backend | Q1, Q8c | |
| 2 | React shell for non-game UI (menus, library, settings, profiles) | Q9 | |
| 3 | Phaser game canvas for gameplay (falling notes, particles, scoring) | Q4, Q9 | |
| 4 | Mobile/tablet-first, responsive up to desktop | Q16 | |
| 5 | Landscape-only for game modes | Q16b | |
| 6 | Static site deployment (Vercel/Netlify) | Q15 | |
| 7 | Persistence via LocalStorage / IndexedDB only — no cloud, no auth | Q8c | |

### 1.2 Input Methods

| # | Requirement | Source | PASS/FAIL |
|---|---|---|---|
| 8 | Microphone pitch detection as v1 primary input | Q1 follow-up | |
| 9 | On-screen touch keyboard as v1 input | Q16b | |
| 10 | Web MIDI as v1.5 input (not v1) | Q1 follow-up | |
| 11 | All inputs abstracted behind a common interface | Q1 follow-up | |

### 1.3 Song Data & Library

| # | Requirement | Source | PASS/FAIL |
|---|---|---|---|
| 12 | MIDI as the primary song format | Q3 | |
| 13 | Built-in library of 5-10 beginner songs from open-source MIDI sources | Q3 | |
| 14 | Drag-and-drop MIDI file import | Q3 | |
| 15 | Auto-detect piano tracks via MIDI program change messages | Q12 | |
| 16 | Track selector UI for manual override | Q12 | |

### 1.4 Play Mode — Falling Notes

| # | Requirement | Source | PASS/FAIL |
|---|---|---|---|
| 17 | Notes fall from top toward a play line at the bottom | Core concept | |
| 18 | Piano keyboard rendered at bottom of game canvas | Core concept | |
| 19 | Auto-zoom to the song's active note range | Q5 | |
| 20 | Scroll/zoom to off-screen notes when they need to be played | Q16b | |
| 21 | Hand color-coding (right hand vs left hand, different colors) | Q10 | |
| 22 | Hand isolation toggle: right only / left only / both | Q10 | |
| 23 | Muted hand notes ghost out (semi-transparent) or auto-play via synth | Q10 | |
| 24 | Fingering numbers (1-5) displayed on falling notes for bundled songs | Q-fingering | |
| 25 | No fingering on imported MIDIs in v1 | Q-fingering | |
| 26 | Configurable timing tolerance with generous default (~300-500ms) | Q2 | |
| 27 | Visual feedback: green (good), yellow (late), red (miss), red flash (wrong note) | Q6b | |
| 28 | Particle effects — elegant sparks/glows, NOT neon/arcade/Tron | Q6b, Q13 | |
| 29 | Streak counter with escalating visual intensity | Q6b | |
| 30 | Default audio: silent (player hears own piano) | Q6a | |
| 31 | Optional metronome | Q6a | |
| 32 | Optional synth backing for reference / touch keyboard use | Q6a | |

### 1.5 Practice Tools

| # | Requirement | Source | PASS/FAIL |
|---|---|---|---|
| 33 | Speed slider: 25% to 150% | Q11 | |
| 34 | Timing windows scale proportionally with speed changes | Q11 | |
| 35 | A-B section looping (mark start + end, loop continuously) | Q11 | |
| 36 | Both speed slider and A-B looping are v1 MVP | Q11 | |

### 1.6 Scoring & Modes

| # | Requirement | Source | PASS/FAIL |
|---|---|---|---|
| 37 | Performance Mode: points, streak multiplier, end-of-song grade (A/B/C/D), XP | Q6c | |
| 38 | Practice Mode: no score, speed slider + A-B looping available | Q6c | |

### 1.7 User Profiles & Progression

| # | Requirement | Source | PASS/FAIL |
|---|---|---|---|
| 39 | Local user profiles — name + avatar, no passwords, profile selector on launch | Q-profiles | |
| 40 | Per-profile data partitioning in IndexedDB | Q-profiles | |
| 41 | Run history per profile: song, date, score, accuracy %, speed, grade, hand mode | Q-profiles | |
| 42 | XP + levels system | Q8a | |
| 43 | Song library organized by difficulty tiers that unlock with level | Q8a | |

### 1.8 Visual Design

| # | Requirement | Source | PASS/FAIL |
|---|---|---|---|
| 44 | Dark & polished: charcoal/navy backgrounds, NOT pure black, NOT neon/Tron | Q13 | |
| 45 | Rich solid colors for notes (warm reds, blues, golds) | Q13 | |
| 46 | Elegant particle effects (sparks/glows, not laser beams) | Q13 | |
| 47 | Aesthetic ref: Monument Valley / Alto's Odyssey — premium, calm, game-like | Q13 | |
| 48 | v1 ships with ONE default theme | Q13 | |
| 49 | Theming system planned — CSS vars (React) + theme config (Phaser) | Q13 | |
| 50 | Customizable: vibe, colors, text (2-3 presets + customization in v1.5) | Q13 | |

### 1.9 Onboarding

| # | Requirement | Source | PASS/FAIL |
|---|---|---|---|
| 51 | First-launch interactive tutorial (~60 seconds) | Q17 | |
| 52 | Pre-selected simple song, walk through mic/touch setup, play 8 bars | Q17 | |

### 1.10 Version Boundaries

| # | Requirement | Source | PASS/FAIL |
|---|---|---|---|
| 53 | Learn mode (sheet music drills) is v1.5, NOT v1 | Q7 | |
| 54 | Web MIDI is v1.5, NOT v1 | Input discussion | |
| 55 | Achievements + streaks are v1.5, NOT v1 | Q8b | |
| 56 | Themeable UI (multiple presets) is v1.5, NOT v1 | Q13 | |
| 57 | PWA / offline is v1.5, NOT v1 | Q18 | |
| 58 | AI Practice Coach is v2, NOT v1 or v1.5 | Q-AI coach | |
| 59 | Auto-generated fingering for imported MIDIs is v2 | Q-fingering | |
| 60 | No leaderboards in any version currently planned | Q8b | |

---

## Part 2: Scope Creep Detector

For every feature, component, or behavior in the artifact being evaluated, ask:

| # | Question | PASS if... | FAIL if... |
|---|---|---|---|
| S1 | Is this feature in the spec? | Directly traceable to a numbered requirement above | Cannot be traced — it was invented |
| S2 | Is this feature in the correct version? | Matches the v1 / v1.5 / v2 boundary in §1.10 | Pulled forward or pushed back without explicit approval |
| S3 | Does this feature add a backend, auth, or cloud dependency? | No | Yes — violates #1 and #7 |
| S4 | Does this feature require a technology not in the spec? | Uses React, Phaser, Web Audio API, IndexedDB, or standard web APIs | Introduces a new framework, database, or service |
| S5 | Does this feature change the visual style? | Stays within "dark & polished, elegant, not neon" | Introduces neon, pure black, arcade aesthetic, or a style not discussed |
| S6 | Does this add a new input method not in the spec? | Uses mic, touch, or MIDI (in correct version) | Adds camera, accelerometer, voice commands, etc. |
| S7 | Does this add a new game mode not in the spec? | Play mode or Learn mode (in correct version) | Adds multiplayer, race mode, challenge mode, etc. |
| S8 | Does this add social features? | No social features | Adds sharing, friends, leaderboards, community |

**Any FAIL in Part 2 requires explicit user approval before proceeding.**

---

## Part 3: Omission Detector

Check that nothing from the spec was silently dropped:

| # | Check | How to verify |
|---|---|---|
| O1 | All v1 features are present | Walk through §1.1–§1.9, confirm every PASS item appears in the artifact |
| O2 | Hand separation is not simplified away | Artifact includes color-coding AND isolation toggle AND ghost/auto-play for muted hand |
| O3 | Fingering is not dropped | Bundled songs show finger numbers on notes |
| O4 | Practice tools are complete | Both speed slider AND A-B looping are present (not just one) |
| O5 | Touch keyboard is a real input | Not just a visual — it feeds the same input interface as mic/MIDI |
| O6 | Track selector exists | Not just auto-detect — user can manually pick tracks |
| O7 | User profiles are multi-user | Profile selector on launch, not just a single implicit user |
| O8 | Run history captures all fields | Song, date, score, accuracy %, speed, grade, hand mode — all seven |
| O9 | Scroll/zoom for off-screen notes | Not just auto-zoom — also scroll/zoom when notes outside visible range appear |
| O10 | Configurable timing tolerance | User can change it, not just a hardcoded generous default |

---

## Part 4: Scoring Rubric

### Per-item scoring
- **PASS** = 1 point
- **FAIL** = 0 points
- **N/A** = excluded from denominator

### Section scores
Calculate: `(PASS count) / (PASS + FAIL count) × 100%`

### Gate thresholds

| Section | Minimum to pass |
|---|---|
| Part 1: Hard Requirements | **100%** — zero tolerance. Every agreed requirement must be present and correct. |
| Part 2: Scope Creep | **100%** — any unauthorized addition blocks until resolved or approved. |
| Part 3: Omissions | **100%** — any silent omission blocks until restored or explicitly deferred with approval. |

### Overall verdict

| Result | Meaning |
|---|---|
| **ALL 100%** | ✅ **PASS** — artifact is faithful. Proceed to next phase. |
| **Any section < 100%** | ❌ **BLOCKED** — list every failing item. Resolve before proceeding. |

---

## Part 5: How to Run This Eval

1. **Before every phase transition** (spec → plan, plan → code, code → review), run this eval against the output artifact.
2. **Fill in every PASS/FAIL cell.** Do not skip items. "I think it's fine" is not PASS.
3. **For any FAIL**, write a one-line note: what's wrong and what the spec actually says.
4. **Post the filled-in eval** as a gate artifact. It must be reviewed before work continues.
5. **If scope needs to change**, that's fine — but the user must approve the change, the spec must be updated FIRST, and then this eval must be updated to match.

---

## Appendix: Quick Reference — What Is NOT in v1

These are common temptations. If any appear in a v1 artifact, it's a FAIL:

- ❌ Learn mode / sheet music drills
- ❌ Web MIDI input
- ❌ Multiple themes / theme customization
- ❌ PWA / service worker / offline mode
- ❌ Achievements or streak system
- ❌ AI coach / LLM analysis
- ❌ Auto-generated fingering for imported files
- ❌ Leaderboards or social features
- ❌ User accounts with passwords or cloud sync
- ❌ Backend / API / database server
- ❌ Song store / marketplace
- ❌ Multiplayer or competitive modes
