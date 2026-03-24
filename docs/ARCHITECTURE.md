# PianoVibe — Technical Architecture

**Version:** 1.0  
**Status:** Draft  
**Stack:** React 18 + Phaser 3 + TypeScript + Vite  

---

## 1. Overview

PianoVibe is a hybrid application combining:
- **React** for the UI shell (menus, profiles, library, settings)
- **Phaser 3** for the game canvas (falling notes, particles, scoring)
- **IndexedDB** for local persistence

The architecture follows the game-creator conventions from the Phaser skill:
- EventBus for all cross-module communication
- Centralized GameState with clean reset
- All config values in Constants
- Scene-based Phaser architecture

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PIANOVIBE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    REACT SHELL                           │   │
│  │                                                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │ Splash  │  │ Profile │  │ Library │  │ Settings│   │   │
│  │  │ Screen  │  │ Select  │  │ Screen  │  │ Screen  │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              React Router                         │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              │ Events (start, pause, settings) │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    PHASER CANVAS                         │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              EventBus (shared)                   │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              GameState (singleton)              │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │                    SCENES                        │   │   │
│  │  │  Boot → Preloader → Menu → Game → Results       │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │                  GAME OBJECTS                   │   │   │
│  │  │  Note │ Keyboard │ Particles │ FeedbackText    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    INPUT SYSTEM                          │   │
│  │                                                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                  │   │
│  │  │   Mic   │  │  Touch  │  │   MIDI  │ (v1.5)           │   │
│  │  │ (Pitchy)│  │ Handler │  │  (v1.5) │                  │   │
│  │  └─────────┘  └─────────┘  └─────────┘                  │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              InputBridge → EventBus             │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  INDEXEDDB STORAGE                       │   │
│  │                                                         │   │
│  │  Profiles │ RunHistory │ ImportedSongs │ Settings      │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Project Structure

```
pianovibe/
├── public/
│   └── songs/                    # Bundled MIDI songs
│       ├── fur-elise/
│       │   ├── midi.mid
│       │   ├── metadata.json
│       │   └── fingering.json
│       └── ...
├── src/
│   ├── core/                     # Shared game foundation
│   │   ├── EventBus.ts           # Singleton event emitter
│   │   ├── GameState.ts         # Centralized state
│   │   ├── Constants.ts         # All config values
│   │   └── types.ts             # Shared TypeScript types
│   │
│   ├── react/                    # React UI shell
│   │   ├── App.tsx              # Main React app
│   │   ├── main.tsx             # React entry
│   │   ├── pages/               # Route pages
│   │   │   ├── Splash.tsx
│   │   │   ├── ProfileSelect.tsx
│   │   │   ├── MainMenu.tsx
│   │   │   ├── Library.tsx
│   │   │   ├── GameWrapper.tsx  # Contains Phaser canvas
│   │   │   ├── Results.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/           # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── SongCard.tsx
│   │   │   ├── AvatarPicker.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Tutorial.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useProfiles.ts
│   │   │   ├── useStorage.ts
│   │   │   └── usePhaser.ts     # Phaser integration
│   │   └── styles/              # CSS modules / Tailwind
│   │       └── global.css
│   │
│   ├── phaser/                   # Phaser game engine
│   │   ├── config.ts            # Phaser game config
│   │   ├── main.ts              # Phaser entry point
│   │   │
│   │   ├── scenes/              # Phaser scenes
│   │   │   ├── BootScene.ts     # Initialize
│   │   │   ├── PreloaderScene.ts # Load assets
│   │   │   ├── MenuScene.ts     # In-game menu (optional)
│   │   │   ├── GameScene.ts     # Main gameplay
│   │   │   └── ResultsScene.ts  # End of song
│   │   │
│   │   ├── objects/              # Game entities
│   │   │   ├── FallingNote.ts   # Note gem
│   │   │   ├── PianoKeyboard.ts  # Touch keyboard
│   │   │   ├── PlayLine.ts      # Target line
│   │   │   ├── FeedbackText.ts  # "Perfect!" text
│   │   │   └── ProgressBar.ts   # Song progress
│   │   │
│   │   ├── systems/              # Game subsystems
│   │   │   ├── NoteSpawner.ts   # Spawns notes at right time
│   │   │   ├── HitDetector.ts   # Evaluates player input
│   │   │   ├── Scorer.ts        # Calculates score/grade
│   │   │   ├── StreakManager.ts # Tracks combos
│   │   │   ├── ParticleManager.ts
│   │   │   └── AudioManager.ts  # Metronome/synth
│   │   │
│   │   └── ui/                   # In-game Phaser UI
│   │       ├── StreakCounter.ts
│   │       ├── ComboDisplay.ts
│   │       └── PauseOverlay.ts
│   │
│   ├── input/                    # Input system
│   │   ├── InputBridge.ts       # Normalizes all input
│   │   ├── MicInput.ts          # Pitchy integration
│   │   ├── TouchInput.ts        # Touch keyboard handler
│   │   ├── MidiInput.ts         # Web MIDI (v1.5)
│   │   └── pitchy-worker.ts     # Pitch detection worker
│   │
│   ├── storage/                  # IndexedDB management
│   │   ├── db.ts                # Database init
│   │   ├── profiles.ts          # Profile operations
│   │   ├── songs.ts             # Song storage
│   │   └── history.ts           # Run history
│   │
│   ├── midi/                    # MIDI processing
│   │   ├── parser.ts            # @tonejs/midi wrapper
│   │   ├── trackDetector.ts     # Piano track detection
│   │   ├── normalizer.ts        # Normalize to GameReadyNote
│   │   └── fingeringLoader.ts   # Load fingering data
│   │
│   └── utils/                   # Utilities
│       ├── pitch-utils.ts       # Frequency ↔ MIDI ↔ Name
│       ├── time-utils.ts         # Timing calculations
│       └── constants.ts         # Non-game constants
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── SPEC.md                      # Link to specs/ directory
```

---

## 4. Core Modules

### 4.1 EventBus

```typescript
// src/core/EventBus.ts
type EventCallback = (data?: unknown) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
  emit(event: string, data?: unknown): void;
  once(event: string, callback: EventCallback): void;
}

// Shared singleton between React and Phaser
export const eventBus = new EventBus();
```

### 4.2 Event Constants

```typescript
// src/core/EventBus.ts
export const Events = {
  // Game Flow
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_END: 'game:end',
  GAME_RESTART: 'game:restart',
  
  // Input
  NOTE_PLAYED: 'input:notePlayed',
  NOTE_RELEASED: 'input:noteReleased',
  MIC_PERMISSION: 'input:micPermission',
  INPUT_MODE_CHANGE: 'input:modeChange',
  
  // Gameplay
  NOTE_SPAWNED: 'game:noteSpawned',
  NOTE_HIT: 'game:noteHit',
  NOTE_MISSED: 'game:noteMissed',
  NOTE_WRONG: 'game:noteWrong',
  STREAK_UPDATE: 'game:streakUpdate',
  SCORE_UPDATE: 'game:scoreUpdate',
  
  // Spectacle Events (for visual polish)
  SPECTACLE_HIT: 'spectacle:hit',
  SPECTACLE_COMBO: 'spectacle:combo',
  SPECTACLE_STREAK: 'spectacle:streak',
  
  // Results
  RESULTS_SHOW: 'results:show',
  
  // Profile
  PROFILE_SELECT: 'profile:select',
  XP_EARNED: 'profile:xpEarned',
  LEVEL_UP: 'profile:levelUp',
};
```

### 4.3 GameState

```typescript
// src/core/GameState.ts
interface GameStateData {
  // Profile
  currentProfileId: string | null;
  
  // Song
  currentSongId: string | null;
  currentSongData: GameReadyNote[] | null;
  
  // Gameplay
  isPlaying: boolean;
  isPaused: boolean;
  mode: 'performance' | 'practice';
  
  // Scoring
  score: number;
  streak: number;
  maxStreak: number;
  notesHit: number;
  notesMissed: number;
  notesTotal: number;
  
  // Settings
  timingPreset: 'beginner' | 'standard' | 'hard';
  timingWindowMs: number;
  handMode: 'both' | 'left' | 'right';
  speed: number;
  
  // Practice
  loopStart: number | null;
  loopEnd: number | null;
}

class GameState {
  private data: GameStateData;
  
  reset(): void {
    // Full clean reset - called on game restart
    this.data.score = 0;
    this.data.streak = 0;
    this.data.maxStreak = 0;
    this.data.notesHit = 0;
    this.data.notesMissed = 0;
    this.data.isPlaying = false;
    this.data.isPaused = false;
    this.data.loopStart = null;
    this.data.loopEnd = null;
  }
  
  get<K extends keyof GameStateData>(key: K): GameStateData[K];
  set<K extends keyof GameStateData>(key: K, value: GameStateData[K]): void;
}

export const gameState = new GameState();
```

### 4.4 Constants

```typescript
// src/core/Constants.ts

// ═══════════════════════════════════════════════════════════
// GAME CONFIGURATION - All magic numbers go here
// ═══════════════════════════════════════════════════════════

export const GAME = {
  WIDTH: 1280,
  HEIGHT: 720,
  BACKGROUND_COLOR: 0x0D1117,
};

// ═══════════════════════════════════════════════════════════
// NOTE FALLING PHYSICS
// ═══════════════════════════════════════════════════════════

export const NOTE = {
  FALL_DURATION_SEC: 2.5,        // Time to fall from top to play line
  HEIGHT: 24,                     // Note gem height in pixels
  MIN_WIDTH: 40,                  // Minimum gem width (short notes)
  MAX_WIDTH: 120,                 // Maximum gem width (long notes)
  CORNER_RADIUS: 4,
  GLOW_SPREAD: 8,
  
  // Colors
  RIGHT_HAND_COLOR: 0xE74C3C,
  LEFT_HAND_COLOR: 0x3498DB,
  GHOST_OPACITY: 0.3,
};

// ═══════════════════════════════════════════════════════════
// TIMING WINDOWS (in milliseconds)
// ═══════════════════════════════════════════════════════════

export const TIMING = {
  PRESETS: {
    beginner: { window: 500, label: 'Relaxed' },
    standard: { window: 300, label: 'Standard' },
    hard: { window: 150, label: 'Strict' },
  },
  
  // Timing grades (percentage of window)
  PERFECT: 0.25,                  // Center 25% of window
  GOOD: 0.75,                     // 25-75% of window
  OK: 1.0,                        // 75-100% of window
  
  // Early note handling
  EARLY_PENALTY_MULTIPLIER: 0.75, // Standard mode early penalty
  
  // Chord simultaneity tolerance (ms)
  CHORD_TOLERANCE: {
    beginner: 100,
    standard: 50,
    hard: 25,
  },
};

// ═══════════════════════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════════════════════

export const SCORING = {
  BASE_POINTS: 100,
  
  GRADE_MULTIPLIERS: {
    S: 2.0,
    A: 1.5,
    B: 1.2,
    C: 1.0,
    D: 0.5,
  },
  
  STREAK_MULTIPLIERS: [
    { minStreak: 0, maxStreak: 4, multiplier: 1 },
    { minStreak: 5, maxStreak: 9, multiplier: 2 },
    { minStreak: 10, maxStreak: 19, multiplier: 3 },
    { minStreak: 20, maxStreak: Infinity, multiplier: 4 },
  ],
  
  GRADE_THRESHOLDS: {
    S: 95,
    A: 85,
    B: 70,
    C: 50,
  },
};

// ═══════════════════════════════════════════════════════════
// XP & PROGRESSION
// ═══════════════════════════════════════════════════════════

export const PROGRESSION = {
  BASE_XP_BY_TIER: {
    1: 30,
    2: 50,
    3: 75,
    4: 100,
    5: 150,
  },
  
  LEVEL_THRESHOLDS: [0, 100, 250, 500, 850, 1300, 1900, 2700, 3800, 5200],
  
  TIER_UNLOCK_LEVELS: {
    1: 1,
    2: 3,
    3: 5,
  },
  
  MAX_LEVEL: 10,
};

// ═══════════════════════════════════════════════════════════
// VISUAL FEEDBACK
// ═══════════════════════════════════════════════════════════

export const FEEDBACK = {
  COLORS: {
    perfect: 0x2ECC71,
    good: 0xF39C12,
    ok: 0xE67E22,
    miss: 0xE74C3C,
    wrong: 0xC0392B,
  },
  
  FLOATING_TEXT: {
    DURATION_MS: 450,
    SCALE_IN: 1.2,
    FLOAT_DISTANCE: 30,
  },
  
  PARTICLES: {
    HIT_BURST_COUNT: 10,
    HIT_BURST_LIFESPAN: 400,
    STREAK_TRAIL_COUNT: 5,
    STREAK_TRAIL_LIFESPAN: 300,
  },
  
  STREAK_EFFECTS: {
    FLAME_THRESHOLD: 5,
    SHAKE_THRESHOLD: 20,
  },
};

// ═══════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════

export const AUDIO = {
  METRONOME_BPM_MIN: 30,
  METRONOME_BPM_MAX: 240,
  
  PITCHY: {
    SAMPLE_RATE: 44100,
    BUFFER_SIZE: 2048,
    MIN_FREQUENCY: 27.5,      // A0
    MAX_FREQUENCY: 4186,      // C8
    MIN_CONFIDENCE: 0.8,
    DEBOUNCE_MS: 50,
  },
};

// ═══════════════════════════════════════════════════════════
// PRACTICE TOOLS
// ═══════════════════════════════════════════════════════════

export const PRACTICE = {
  SPEED_MIN: 0.25,
  SPEED_MAX: 1.5,
  SPEED_STEP: 0.05,
  SPEED_DEFAULT: 1.0,
};
```

---

## 5. React-Phaser Integration

### 5.1 Entry Points

```typescript
// src/react/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../core/EventBus';  // Initialize shared event bus

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```typescript
// src/phaser/main.ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { GameScene } from './scenes/GameScene';
import { ResultsScene } from './scenes/ResultsScene';
import { GAME } from '../core/Constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: GAME.BACKGROUND_COLOR,
  parent: 'phaser-container',
  scene: [BootScene, PreloaderScene, GameScene, ResultsScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  audio: {
    disableWebAudio: true,  // We handle audio separately
  },
};

export const game = new Phaser.Game(config);
```

### 5.2 GameWrapper Component

```typescript
// src/react/components/GameWrapper.tsx
import { useEffect, useRef } from 'react';
import { eventBus, Events } from '../../core/EventBus';
import { game } from '../../phaser/main';

interface GameWrapperProps {
  songData: GameReadyNote[];
  settings: GameSettings;
  onGameEnd: (results: GameResults) => void;
}

export function GameWrapper({ songData, settings, onGameEnd }: GameWrapperProps) {
  useEffect(() => {
    // Listen for game end event
    const handleGameEnd = (results: GameResults) => {
      onGameEnd(results);
    };
    
    eventBus.on(Events.GAME_END, handleGameEnd);
    
    // Start the game with song data
    eventBus.emit(Events.GAME_START, { songData, settings });
    
    return () => {
      eventBus.off(Events.GAME_END, handleGameEnd);
    };
  }, [songData, settings, onGameEnd]);
  
  return <div id="phaser-container" />;
}
```

### 5.3 Event Communication

```typescript
// In React - starting a game
eventBus.emit(Events.GAME_START, {
  songId: 'fur-elise',
  mode: 'performance',
  speed: 1.0,
  handMode: 'both',
  timingPreset: 'standard',
});

// In Phaser - listening for game start
export class BootScene extends Phaser.Scene {
  create() {
    eventBus.on(Events.GAME_START, (data: GameStartData) => {
      this.scene.start('Game', data);
    });
  }
}
```

---

## 6. Input System Architecture

### 6.1 InputBridge

```typescript
// src/input/InputBridge.ts
import { EventEmitter } from 'events';
import { eventBus, Events } from '../core/EventBus';

export interface InputEvent {
  type: 'noteOn' | 'noteOff';
  pitch: string;
  midiNote: number;
  velocity: number;
  timestamp: number;
  source: 'mic' | 'touch' | 'midi';
  confidence?: number;
}

class InputBridge extends EventEmitter {
  private activeSource: 'mic' | 'touch' | 'midi' = 'touch';
  
  setActiveSource(source: 'mic' | 'touch' | 'midi'): void {
    this.activeSource = source;
    eventBus.emit(Events.INPUT_MODE_CHANGE, { source });
  }
  
  emitNoteOn(event: Omit<InputEvent, 'type'>): void {
    if (event.source !== this.activeSource) return;
    const fullEvent = { ...event, type: 'noteOn' as const };
    this.emit('noteOn', fullEvent);
    eventBus.emit(Events.NOTE_PLAYED, fullEvent);
  }
  
  emitNoteOff(event: Omit<InputEvent, 'type'>): void {
    if (event.source !== this.activeSource) return;
    const fullEvent = { ...event, type: 'noteOff' as const };
    this.emit('noteOff', fullEvent);
    eventBus.emit(Events.NOTE_RELEASED, fullEvent);
  }
}

export const inputBridge = new InputBridge();
```

### 6.2 Mic Input Module

```typescript
// src/input/MicInput.ts
import Pitchy from 'pitchy';
import { inputBridge } from './InputBridge';

export class MicInput {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private pitchDetector: any = null;
  private lastNotes: Map<number, number> = new Map();
  
  async initialize(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      
      this.audioContext = new AudioContext({ sampleRate: 44100 });
      const source = this.audioContext.createMediaStreamSource(stream);
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);
      
      const buffer = new Float32Array(2048);
      this.pitchDetector = Pitchy.findPitch(buffer, 44100);
      
      this.startDetection();
    } catch (error) {
      console.error('Mic initialization failed:', error);
    }
  }
  
  private startDetection(): void {
    const detect = () => {
      if (!this.analyser || !this.pitchDetector) return;
      
      const data = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(data);
      
      const [frequency, clarity] = this.pitchDetector(data);
      
      if (clarity > 0.8 && frequency > 27.5 && frequency < 4186) {
        const midiNote = this.frequencyToMidi(frequency);
        this.emitNote(midiNote, 0.8);
      }
      
      requestAnimationFrame(detect);
    };
    
    detect();
  }
  
  private frequencyToMidi(frequency: number): number {
    return Math.round(12 * Math.log2(frequency / 440) + 69);
  }
  
  private emitNote(midiNote: number, velocity: number): void {
    const now = performance.now();
    const lastTime = this.lastNotes.get(midiNote) || 0;
    
    // Debounce
    if (now - lastTime < 50) return;
    this.lastNotes.set(midiNote, now);
    
    inputBridge.emitNoteOn({
      pitch: this.midiToPitch(midiNote),
      midiNote,
      velocity,
      timestamp: now,
      source: 'mic',
      confidence: 0.9,
    });
  }
  
  private midiToPitch(midiNote: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    return `${notes[midiNote % 12]}${octave}`;
  }
}
```

---

## 7. MIDI Processing Pipeline

### 7.1 Parser

```typescript
// src/midi/parser.ts
import Midi from '@tonejs/midi';
import type { ParsedNote } from '../core/types';

export async function parseMidi(file: ArrayBuffer | Blob): Promise<Midi> {
  const buffer = file instanceof Blob 
    ? await file.arrayBuffer() 
    : file;
  return new Midi(buffer);
}

export function extractNotes(midi: Midi, trackIndices: number[]): ParsedNote[] {
  const notes: ParsedNote[] = [];
  
  for (const trackIndex of trackIndices) {
    const track = midi.tracks[trackIndex];
    if (!track) continue;
    
    for (const note of track.notes) {
      notes.push({
        id: generateId(),
        pitch: note.name,
        midiNote: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: note.velocity,
        trackIndex,
        channel: track.channel,
      });
    }
  }
  
  return notes.sort((a, b) => a.time - b.time);
}
```

### 7.2 Piano Track Detection

```typescript
// src/midi/trackDetector.ts
export interface TrackInfo {
  index: number;
  name: string;
  instrument: string;
  noteCount: number;
  minNote: number;
  maxNote: number;
  isPiano: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export function detectPianoTracks(midi: Midi): TrackInfo[] {
  const results: TrackInfo[] = [];
  
  for (let i = 0; i < midi.tracks.length; i++) {
    const track = midi.tracks[i];
    const info: TrackInfo = {
      index: i,
      name: track.name || `Track ${i + 1}`,
      instrument: getInstrumentName(track),
      noteCount: track.notes.length,
      minNote: Math.min(...track.notes.map(n => n.midi)),
      maxNote: Math.max(...track.notes.map(n => n.midi)),
      isPiano: false,
      confidence: 'low',
    };
    
    // Check program change (GM Piano = 0-7)
    const programChanges = track.programChanges;
    if (programChanges.length > 0) {
      const program = programChanges[0].value;
      if (program >= 0 && program <= 7) {
        info.isPiano = true;
        info.confidence = 'high';
      }
    }
    
    // Check note range
    if (!info.isPiano && info.minNote >= 21 && info.maxNote <= 108) {
      info.isPiano = true;
      info.confidence = 'medium';
    }
    
    results.push(info);
  }
  
  return results;
}
```

---

## 8. IndexedDB Storage

### 8.1 Database Setup

```typescript
// src/storage/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PianoVibeDB extends DBSchema {
  profiles: {
    key: string;
    value: Profile;
  };
  runHistory: {
    key: string;
    value: RunHistoryEntry;
    indexes: { 'by-profile': string };
  };
  importedSongs: {
    key: string;
    value: ImportedSong;
    indexes: { 'by-profile': string };
  };
  settings: {
    key: string;
    value: ProfileSettings;
  };
}

let db: IDBPDatabase<PianoVibeDB>;

export async function initDB(): Promise<IDBPDatabase<PianoVibeDB>> {
  if (db) return db;
  
  db = await openDB<PianoVibeDB>('PianoVibeDB', 1, {
    upgrade(database) {
      const profiles = database.createObjectStore('profiles', { keyPath: 'id' });
      const history = database.createObjectStore('runHistory', { keyPath: 'id' });
      history.createIndex('by-profile', 'profileId');
      const songs = database.createObjectStore('importedSongs', { keyPath: 'id' });
      songs.createIndex('by-profile', 'profileId');
      database.createObjectStore('settings', { keyPath: 'profileId' });
    },
  });
  
  return db;
}
```

### 8.2 Profile Operations

```typescript
// src/storage/profiles.ts
import { initDB } from './db';
import type { Profile } from '../core/types';

export async function createProfile(name: string, avatar: string): Promise<Profile> {
  const db = await initDB();
  const profile: Profile = {
    id: crypto.randomUUID(),
    name,
    avatar,
    isGuest: false,
    xp: 0,
    level: 1,
    unlockedTiers: [1],
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    totalPlayTime: 0,
    songsPlayed: 0,
  };
  await db.put('profiles', profile);
  return profile;
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  const db = await initDB();
  return db.get('profiles', id);
}

export async function getAllProfiles(): Promise<Profile[]> {
  const db = await initDB();
  return db.getAll('profiles');
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
  const db = await initDB();
  const profile = await db.get('profiles', id);
  if (profile) {
    await db.put('profiles', { ...profile, ...updates, lastActiveAt: Date.now() });
  }
}

export async function addXP(profileId: string, amount: number): Promise<{ leveledUp: boolean; newLevel: number }> {
  const profile = await getProfile(profileId);
  if (!profile) throw new Error('Profile not found');
  
  const newXP = profile.xp + amount;
  const newLevel = calculateLevel(newXP);
  const leveledUp = newLevel > profile.level;
  
  await updateProfile(profileId, { xp: newXP, level: newLevel });
  
  return { leveledUp, newLevel };
}
```

---

## 9. Scene Architecture (Phaser)

### 9.1 Scene Lifecycle

```typescript
// src/phaser/scenes/GameScene.ts
export class GameScene extends Phaser.Scene {
  private notes: Phaser.GameObjects.Group;
  private keyboard: PianoKeyboard | null = null;
  private scorer: Scorer | null = null;
  private noteSpawner: NoteSpawner | null = null;
  private particleManager: ParticleManager | null = null;
  
  constructor() {
    super({ key: 'Game' });
  }
  
  init(data: GameStartData): void {
    // Receive data from previous scene
    gameState.set('currentSongId', data.songId);
    gameState.set('mode', data.mode);
    gameState.set('speed', data.speed);
    gameState.set('handMode', data.handMode);
    gameState.set('timingPreset', data.timingPreset);
    gameState.set('timingWindowMs', TIMING.PRESETS[data.timingPreset].window);
    gameState.set('currentSongData', data.songData);
    gameState.reset();
  }
  
  create(): void {
    // Spawn initial elements
    this.createBackground();
    this.createPlayLine();
    this.createKeyboard();
    this.createHUD();
    
    // Initialize systems
    this.noteSpawner = new NoteSpawner(this, gameState.get('currentSongData'));
    this.scorer = new Scorer();
    this.particleManager = new ParticleManager(this);
    
    // Listen for input events
    eventBus.on(Events.NOTE_PLAYED, this.handleNotePlayed);
    eventBus.on(Events.GAME_PAUSE, this.handlePause);
    eventBus.on(Events.GAME_RESUME, this.handleResume);
    
    // Start the game
    gameState.set('isPlaying', true);
    eventBus.emit(Events.GAME_START, { songId: data.songId });
  }
  
  update(time: number, delta: number): void {
    if (!gameState.get('isPlaying') || gameState.get('isPaused')) return;
    
    const speed = gameState.get('speed');
    const adjustedDelta = delta * speed;
    
    // Update note positions
    this.noteSpawner?.update(time, adjustedDelta);
    
    // Check for missed notes
    this.checkMissedNotes(time);
    
    // Update streak/multiplier visuals
    this.updateStreakDisplay();
  }
  
  shutdown(): void {
    // CRITICAL: Clean up all listeners and timers
    eventBus.off(Events.NOTE_PLAYED, this.handleNotePlayed);
    eventBus.off(Events.GAME_PAUSE, this.handlePause);
    eventBus.off(Events.GAME_RESUME, this.handleResume);
    
    this.noteSpawner?.destroy();
    this.scorer = null;
    this.particleManager?.destroy();
    this.keyboard?.destroy();
  }
  
  // ... rest of methods
}
```

---

## 10. Game Objects

### 10.1 FallingNote

```typescript
// src/phaser/objects/FallingNote.ts
export class FallingNote extends Phaser.GameObjects.Rectangle {
  public readonly noteData: GameReadyNote;
  private glow: Phaser.GameObjects.Image;
  private fingeringText: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene, noteData: GameReadyNote) {
    const color = noteData.hand === 'left' ? NOTE.LEFT_HAND_COLOR : NOTE.RIGHT_HAND_COLOR;
    
    super(scene, 0, 0, NOTE.WIDTH, NOTE.HEIGHT, color);
    this.noteData = noteData;
    
    // Create glow effect
    this.glow = scene.add.image(0, 0, 'glow')
      .setTint(color)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);
    
    // Create fingering text
    if (noteData.finger) {
      this.fingeringText = scene.add.text(0, 0, String(noteData.finger), {
        fontSize: '12px',
        color: '#ffffff',
      }).setOrigin(0.5);
    }
    
    scene.add.existing(this);
  }
  
  showHitFeedback(grade: 'perfect' | 'good' | 'ok'): void {
    const color = FEEDBACK.COLORS[grade];
    this.setFillStyle(color);
    this.glow.setAlpha(1);
    
    // Emit particle burst
    eventBus.emit(Events.SPECTACLE_HIT, { 
      x: this.x, 
      y: this.y, 
      color 
    });
    
    // Animate out
    this.scene.tweens.add({
      targets: [this, this.glow],
      alpha: 0,
      scale: 1.2,
      duration: 300,
      onComplete: () => this.destroy(),
    });
  }
  
  showMissFeedback(): void {
    this.setFillStyle(FEEDBACK.COLORS.miss);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => this.destroy(),
    });
  }
}
```

---

## 11. Performance Considerations

### 11.1 Object Pooling

```typescript
// Reuse note objects instead of creating/destroying
const notePool = new Phaser.GameObjects.Group(scene, {
  classType: FallingNote,
  maxSize: 100,
  runChildUpdate: true,
});

function spawnNote(noteData: GameReadyNote): FallingNote {
  let note = notePool.getFirstDead() as FallingNote;
  
  if (!note) {
    note = new FallingNote(scene, noteData);
    notePool.add(note);
  } else {
    note.reset(noteData);
  }
  
  note.setActive(true).setVisible(true);
  return note;
}
```

### 11.2 Mobile Optimizations

```typescript
const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (isMobile) {
  // Reduce particle count
  FEEDBACK.PARTICLES.HIT_BURST_COUNT = 5;
  
  // Lower render resolution
  config.resolution = window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio;
}
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

- GameState reset behavior
- XP calculation and level thresholds
- Timing window calculations
- MIDI parsing

### 12.2 Integration Tests

- Full game flow: start → play → end → results
- Input → hit detection → scoring pipeline
- Profile creation → song play → XP earned

### 12.3 Pre-Ship Checklist

- [ ] Core loop works (start, play, score, end)
- [ ] Restart works cleanly 3x
- [ ] Touch + keyboard input functional
- [ ] Responsive canvas (FIT + CENTER_BOTH)
- [ ] All values in Constants.ts
- [ ] EventBus for all communication
- [ ] Scene cleanup in shutdown()
- [ ] Object pooling for notes
- [ ] Delta-based movement
- [ ] Build passes (`npm run build`)
- [ ] No console errors

---

## 13. Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x",
    "phaser": "^3.70.0",
    "@tonejs/midi": "^2.x",
    "pitchy": "^4.x",
    "idb": "^7.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x"
  }
}
```

---

## 14. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-23 | AI | Initial architecture draft |

---

*Architecture follows game-creator conventions from Phaser skill and game-architecture patterns.*
