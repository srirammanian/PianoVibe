# PianoVibe — Product Spec

> A gamified piano learning app with a Rock Band-style falling notes UI that makes playing piano feel like a video game.

## Overview

PianoVibe is a web-based piano learning app with two core modes:

1. **Play Mode** — Rock Band-style falling notes. Notes scroll down the screen in time with a song. The player plays the correct notes on a real piano (detected via microphone) or on-screen touch keyboard. Scored with visual feedback, particle effects, and XP progression.

2. **Learn Mode** *(v1.5)* — Sheet music note identification drills. A note appears on a staff and the player identifies it by playing it on the piano (primary) or tapping a button (fallback).

## Platform & Architecture

| Aspect | Decision |
|---|---|
| **Platform** | Web app — fully client-side, no backend |
| **Rendering** | React shell (routing, menus, settings, library) + Phaser game canvas (gameplay, particles, scoring) |
| **Device priority** | Mobile/tablet-first, responsive up to desktop |
| **Orientation** | Landscape-only for game modes. Library/settings can work in portrait. |
| **Deployment** | Static site on Vercel or Netlify |
| **Persistence** | LocalStorage / IndexedDB — no backend, no auth |

## Input Methods

Three input methods, abstracted behind a common interface so the game engine is input-agnostic:

### 1. Microphone (v1 — primary)
- Uses Web Audio API + `getUserMedia` for real-time mic access
- Pitch detection via library (Pitchy, ml5.js, or Aubio WASM)
- Latency ~20-50ms — acceptable for a learning app with generous timing windows
- Works with any acoustic or digital piano

### 2. On-Screen Touch Keyboard (v1)
- Tap piano keys rendered at the bottom of the game canvas
- Essential for mobile/tablet use and for practice without a physical piano
- Enables standalone game usage (practice on the bus)

### 3. Web MIDI (v1.5)
- Web MIDI API for USB MIDI keyboards (Chrome/Edge only)
- Exact note-on/note-off events — zero ambiguity, no pitch detection needed
- Gold standard for accuracy when available

## Song Data & Library

### Format
- **MIDI files** as the primary song format
- Parsed via `@tonejs/midi` or similar JS MIDI parser
- Each note provides: pitch, timing, velocity, duration, channel/track

### Built-in Library
- Ship with 5-10 beginner songs (public domain / open-source)
- Sources: piano-midi.de (classical collection), GitHub repos with public domain MIDI files
- Bundled songs include **fingering annotations** (finger numbers 1-5 per note) as custom metadata

### User Import
- Drag-and-drop `.mid` / `.midi` files into the app
- Imported songs stored in IndexedDB
- No fingering data for imported files (auto-generation in v2)

### Track Handling
- MIDI files can have multiple tracks/channels (piano, drums, strings, etc.)
- **Auto-detect piano tracks** via MIDI program change messages (program 0-7)
- **Track selector UI** before starting a song — user can override which tracks to display as falling notes
- Smart default: auto-select piano tracks, show selector for manual override

## Play Mode — Falling Notes

### Core Mechanic
- Notes fall from the top of the screen toward a "play line" near the bottom
- Piano keyboard rendered at the bottom of the screen
- As a note crosses the play line, the player must play the corresponding note
- Hit detection compares played note against expected note within the timing window

### Piano Keyboard Display
- **Auto-zoom to the song's active range** — if a song uses C3–C5, the UI zooms to just those octaves
- **Scroll/zoom** to parts of the piano not currently showing when those notes need to be played
- User can manually adjust the visible range

### Hand Separation
- **Color-coded hands** — right hand notes are one color, left hand another
- MIDI tracks/channels used to determine hand assignment
- **Hand isolation toggle** in practice mode:
  - Right hand only
  - Left hand only
  - Both hands
- When one hand is muted, those notes ghost out (semi-transparent) or auto-play via synth

### Fingering Display
- Bundled songs display finger numbers (1-5) on each falling note
- Small number rendered on the note block
- Not available for user-imported MIDIs in v1

### Timing & Tolerance
- **Configurable timing window** — user can adjust strictness
- **Generous default** (~300-500ms window) suitable for beginners
- Timing windows scale proportionally with speed adjustments
- Tolerance levels could be labeled: Relaxed / Standard / Strict

### Visual Feedback
- **Correct note + good timing** → note glows green, satisfying particle burst
- **Correct note + late timing** → yellow glow
- **Missed note** → note turns red, fades out
- **Wrong note played** → brief red flash on the key pressed
- **Streak effects** — combo counter, escalating visual intensity (sparks, screen effects)
- Visual style: premium and elegant, not arcade neon

### Audio
- **Default: silent** — player hears only their own piano
- **Optional metronome** for timing reference
- **Optional synth backing** — light reference synth that plays the notes (useful for practice, or when using touch keyboard input)

### Practice Tools
- **Speed slider** — 25% to 150% of original tempo
- Notes fall proportionally slower/faster
- Timing windows scale with speed
- **A-B section looping** — tap to mark a start and end point in the song, loops that section continuously
- Essential for drilling difficult passages

### Scoring
- **Performance Mode**: scored runs with grades
  - Points per note based on timing accuracy
  - Streak multiplier (consecutive correct notes)
  - End-of-song grade: A / B / C / D
  - XP earned per run
- **Practice Mode**: no score pressure
  - Speed slider and A-B looping available
  - Focus on learning, not performance

## Learn Mode (v1.5)

### Note Identification Drills
- A note appears on a musical staff (treble or bass clef)
- Player identifies it by:
  - **Playing it on the piano** (mic or MIDI detection) — primary method
  - **Tapping a button** (C, D, E, F, G, A, B + sharps/flats) — fallback for no-piano situations

### Difficulty Levels
- **Level 1**: Note letter name only (C, D, E, etc.) — natural notes on treble clef
- **Level 2**: Add sharps and flats
- **Level 3**: Note + octave identification (C4 vs C5)
- **Level 4**: Bass clef
- Future: full sight-reading (notes appear on staff and you play them in real-time — essentially a third game mode)

### Separate from Play Mode
- Different UI, different purpose
- Main menu presents two doors: **Play** and **Learn**

## User Profiles & Progression

### Local User Profiles
- Profile selector on app launch (like console player profiles)
- Create profile: name + avatar picker
- No passwords — local-only, no cloud sync
- All data partitioned per profile in IndexedDB

### Run History
- Every song play recorded per profile:
  - Song name
  - Date/time
  - Score
  - Accuracy %
  - Speed setting used
  - Grade (A/B/C/D)
  - Hand mode (left/right/both)
- Viewable in a "My Runs" / "History" screen

### Progression System
- **XP + Levels** — every session earns XP, player levels up
- **Difficulty tiers** — song library organized by difficulty, higher tiers unlock as player levels up
- Provides natural curriculum without requiring music pedagogy expertise

### Achievements & Streaks (v1.5)
- **Daily streak counter** — consecutive days with at least one play session
- **Achievements** for milestones:
  - "Play 10 songs"
  - "Perfect score on any song"
  - "7-day streak"
  - "Complete all beginner songs"
  - etc.
- No leaderboards — single-player experience

## Visual Design

### Style
- **Dark & polished** — charcoal/navy backgrounds, not pure black
- **Rich, solid colors** for notes — warm reds, blues, golds (not neon/synthwave)
- **Elegant particle effects** — sparks and glows, not laser beams
- Clean typography, good spacing
- Aesthetic reference: Monument Valley, Alto's Odyssey — premium, calm, but clearly a game

### Theming
- **v1**: One default theme (dark & polished)
- **v1.5**: 2-3 preset themes + customization
- Themeable via CSS variables (React shell) + theme config passed to Phaser
- Customizable: color palette, note styles, background, text

## Onboarding
- First launch: quick interactive tutorial (~60 seconds)
  - Pre-selected simple song loads automatically
  - Walk through connecting mic or using touch keyboard
  - Play 8 bars with generous timing
  - Introduce scoring, streak, XP concepts
- Then drops user at the song library

## Future Milestones

### v2 — AI Coach & Auto-Fingering
- **AI Practice Coach**: LLM analyzes recorded run data (note-by-note accuracy, timing, patterns) and provides:
  - Identification of weak areas ("You consistently miss F#4 → A4 transitions")
  - Timing analysis ("Left hand drifts late on bars 12-16")
  - Practice tips and session recommendations
  - Requires: raw note capture data infrastructure + LLM API (introduces minimal backend or client-side API key)
- **Auto-generated fingering for imported MIDIs**: algorithmic (music informatics research) or LLM-generated fingering assignment for any MIDI file
- **Song library expansion** / community sharing

## Roadmap Summary

### v1 — MVP
- [x] Falling notes Play mode
- [x] Microphone + on-screen touch input
- [x] 5-10 bundled beginner songs with fingering annotations
- [x] MIDI file import with track selector
- [x] Hand color-coding + isolation toggle
- [x] Speed slider (25%-150%) + A-B section looping
- [x] Scoring with XP + difficulty tiers
- [x] Local user profiles + run history
- [x] One default theme (dark & polished)
- [x] Landscape-only, mobile/tablet-first
- [x] First-launch onboarding tutorial

### v1.5
- [ ] Learn mode (sheet music note identification drills)
- [ ] Web MIDI input support
- [ ] Themeable UI (2-3 presets + customization editor)
- [ ] PWA / offline support
- [ ] Achievements + daily streaks

### v2
- [ ] AI Practice Coach (LLM-powered session analysis + tips)
- [ ] Auto-generated fingering for imported MIDIs
- [ ] Song library expansion / community sharing
