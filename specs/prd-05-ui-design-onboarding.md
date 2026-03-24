# PRD 5: UI/UX, Visual Design & Onboarding

**Version:** 1.0  
**Author:** PianoVibe Team  
**Status:** Draft  
**Parent Spec:** `pianovibe.md`  
**Dependencies:** PRD 1: Core Game Engine, PRD 4: Profiles & Progression  

---

## 1. Overview

This PRD defines PianoVibe's visual design system, menu architecture, theme implementation, particle effects, and the first-launch onboarding tutorial.

**Design Decisions Summary:**
- CSS variables for flexible theming (single theme in v1)
- Elegant particle effects matching the UI mock
- Game-style main menu with 2-3 primary choices
- Animated video game splash screen
- 60-second tutorial, skippable

---

## 2. Visual Design System

### 2.1 Design Principles

From the spec and UI mock:
- **Dark & polished**: charcoal/navy backgrounds, not pure black
- **Premium game aesthetic**: Monument Valley / Alto's Odyssey feel
- **Rich solid colors**: warm reds, blues, golds — not neon
- **Elegant particles**: sparks and glows, not laser beams
- **Gem-like notes**: rectangular with gradient and subtle shine

### 2.2 Color Palette (v1 Default Theme)

```css
:root {
  /* Backgrounds */
  --bg-primary: #0D1117;          /* Deep charcoal - main background */
  --bg-secondary: #161B22;       /* Slightly lighter - cards, panels */
  --bg-tertiary: #21262D;         /* Modal backgrounds */
  --bg-keyboard: #1A1A24;         /* Keyboard area */
  
  /* Text */
  --text-primary: #F0F6FC;       /* Main text */
  --text-secondary: #8B949E;      /* Muted text */
  --text-accent: #FFFFFF;         /* Emphasis text */
  
  /* Notes - Hand Colors */
  --note-right-hand: #E74C3C;     /* Warm red */
  --note-right-hand-glow: rgba(231, 76, 60, 0.6);
  --note-left-hand: #3498DB;      /* Royal blue */
  --note-left-hand-glow: rgba(52, 152, 219, 0.6);
  
  /* Feedback Colors */
  --feedback-perfect: #2ECC71;    /* Green */
  --feedback-good: #F39C12;        /* Yellow/Orange */
  --feedback-ok: #E67E22;          /* Darker orange */
  --feedback-miss: #E74C3C;       /* Red */
  --feedback-wrong: #C0392B;       /* Dark red */
  
  /* UI Accents */
  --accent-gold: #FFD700;          /* XP, achievements, flames */
  --accent-gold-glow: rgba(255, 215, 0, 0.4);
  
  /* Progress & Streaks */
  --progress-fill: linear-gradient(90deg, #3498DB, #2ECC71);
  --streak-flame: #FF6B35;         /* Orange flame */
  
  /* Piano Keys */
  --key-white: #F5F5F5;
  --key-white-pressed: #E0E0E0;
  --key-black: #1A1A2E;
  --key-black-pressed: #2A2A3E;
  
  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.1);
  --border-active: rgba(255, 255, 255, 0.3);
}
```

### 2.3 Typography

```css
:root {
  /* Font Stack */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Inter', sans-serif; /* For large headings */
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px - captions */
  --text-sm: 0.875rem;   /* 14px - secondary text */
  --text-base: 1rem;     /* 16px - body */
  --text-lg: 1.125rem;   /* 18px - emphasis */
  --text-xl: 1.5rem;     /* 24px - section headers */
  --text-2xl: 2rem;      /* 32px - titles */
  --text-3xl: 3rem;      /* 48px - grade display */
  --text-4xl: 4.5rem;    /* 72px - splash/title */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 2.4 Spacing System

```css
:root {
  /* Base unit: 4px */
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.5rem;     /* 24px */
  --space-6: 2rem;       /* 32px */
  --space-8: 3rem;       /* 48px */
  --space-10: 4rem;      /* 64px */
  --space-12: 6rem;      /* 96px */
}
```

### 2.5 Border Radius

```css
:root {
  --radius-sm: 4px;      /* Buttons, inputs */
  --radius-md: 8px;       /* Cards */
  --radius-lg: 12px;     /* Modals */
  --radius-xl: 16px;     /* Large panels */
  --radius-full: 9999px; /* Pills, avatars */
}
```

### 2.6 Shadows & Glows

```css
:root {
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.6);
  
  /* Note Glows */
  --glow-note: 0 0 12px var(--note-color);
  --glow-perfect: 0 0 20px var(--feedback-perfect);
  --glow-gold: 0 0 30px var(--accent-gold);
}
```

### 2.7 Animation Timings

```css
:root {
  --duration-instant: 50ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 3. Splash Screen

### 3.1 Animated Splash Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                        🎹                                      │
│                                                                 │
│                    PIANOVIBE                                    │
│                                                                 │
│              [ Animated Loading Bar ]                           │
│                                                                 │
│         ████████████████████░░░░░░░░░░                          │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Animation Sequence:**
1. **Fade in** (0-300ms): Background fades in
2. **Logo entrance** (300-800ms): PianoVibe logo scales in (0.8 → 1.0) with slight bounce
3. **Subtitle** (800-1200ms): Tagline fades in: "Learn piano. Play games."
4. **Loading bar** (500-2000ms): Progress bar fills as assets load
5. **Transition** (2000-2500ms): Fade to profile selector

**Loading Bar Animation:**
- Uses CSS animation with progress tied to actual asset loading
- Subtle shimmer effect on the filled portion
- Shows percentage text above bar

### 3.2 Logo Treatment

- **Icon**: Musical keyboard/piano emoji at 72px
- **Font**: Bold weight, slight letter-spacing
- **Effect**: Subtle glow behind logo
- **Shimmer**: Optional subtle shine animation (like chrome/metallic)

---

## 4. Main Menu

### 4.1 Menu Structure

Game-style main menu with prominent choices:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        🎹                                      │
│                                                                 │
│                    PIANOVIBE                                    │
│                                                                 │
│                                                                 │
│              ┌───────────────────────┐                         │
│              │                       │                         │
│              │    🎮  PLAY           │                         │
│              │                       │                         │
│              └───────────────────────┘                         │
│                                                                 │
│              ┌───────────────────────┐                         │
│              │                       │                         │
│              │    📚  LIBRARY        │                         │
│              │                       │                         │
│              └───────────────────────┘                         │
│                                                                 │
│              ┌───────────────────────┐                         │
│              │                       │                         │
│              │    👤  PROFILE         │                         │
│              │                       │                         │
│              └───────────────────────┘                         │
│                                                                 │
│                                                                 │
│                    Level 3 · 250 XP                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Menu Button Design

```css
.menu-button {
  width: 280px;
  height: 64px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
  
  /* Subtle gradient overlay */
  background-image: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0) 100%
  );
}

.menu-button:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-active);
  transform: scale(1.02);
  box-shadow: var(--shadow-md);
}

.menu-button:active {
  transform: scale(0.98);
}
```

### 4.3 Menu Options

| Option | Icon | Destination | Notes |
|--------|------|-------------|-------|
| **Play** | 🎮 | Song library filtered to unlocked songs | Primary action, largest/centered |
| **Library** | 📚 | Full song library (all tiers visible) | Can browse locked songs |
| **Profile** | 👤 | Profile selector + settings | View XP, history, achievements (v1.5) |

### 4.4 Navigation Flow

```
                    ┌─────────────────┐
                    │    SPLASH        │
                    │   (animated)     │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN MENU                                │
│                                                                 │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│    │  PLAY   │  │ LIBRARY │  │ PROFILE │                       │
│    └────┬────┘  └────┬────┘  └────┬────┘                       │
│         │            │            │                             │
│         ▼            ▼            ▼                             │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│    │  SONG   │  │ SONG    │  │ PROFILE │                       │
│    │ SELECT  │  │ LIBRARY │  │ MANAGER │                       │
│    └────┬────┘  └────┬────┘  └────┬────┘                       │
│         │            │            │                             │
│         ▼            │            ▼                             │
│    ┌─────────┐       │      ┌─────────┐                        │
│    │ SONG    │       │      │ SETTINGS │                        │
│    │ SETUP   │       │      └─────────┘                        │
│    └────┬────┘       │                                           │
│         │            │                                           │
│         ▼            │                                           │
│    ┌─────────┐       │                                           │
│    │ GAMEPLAY │       │                                           │
│    └────┬────┘       │                                           │
│         │            │                                           │
│         ▼            │                                           │
│    ┌─────────┐       │                                           │
│    │ RESULTS │       │                                           │
│    └────┬────┘       │                                           │
│         │            │                                           │
│         ▼            ▼                                           │
│    ┌─────────┐  ┌─────────┐                                     │
│    │  MENU   │  │  MENU   │                                     │
│    └─────────┘  └─────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Song Library UI

### 5.1 Library Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  LIBRARY                                    [ Settings ⚙️ ]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tier 1: Beginner                              🔓 Unlocked      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 🎹        │ │ 🎹        │ │ 🎹        │ │ 🎹        │          │
│  │ Fur Elise │ │ Prelude  │ │ Gymnop.  │ │ Arabesque │          │
│  │ Beethoven │ │ Bach     │ │ No.1     │ │ Debussy   │          │
│  │ ⭐⭐⭐     │ │ ⭐⭐      │ │ ⭐       │ │ ⭐⭐      │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  Tier 2: Early Intermediate                    🔒 Level 3        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │    🔒    │ │    🔒    │ │    🔒    │                        │
│  │ Nocturne │ │ Moonlight│ │ Seasons  │                        │
│  │ Chopin   │ │ Beethoven │ │ Tchaikovsky│                      │
│  │           │ │          │ │          │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
│                                                                 │
│  Tier 3: Intermediate                        🔒 Level 5        │
│  ┌──────────┐ ┌──────────┐                                     │
│  │    🔒    │ │    🔒    │                                     │
│  │ Fantaisie│ │ Waltz    │                                     │
│  │ Chopin   │ │ Chopin   │                                     │
│  │           │ │          │                                     │
│  └──────────┘ └──────────┘                                     │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  My Songs (Imported)                         + Import           │
│  ┌──────────┐ ┌──────────┐                                        │
│  │    🎵    │ │    🎵    │                                        │
│  │ Pop Song │ │ Classics  │                                        │
│  │ User     │ │ Custom    │                                        │
│  └──────────┘ └──────────┘                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Song Card Component

```
┌─────────────────────┐
│                     │
│        🎹          │  ← Thumbnail or emoji
│                     │
├─────────────────────┤
│  Song Title         │  ← Max 2 lines
│  Composer Name      │  ← Muted, smaller
├─────────────────────┤
│  ⭐⭐⭐              │  ← Difficulty stars (1-5)
└─────────────────────┘
```

**Card States:**
- **Default**: Standard appearance
- **Hover**: Slight lift, border glow
- **Locked**: Grayed out, padlock overlay, "Level X to unlock" tooltip
- **Playing**: Pulsing border (if currently playing)

### 5.3 Song Card Styling

```css
.song-card {
  width: 140px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
}

.song-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-active);
}

.song-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.song-card.locked:hover {
  transform: none;
  box-shadow: none;
}
```

---

## 6. Particle Effects System

### 6.1 Particle Design

Based on the UI mock, particles should be:
- **Elegant and refined** — soft glows, not harsh sparks
- **Color-matched** — particles inherit from note color
- **Subtle density** — controlled bursts, not overwhelming
- **Streak trails** — wispy lines following notes at high streaks

### 6.2 Particle Types

| Type | Trigger | Visual Description |
|------|---------|-------------------|
| **Hit Burst** | Perfect/Good/OK note | 8-12 small circular particles, radial burst, fade over 400ms |
| **Streak Trail** | Streak ≥ 5 | 3-5 particles per note, follow behind, short lifespan |
| **Miss Fade** | Note missed | Note fades with small dissolving particles |
| **Streak Flame** | Streak ≥ 5 | Animated flame icon flickers beside streak counter |
| **Level Up** | Level increase | Golden particle shower, 30-50 particles, confetti-like |
| **Achievement** | Achievement unlocked | Burst of gold particles + badge icon appears |

### 6.3 Hit Burst Configuration

```javascript
const hitBurstConfig = {
  speed: 100,           // Particle velocity
  scale: { start: 0.5, end: 0 },
  alpha: { start: 1, end: 0 },
  lifespan: 400,        // ms
  
  // Color matches note color
  // Red notes → red particles
  // Blue notes → blue particles
  
  // Blend mode: ADD for glow effect
  blendMode: 'ADD',
  
  // Quantity
  quantity: { min: 8, max: 12 }
};
```

### 6.4 Streak Trail Configuration

```javascript
const streakTrailConfig = {
  speed: 20,            // Slow, follows note
  scale: { start: 0.3, end: 0.1 },
  alpha: { start: 0.6, end: 0 },
  lifespan: 300,        // ms
  
  // Tinted gold/white for premium feel
  tint: 0xFFD700,
  
  // Follow note position
  follow: true,
  
  // Quantity: 3-5 particles per frame
  quantity: { min: 3, max: 5 }
};
```

### 6.5 Streak Flame Animation

```css
/* Flame icon animation */
.streak-flame {
  animation: flicker 0.5s ease-in-out infinite alternate;
}

@keyframes flicker {
  0% {
    transform: scale(1) rotate(-2deg);
    filter: brightness(1);
  }
  100% {
    transform: scale(1.05) rotate(2deg);
    filter: brightness(1.2);
  }
}

/* Color gradient for flame */
.streak-flame::before {
  background: linear-gradient(
    180deg,
    #FFD700 0%,
    #FF6B35 50%,
    #E74C3C 100%
  );
}
```

### 6.6 Phaser Particle Implementation

```javascript
// In Phaser GameScene
createParticleEmitters() {
  // Hit burst emitter (reused, repositioned per note)
  this.hitBurstEmitter = this.add.particles(0, 0, 'particle-texture', {
    speed: { min: 50, max: 150 },
    scale: { start: 0.4, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 400,
    blendMode: 'ADD',
    emitting: false
  });
  
  // Streak trail emitter (follows notes)
  this.streakTrailEmitter = this.add.particles(0, 0, 'particle-texture', {
    speed: { min: 10, max: 30 },
    scale: { start: 0.2, end: 0 },
    alpha: { start: 0.5, end: 0 },
    lifespan: 300,
    blendMode: 'ADD',
    emitting: false,
    follow: this.activeNoteGroup
  });
}

// Emit burst at note hit position
emitHitBurst(noteX, noteY, noteColor) {
  this.hitBurstEmitter.setPosition(noteX, noteY);
  this.hitBurstEmitter.setParticleTint(noteColor);
  this.hitBurstEmitter.explode(10);
}
```

---

## 7. Floating Feedback Text

### 7.1 "Perfect!" / "Good!" / "OK!" / "Miss!" Animation

From the UI mock, feedback text appears below the progress bar:

```javascript
// Animation sequence (450ms total)
const feedbackAnimation = {
  // Phase 1: Scale in (100ms)
  0: { scale: 0.5, alpha: 0, y: 0 },
  100: { scale: 1.2, alpha: 1, y: 0 },
  
  // Phase 2: Hold (50ms)
  150: { scale: 1.2, alpha: 1, y: 0 },
  
  // Phase 3: Float up + settle (200ms)
  350: { scale: 1, alpha: 1, y: -30 },
  
  // Phase 4: Fade out (100ms)
  450: { scale: 1, alpha: 0, y: -40 }
};
```

### 7.2 Styling

```css
.feedback-text {
  font-size: 2rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 10px currentColor;
  pointer-events: none;
}

.feedback-text.perfect {
  color: var(--feedback-perfect);
}

.feedback-text.good {
  color: var(--feedback-good);
}

.feedback-text.ok {
  color: var(--feedback-ok);
}

.feedback-text.miss {
  color: var(--feedback-miss);
}
```

---

## 8. Onboarding Tutorial

### 8.1 Tutorial Flow

**When:** First launch (or profile creation)  
**Duration:** ~60 seconds  
**Skippable:** Yes, with "Skip Tutorial" button  

### 8.2 Tutorial Steps

```
STEP 1: Welcome (5 seconds)
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     🎹 Welcome to PianoVibe!                 │
│                                                             │
│        Learn piano through an immersive game experience     │
│                                                             │
│                                                             │
│                         [ Continue → ]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

STEP 2: Choose Your Input (10 seconds)
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   How will you play?                        │
│                                                             │
│         🎤 Use Microphone        📱 Use On-Screen Keys       │
│         (with real piano)         (touch anywhere)          │
│                                                             │
│     ┌─────────────────────────────────────┐                │
│     │  💡 Tip: Mic mode lets you play     │                │
│     │     with your actual piano!         │                │
│     └─────────────────────────────────────┘                │
│                                                             │
│                         [ Continue → ]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

STEP 3: Mic Permission (10 seconds, if mic selected)
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              🎤 Microphone Access Needed                    │
│                                                             │
│        To detect notes from your piano, PianoVibe          │
│        needs to listen through your microphone.            │
│                                                             │
│        [ Allow Microphone Access ]                          │
│                                                             │
│        ─── or ───                                           │
│                                                             │
│        [ I'll Use On-Screen Keys Instead ]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

STEP 4: Play Your First Notes (20 seconds)
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         🎮 Play the falling notes!                          │
│                                                             │
│         ┌─────────────────────────────────────────┐        │
│         │                                          │        │
│         │      ███  (note falls)                    │        │
│         │           ↓                              │        │
│         │      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      │        │
│         │      ════════════════════════           │        │
│         │         (play line)                      │        │
│         │                                          │        │
│         │      │█│█│ │█│ │█│ │█│ │█│ │█│          │        │
│         │      (piano keys)                        │        │
│         └─────────────────────────────────────────┘        │
│                                                             │
│     Play a note when the gem reaches the line!             │
│                                                             │
│                      [ Start Playing → ]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

STEP 5: First Song Practice (15 seconds)
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│          🎵 Try it with a real song!                        │
│                                                             │
│         ████████████░░░░░░░░░░░░░░░░░░░░░░░░              │
│         (Pre-selected beginner song loads)                  │
│                                                             │
│         Play through the first 8 bars...                    │
│         (Assisted with extra-wide timing)                  │
│                                                             │
│         [ Skip Tutorial ]                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

STEP 6: Tutorial Complete (10 seconds)
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🎉 You're Ready!                         │
│                                                             │
│         Here's how to level up:                             │
│         • Play songs to earn XP                              │
│         • Higher grades = more XP                            │
│         • Level up to unlock harder songs                    │
│                                                             │
│         ┌─────────────┐  ┌─────────────┐                   │
│         │   ✓ Done!   │  │  Go to Menu  │                   │
│         └─────────────┘  └─────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Tutorial State Management

```typescript
interface TutorialState {
  hasCompletedTutorial: boolean;
  selectedInput: 'mic' | 'touch';
  profileId: string;
  tutorialVersion: string;  // For future tutorial updates
}

// Stored in IndexedDB with profile
// Key: 'hasCompletedTutorial' in profile settings
```

### 8.4 Replay Option

- After tutorial is skipped, show subtle "Replay Tutorial" in settings menu
- Version number on tutorial allows showing "What's New" for tutorial changes

---

## 9. Gameplay HUD

### 9.1 HUD Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🔥 Streak: 15        [═══════░░░░░░░░░░░░░░░]  2:34 / 4:12     │
│                                                    COMBO: 15×2  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      (Notes fall here)                          │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         │█│█│ │█│ │█│ │█│ │█│ │█│ │█│ │█│ │█│ │█│ │█│ │█│      │
│         ══════════════════════════════════════════════════    │
│                        (Play Line)                               │
│                                                                 │
│     [🔀 Speed]  [🔁 Loop]  [🤫 Audio]              [⏸ Pause]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 HUD Components

| Component | Position | Shows |
|-----------|----------|-------|
| Streak Counter | Top-left | "Streak: X" with flame icon when ≥5 |
| Progress Bar | Top-center | Song progress + time elapsed / total |
| Combo Counter | Top-right | "COMBO: X×Y" (streak × multiplier) |
| Pause Button | Bottom-right | Pause game |
| Speed Slider | Bottom-left | 100% (Practice mode only) |
| Loop Button | Bottom-left | A-B loop controls |
| Audio Button | Bottom-left | Toggle metronome/synth |

---

## 10. React + Phaser UI Integration

### 10.1 HTML UI Layer

React handles:
- Splash screen
- Profile selector
- Main menu
- Song library
- Song setup (before game)
- Results screen
- Settings

### 10.2 Phaser Canvas UI

Phaser handles:
- Falling notes
- Piano keyboard
- Particles
- Feedback text
- Gameplay HUD (optional, can be HTML overlay)
- Animations

### 10.3 Hybrid HUD Approach

For best of both:
- **HTML overlay** for HUD elements (streak, progress, buttons)
- **CSS animations** for smooth UI updates
- **Phaser** for game-critical visuals (notes, particles)

```html
<!-- index.html -->
<div id="game-container">
  <div id="react-ui"><!-- Profile selector, menus, etc --></div>
  <div id="phaser-canvas"><!-- Game rendering --></div>
  <div id="hud-overlay"><!-- Streak, progress, buttons --></div>
</div>
```

---

## 11. Testing Checklist

### Visual Design
- [ ] Dark theme colors match spec
- [ ] Notes look like gems with gradients
- [ ] Hand colors are distinct and readable
- [ ] Fonts render correctly on all platforms
- [ ] Spacing is consistent with design system

### Splash Screen
- [ ] Logo animates in smoothly
- [ ] Loading bar shows progress
- [ ] Transitions to profile selector

### Main Menu
- [ ] All three options visible (Play, Library, Profile)
- [ ] Buttons have hover/active states
- [ ] Navigation works correctly

### Song Library
- [ ] Songs display in grid
- [ ] Locked tiers show padlock
- [ ] Tier unlock requirements visible
- [ ] Imported songs section present

### Particles
- [ ] Hit bursts emit at correct position
- [ ] Particle colors match note colors
- [ ] Streak trails appear at correct threshold
- [ ] Level-up particle shower works
- [ ] Performance: 60 FPS with particles active

### Feedback Text
- [ ] "Perfect!" etc. animates correctly
- [ ] Text appears below progress bar
- [ ] Colors match feedback type
- [ ] Text doesn't overlap other elements

### Tutorial
- [ ] Tutorial appears on first launch
- [ ] Skip button works
- [ ] Mic permission flow works
- [ ] Tutorial completes successfully
- [ ] After tutorial, main menu appears
- [ ] Tutorial state persists

---

## 12. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-23 | AI | Initial draft |

---

**Next PRD:** [PRD 6: Learn Mode (Sheet Music Drills)](./prd-06-learn-mode.md) *(v1.5)*
