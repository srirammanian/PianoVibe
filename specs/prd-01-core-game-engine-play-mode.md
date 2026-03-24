# PRD 1: Core Game Engine & Play Mode

**Version:** 1.0  
**Author:** PianoVibe Team  
**Status:** Draft  
**Parent Spec:** `pianovibe.md`  
**Scope:** v1 MVP — Core gameplay only  

---

## 1. Overview

This PRD defines the heart of PianoVibe: the falling notes Play Mode. It covers how notes render, how input is evaluated, how scoring works, the practice tools, and all visual/audio feedback systems.

**Not covered in this PRD:**
- Input detection (mic, touch, MIDI) → PRD 2
- Song library and MIDI parsing → PRD 3
- User profiles and XP → PRD 4
- Theme system and polish → PRD 5

---

## 2. Core Game Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                        GAMEPLAY LOOP                            │
├─────────────────────────────────────────────────────────────────┤
│  1. Load song data (MIDI notes + timing + metadata)             │
│  2. Pre-calculate note spawn times (notes spawn N ms before    │
│     their target play time based on fall duration)              │
│  3. Start game clock (synced to song BPM)                      │
│  4. Each frame:                                                │
│     a. Advance game clock                                       │
│     b. Spawn notes whose spawn-time has been reached            │
│     c. Update note positions (fall toward play line)           │
│     d. Check for missed notes (past timing window)             │
│     e. Evaluate any pending input events                       │
│     f. Update scoring, streaks, visual effects                 │
│     g. Render frame (notes, keyboard, UI, particles)           │
│  5. On song end: calculate final score, grade, XP, show recap  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Note Rendering

### 3.1 Visual Design

Each falling note is a **gem-shaped rectangle** with:
- **Gradient fill**: Rich solid color (e.g., warm red, blue, gold) with subtle vertical gradient (lighter at top, darker at bottom)
- **Subtle shine**: Small highlight stripe or reflection near top-left corner
- **Glow effect**: Soft outer glow in the same color (CSS box-shadow or Phaser graphics)
- **Fingering number** (bundled songs only): Small white number (1-5) centered on the gem

**Gem dimensions** (relative to canvas):
- Width: proportional to note duration (min 40px, max 120px)
- Height: 24px (fixed)
- Corner radius: 4px
- Glow spread: 8px

### 3.2 Hand Color Coding

| Hand | Color | Hex (default theme) |
|------|-------|----------------------|
| Right | Warm Red | `#E74C3C` |
| Left | Royal Blue | `#3498DB` |

Notes for the same hand share a color. Glow color matches fill.

### 3.3 Ghost Mode (Muted Hand)

When a hand is muted (user selected "Right only" or "Left only"):
- **Ghost effect**: Note opacity drops to 30%, no glow, slightly desaturated
- **Optional auto-play**: If "auto-play muted hand" setting is ON, muted notes play via synth at the correct time

### 3.4 Fall Physics

- Notes fall at a **constant velocity** calculated from the song's BPM and the canvas height
- Default: notes take **2.5 seconds** to fall from spawn (top of screen) to the play line
- Velocity adjusts proportionally with speed setting (25%-150%)

### 3.5 Auto-Zoom & Scroll

**Active Range Detection:**
- Scan the MIDI data to find the lowest and highest notes in the current view
- Calculate the required piano range (e.g., C3 to C5 = 2 octaves)

**Keyboard Display:**
- Piano keyboard renders at bottom 15% of canvas
- Keyboard zooms to show **2 octaves minimum, 4 octaves maximum**
- If song uses a range wider than displayed, auto-scroll smoothly pans to relevant section

**Scroll Behavior:**
- When a note approaches and is outside the visible keyboard range:
  1. Smoothly animate the keyboard scroll (200ms ease-out)
  2. Pan to show the new octave
  3. Notes continue falling uninterrupted

**User Override:**
- Player can pinch/scroll to manually adjust visible range
- Scroll adjusts in octave increments with snap-to behavior

---

## 4. Play Line & Timing Windows

### 4.1 Play Line

A horizontal line near the bottom of the canvas (above the keyboard):
- **Position**: 80px from bottom of canvas
- **Visual**: Subtle white line with soft glow, labeled "Play Line"

### 4.2 Timing Windows

The timing window defines when a played note counts as "on time." The window is **centered on the note's play time**.

| Preset | Window Size | Label |
|--------|-------------|-------|
| Beginner | ±500ms | "Relaxed" |
| Standard | ±300ms | "Standard" |
| Hard | ±150ms | "Strict" |

**Dev/Debug Mode:**
- Slider available to set any window from 100ms to 700ms
- Display shows exact ms value

### 4.3 Timing Grades

Within the timing window, accuracy is graded:

| Grade | Position in Window | Points | Visual |
|-------|-------------------|--------|--------|
| **Perfect** | Center ±25% | 100% base | Green glow |
| **Good** | 25%-75% | 75% base | Yellow glow |
| **OK** | 75%-100% | 50% base | Dim yellow |

### 4.4 Hit Detection Logic

```
For each played note (pitch P, time T):
  1. Find all expected notes at time T matching pitch P
  2. If multiple matches (rare chords), use the closest
  3. If expected time within timing window → HIT
     - Calculate position within window → grade
     - Award points
     - Update streak
     - Trigger visual feedback
  4. If no match → WRONG NOTE
     - Flash red on played key
     - Break streak
  5. If expected note but no input → MISSED
     - Note turns red, fades out
     - Break streak
```

### 4.5 Early Note Handling

**"Early"** = input arrives before the timing window opens, but within one window's width before the note time.

| Mode | Behavior |
|------|----------|
| Beginner | Ignored — no credit, no penalty |
| Standard | Credit with 25% penalty, counts toward timing grade |
| Hard | Full miss — streak broken, no credit |

### 4.6 Chord Detection

Chords (multiple notes at the same timestamp) have a small **simultaneity tolerance**:
- **Beginner**: ±100ms — notes can be up to 100ms apart and still count as "simultaneous"
- **Standard**: ±50ms
- **Hard**: ±25ms

If user plays chord notes within the simultaneity window, each is graded individually based on its timing.

---

## 5. Scoring System

### 5.1 Points Calculation

```
Base Points per Note = 100
Grade Multiplier:
  - Perfect: 1.0 → 100 pts
  - Good: 0.75 → 75 pts
  - OK: 0.5 → 50 pts

Early Penalty (Standard mode only):
  - Final Points = Base × Grade × 0.75

Late Penalty (Hard mode only):
  - If "late" (>75% into window): Final Points = Base × 0.5
```

### 5.2 Streak System

- **Streak counter**: Increments on each consecutive correct note
- **Streak multiplier**: Caps at 4x
  - 0-4 notes: 1x
  - 5-9 notes: 2x
  - 10-19 notes: 3x
  - 20+ notes: 4x
- **Streak break**: Wrong note, missed note, or hard-mode early note resets to 0
- **Visual escalation** at streak thresholds (see §7)

### 5.3 Final Score

```
Total Score = Σ (Note Points × Streak Multiplier at time of hit)
```

### 5.4 Grade Calculation

At song end, accuracy percentage determines grade:

| Accuracy | Grade |
|----------|-------|
| 95%+ | S |
| 85-94% | A |
| 70-84% | B |
| 50-69% | C |
| <50% | D |

**Accuracy** = (Notes hit correctly) / (Total expected notes)

### 5.5 XP Calculation

XP earned per song:
```
Base XP = 50
Grade Bonus:
  - S: +100
  - A: +50
  - B: +25
  - C: +0
  - D: -25

Speed Bonus (Practice Mode only):
  - >100% speed: +25% XP bonus
  - >125% speed: +50% XP bonus
```

---

## 6. Practice Tools

### 6.1 Speed Slider

- **Range**: 25% to 150% of original tempo
- **Default**: 100%
- **Step**: 5% increments
- **UI**: Horizontal slider with percentage label
- **Effect on game**:
  - Note fall speed scales proportionally
  - Timing window scales proportionally (500ms at 50% speed = 250ms effective)
  - BPM display updates to show current effective tempo

### 6.2 A-B Section Looping

- **Mark A**: Tap button to set loop start at current position
- **Mark B**: Tap button to set loop end at current position
- **Loop active**: Once both A and B are set, song loops from B → A continuously
- **Visual indicator**: A and B markers shown on progress bar
- **Clear loop**: Tap "Clear" or re-mark A to reset
- **Behavior**: Notes smoothly continue from A position (no hard rewind animation)

### 6.3 Mode Selection

Before starting a song, player chooses:

| Mode | Features |
|------|----------|
| **Performance** | Scored, graded, XP awarded, streak active |
| **Practice** | Not scored, no grade, no XP, speed slider + A-B loop available |

In Practice Mode, score is calculated but hidden. After song ends, user can optionally view the "simulated" score from their practice run.

---

## 7. Visual Feedback System

### 7.1 Note Hit Effects

**On Perfect/Good/OK hit:**
1. Note gem flashes bright (100ms)
2. Gem color transitions to success color (green/yellow)
3. Gem emits particle burst (sparks flying outward)
4. Gem fades out over 300ms while continuing to fall slightly

**On Miss:**
1. Note gem turns red
2. Gem shakes briefly (50ms)
3. Gem fades out over 500ms

**On Wrong Note:**
1. Key on keyboard flashes red (200ms)
2. No particle effect

### 7.2 Floating Feedback Text

**"Perfect!" / "Good!" / "OK!" / "Miss!" text appears:**

- **Position**: Below the progress bar, horizontally centered
- **Animation**:
  1. Scale in from 0.5x to 1.2x (100ms, ease-out)
  2. Hold at 1.2x (50ms)
  3. Scale to 1x while floating up 30px (200ms, ease-out)
  4. Fade out (100ms)
- **Color**: Matches feedback type (green/yellow/red)
- **Duration**: Entire animation ~450ms

### 7.3 Streak Effects

| Streak Level | Visual Effect |
|--------------|---------------|
| 5-9 (2x) | Subtle particle trail on notes |
| 10-19 (3x) | Particle trail + streak counter pulses |
| 20+ (4x) | Particle trail + streak counter pulses + subtle screen shake on hits + background intensity increases 10% |

### 7.4 Progress Bar

- **Position**: Top of canvas, below status bar
- **Shows**: Current position in song (time-based, not note-based)
- **Markers**: A and B loop points shown as colored tick marks
- **Visual**: Thin bar (4px), fills with gradient

### 7.5 Combo Counter

- **Position**: Upper-right area of canvas
- **Shows**: Current streak number and multiplier (e.g., "15 × 3")
- **Animation**: Pulses and scales up briefly on increment

### 7.6 Streak Counter / Flame

- **Position**: Upper-left area
- **Shows**: "Streak: X" with flame icon when streak ≥ 5
- **Flame animation**: Flickers subtly when active

---

## 8. Audio System

### 8.1 Default Audio: Silent

- In Performance Mode with microphone input: **no synth audio** by default
- Player hears only their own piano
- This is intentional for learning (train ear, not follow synth)

### 8.2 Optional Metronome

**Toggle**: On/Off  
**Settings**:
- **BPM**: Adjustable (30-240 BPM)
- **Sound**: Click or woodblock
- **Volume**: 0-100%

**Behavior when enabled**:
- Plays click on each beat (based on song's time signature)
- Click timing is synced to game clock

### 8.3 Optional Synth Backing

**Toggle**: On/Off  
**Volume**: 0-100%

**When enabled**:
- Light piano synth plays each note at the correct time
- Useful for:
  - Practice Mode with touch keyboard
  - Players who want audio reference
  - Testing without a real piano

### 8.4 Note Hit Sounds

Optional per-hit feedback sounds (disabled by default):
- Soft chime on Perfect
- Quiet click on Good
- Muted thud on Miss

---

## 9. Game States

```
┌─────────────────────────────────────────────────────────────────┐
│                        GAME STATE MACHINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TITLE/MENU ──[Select Song]──> SONG SETUP                       │
│       ↑                               │                         │
│       │              ┌─────────────────┴──────────────┐         │
│       │              │                               │         │
│       │         [Practice]                      [Performance] │
│       │              ↓                               ↓         │
│       │      PRACTICE MODE                      GAMEPLAY      │
│       │              │                               │         │
│       │    [Speed/Loop UI]                 [Active Gameplay]  │
│       │              │                               │         │
│       │              └─────────────────┬─────────────┘         │
│       │                                ↓                       │
│       │                         SONG COMPLETE                  │
│       │                                │                       │
│       │                      ┌─────────┴─────────┐             │
│       │                      ↓                   ↓             │
│       │              VIEW RECAP            PLAY AGAIN         │
│       │                      ↓                   │             │
│       │                      └──────[Back to Menu]              │
│       │                               ↑                        │
│       │                      [View Score]                      │
│       │                                │                       │
│       └────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 9.1 State Definitions

| State | Description |
|-------|-------------|
| `TITLE` | App launch, profile selection |
| `SONG_SETUP` | Song selected, mode chosen, settings adjusted |
| `PRACTICE` | Practice mode active, speed/loop controls visible |
| `GAMEPLAY` | Performance mode, scoring active |
| `PAUSED` | Game paused, overlay shown |
| `SONG_COMPLETE` | Final score, grade, XP shown |
| `VIEW_RECAP` | Detailed note-by-note breakdown (optional) |

### 9.2 Pause Behavior

- **Trigger**: Tap pause button or press Escape
- **Effect**: Game clock freezes, overlay appears
- **Resume**: Tap resume or press Escape
- **Exit**: Return to menu, session not recorded as complete run

---

## 10. Performance Mode Details

### 10.1 Pre-Song Countdown

When transitioning from SONG_SETUP to GAMEPLAY:
1. Show "Get Ready!" text (1s)
2. Countdown: 3, 2, 1 (1 second each)
3. "Go!" (0.5s)
4. Game clock starts, notes begin falling

### 10.2 Mid-Song UI

During gameplay, UI elements visible:
- **Top-left**: Streak counter + flame
- **Top-right**: Combo counter + multiplier
- **Top-center**: Progress bar
- **Bottom**: Piano keyboard (scrollable/zoomable)
- **Bottom-left**: Speed indicator (Practice Mode only)
- **Bottom-right**: Pause button

### 10.3 Song Complete Recap

End of song shows:
- **Final Score**: Large number
- **Grade**: S / A / B / C / D (large, animated)
- **Accuracy**: Percentage
- **Streak**: Best streak achieved
- **XP Earned**: +XX XP
- **Actions**:
  - "Play Again"
  - "Practice This Song" (switches to Practice Mode)
  - "Back to Menu"

---

## 11. Technical Implementation Notes

### 11.1 Phaser Game Canvas

- **Phaser Version**: 3.x (latest stable)
- **Scene Structure**:
  ```
  Scenes/
    BootScene.js        — Preload assets, init
    MenuScene.js        — Song selection UI (or handled in React)
    GameScene.js        — Main gameplay
    UIScene.js          — Overlay UI (HTML/React optional)
    ResultsScene.js     — End-of-song recap
  ```

### 11.2 React + Phaser Integration

- **React** handles: menus, settings, song library, profile selector
- **Phaser** handles: canvas rendering, game loop, particles
- **Communication**: React can trigger Phaser events via a shared event bus or context
- **Canvas Sizing**: Phaser canvas fills container, responsive to window

### 11.3 Timing Precision

- Use `performance.now()` for high-resolution timestamps
- Game clock should use delta-time accumulation, not wall-clock seconds
- Audio sync via Web Audio API's `currentTime` when playing synth notes

### 11.4 Particle System

- Phaser built-in particle emitter
- Configurable per effect type:
  - **Hit burst**: 15-20 particles, radial explosion, fade out over 500ms
  - **Streak trail**: 5 particles per frame, follow note, short lifespan
  - **High-streak ambient**: Subtle floating particles in background

### 11.5 Performance Targets

| Metric | Target |
|--------|--------|
| Frame rate | 60 FPS |
| Input latency | <20ms from keypress to visual feedback |
| Note spawn accuracy | ±5ms |
| Memory usage | <150MB |

---

## 12. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Song has no notes | Show error: "This MIDI file has no playable notes" |
| MIDI parse fails | Show error: "Could not read this file" |
| No input detected for 5+ seconds | Show hint: "Having trouble? Try tapping the on-screen keys" |
| Browser tab loses focus | Pause game automatically |
| Resize during gameplay | Pause, resize canvas, resume |
| Very fast song (>200 BPM) | Reduce fall duration proportionally to maintain playability |

---

## 13. Accessibility Considerations

- **Screen reader**: Game canvas is not accessible, but menus and settings are
- **Color blindness**: Color-coded hands should use shapes or patterns in addition to color (future enhancement)
- **Hearing**: All feedback has visual components; optional audio cues
- **Motor**: Touch keyboard available; timing windows generous by default

---

## 14. Testing Checklist

### Functional Tests
- [ ] Notes fall at correct speed for given BPM
- [ ] Hit detection correctly identifies Perfect/Good/OK/Miss
- [ ] Streak counter increments and resets correctly
- [ ] Multiplier caps at 4x
- [ ] Final grade calculates correctly based on accuracy
- [ ] Speed slider changes note fall speed proportionally
- [ ] Speed slider scales timing window proportionally
- [ ] A-B loop marks work and loops correctly
- [ ] Practice Mode hides score but can show it after
- [ ] Performance Mode shows live score
- [ ] Pause/resume works correctly
- [ ] Hand isolation toggle mutes correct notes
- [ ] Auto-scroll shows correct octave when note is off-screen

### Visual Tests
- [ ] Gem-shaped notes render with gradient and shine
- [ ] Hand colors are distinct and readable
- [ ] Hit feedback colors are correct (green/yellow/red)
- [ ] Floating text animates correctly
- [ ] Particles emit on hit
- [ ] Streak escalation effects trigger at thresholds
- [ ] Ghost mode notes are semi-transparent
- [ ] Progress bar updates smoothly

### Audio Tests
- [ ] Default: no audio plays during mic input
- [ ] Metronome clicks at correct BPM
- [ ] Synth backing plays notes in time
- [ ] Note hit sounds play when enabled

### Performance Tests
- [ ] Maintains 60 FPS with 100+ simultaneous notes
- [ ] No memory leaks over extended play sessions
- [ ] Responsive on mobile devices (iOS Safari, Chrome Android)

---

## 15. Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| Phaser 3 | Game engine, rendering, particles | 3.x |
| @tonejs/midi | MIDI file parsing | Latest |
| react | UI shell | 18.x |
| react-dom | React DOM rendering | 18.x |

---

## 16. Open Questions (for follow-up)

These are captured in the parent spec's eval and do not block this PRD:

1. ✅ Note rendering style (gems, gradients, shine)
2. ✅ Feedback timing (presets + dev slider)
3. ✅ Scoring mechanics (grade, multiplier)
4. ✅ Streak cap and visual escalation
5. ✅ Practice Mode score visibility
6. ✅ A-B loop behavior
7. ✅ Chord detection tolerance by mode
8. ✅ Early note handling by mode
9. ✅ Metronome adjustable BPM
10. ⏳ **Pending interview**: Input system specifics (PRD 2)

---

## 17. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-03-23 | AI | Initial draft from spec review |
| 0.2 | 2026-03-23 | AI | Updated based on interview responses |
| 1.0 | 2026-03-23 | AI | Finalized after user confirmation |

---

**Next PRD:** [PRD 2: Input System Architecture](./prd-02-input-system.md)
