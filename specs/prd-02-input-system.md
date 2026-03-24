# PRD 2: Input System Architecture

**Version:** 1.0  
**Author:** PianoVibe Team  
**Status:** Draft  
**Parent Spec:** `pianovibe.md`  
**Dependencies:** PRD 1: Core Game Engine  

---

## 1. Overview

This PRD defines PianoVibe's input system — how the app detects what notes the user plays. The input system abstracts all three input methods behind a single common interface, so the game engine remains agnostic to whether input comes from a microphone, touch keyboard, or MIDI device.

**Input Methods by Version:**

| Method | Version | Priority |
|--------|---------|----------|
| Microphone | v1 | Primary |
| On-screen Touch Keyboard | v1 | Fallback |
| Web MIDI | v1.5 | Optional |

**Design Principles:**
- Game engine never directly handles mic/MIDI/touch — it receives normalized "note events"
- All timing is based on `performance.now()` for consistency
- Input system handles audio processing, pitch detection, and debouncing

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     INPUT SYSTEM ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│   │  Mic Input  │  │ Touch Input │  │  MIDI Input │ (v1.5)      │
│   │   Module    │  │   Module    │  │   Module    │             │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│          │                │                │                    │
│          └────────────────┼────────────────┘                    │
│                           ↓                                     │
│                  ┌────────────────┐                             │
│                  │  Input Bridge  │                             │
│                  │ (Normalization)│                             │
│                  └────────┬───────┘                             │
│                           ↓                                     │
│   ┌──────────────────────────────────────────────────┐          │
│   │              INPUT EVENT BUS                      │          │
│   │  { type: 'noteOn'|'noteOff', pitch, velocity,    │          │
│   │    timestamp, source: 'mic'|'touch'|'midi' }     │          │
│   └──────────────────────────────────────────────────┘          │
│                           │                                     │
│                           ↓                                     │
│                  ┌────────────────┐                             │
│                  │   Game Engine  │                            │
│                  │   (Phaser)      │                            │
│                  └────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 InputEvent Interface

All input modules emit a normalized event:

```typescript
interface InputEvent {
  type: 'noteOn' | 'noteOff';
  pitch: string;        // e.g., 'C4', 'F#5' (scientific pitch notation)
  midiNote: number;     // 0-127 (MIDI note number for easy comparison)
  velocity: number;      // 0-127 (loudness)
  timestamp: number;    // performance.now() value at detection
  source: 'mic' | 'touch' | 'midi';
  confidence?: number;  // For mic input only: pitch detection confidence 0-1
}
```

---

## 3. Microphone Input (v1 — Primary)

### 3.1 Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Audio capture | Web Audio API (`getUserMedia`) | Browser standard, low latency |
| Pitch detection | **Pitchy** | Lightweight, browser-compatible, good for piano |
| Fallback option | ml5.js | Available if Pitchy insufficient |
| Future option | Aubio WASM | Highest accuracy, compiled C library |

**Pitchy Configuration:**
```javascript
{
  sampleRate: 44100,
  bufferSize: 2048,
  // Frequency range: 27.5 Hz (A0) to 4186 Hz (C8)
  minFrequency: 27.5,
  maxFrequency: 4186
}
```

### 3.2 Pitch Detection Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                  MICROPHONE INPUT PIPELINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. getUserMedia({ audio: true })                              │
│                    ↓                                            │
│  2. AudioContext.createMediaStreamSource()                      │
│                    ↓                                            │
│  3. AnalyserNode (FFT for frequency data)                       │
│                    ↓                                            │
│  4. Pitchy: detectPitch() called every frame (~60Hz)           │
│                    ↓                                            │
│  5. Frequency → MIDI note conversion                            │
│                    ↓                                            │
│  6. Debounce / noise gate                                       │
│                    ↓                                            │
│  7. Emit InputEvent to event bus                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Frequency to Note Conversion

```javascript
function frequencyToMidi(frequency) {
  // A4 = 440 Hz = MIDI note 69
  const midiNote = 12 * Math.log2(frequency / 440) + 69;
  return Math.round(midiNote);
}

function midiToPitch(midiNote) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return `${noteName}${octave}`;
}
```

### 3.4 Debouncing & Noise Gate

To prevent false triggers:

| Issue | Solution |
|-------|----------|
| Same note detected multiple times | Debounce: ignore same pitch if detected within 50ms |
| Background noise triggering | Noise gate: require confidence > 0.8 |
| Harmonics / overtones | Filter: ignore frequencies outside piano range |
| User holds note too long | NoteOff only when amplitude drops below threshold |

**Debounce Logic:**
```javascript
const lastNoteTime = {}; // pitch -> timestamp

function debounce(pitch, timestamp) {
  const minInterval = 50; // ms
  if (lastNoteTime[pitch] && timestamp - lastNoteTime[pitch] < minInterval) {
    return false; // Ignore
  }
  lastNoteTime[pitch] = timestamp;
  return true;
}
```

### 3.5 Latency Compensation

Observed latency: ~20-50ms (browser + pitch detection)

**Compensation Strategy:**
- Record `performance.now()` at detection time
- The game engine compares this timestamp to expected note time
- No artificial adjustment needed — timing windows already account for this

**Calibration (future enhancement):**
- Play a known reference tone, measure detection delay
- Store per-device calibration offset
- Not required for v1

### 3.6 Error Handling

| Scenario | Handling |
|----------|----------|
| Mic permission denied | Prompt user, offer touch keyboard fallback |
| Mic disconnected mid-game | Pause game, show "Microphone disconnected" message |
| No audio input detected | Show hint after 5s: "Having trouble? Check your microphone" |
| Multiple simultaneous pitches | Handle up to 4 simultaneous pitches (chords) |

---

## 4. On-Screen Touch Keyboard (v1 — Fallback)

### 4.1 Design

**Visual Style:**
- Piano keys rendered in Phaser canvas (matching game theme)
- White keys: `#F5F5F5` with subtle gradient
- Black keys: `#1A1A2E` with subtle gradient
- Active state: key depresses (height reduces 2px), slight darkening
- Key pressed: soft glow matching hand color

**Layout:**
- Spans bottom ~15% of canvas
- Auto-zooms to show the note range needed for current song
- Minimum: 2 octaves visible
- Maximum: 4 octaves visible
- Scrolls/pans to follow song range

### 4.2 Key Range Display

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOUCH KEYBOARD DISPLAY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Song active range: C3 to G5                                    │
│                                                                 │
│  Default view: C3 to B5 (3 octaves)                             │
│                                                                 │
│  If song uses notes outside default view:                       │
│    - Zoom out to include all notes                             │
│    - Maximum zoom out: A0 to C8 (full 88 keys)                 │
│                                                                 │
│  User can manually scroll/pinch to adjust visible range        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Multi-Touch Support

- **Yes**: Full multi-touch chord support
- Detect up to 10 simultaneous touches (5 fingers per hand realistically)
- Each touch maps to exactly one key
- Touch identifiers tracked independently

**Implementation:**
```javascript
// Track active touches
const activeTouches = new Map();

// On touchstart
activeTouches.set(touch.identifier, getKeyAtPosition(touch.clientX, touch.clientY));

// On touchend
activeTouches.delete(touch.identifier);
```

### 4.4 Key Hit Feedback

When a key is touched:
1. Key visually depresses (transform: translateY(2px))
2. Key darkens slightly (overlay color)
3. Soft glow effect
4. Emit InputEvent with velocity based on touch pressure (if supported)

### 4.5 Touch vs. Mic Priority

When both mic and touch input are available:
- **Mic is primary** — touch is only used when mic is unavailable or disabled
- User can manually switch to touch in settings
- Touch mode indicator shown in UI when active

---

## 5. Web MIDI Input (v1.5 — Documented for Future)

### 5.1 Technology

**Web MIDI API:**
- Chrome/Edge support
- Requires HTTPS (or localhost)
- No external libraries needed

### 5.2 Integration Points

```javascript
navigator.requestMIDIAccess()
  .then(midiAccess => {
    for (let input of midiAccess.inputs.values()) {
      input.onmidimessage = handleMIDIMessage;
    }
  });

function handleMIDIMessage(event) {
  const [status, note, velocity] = event.data;
  const command = status >> 4; // 8=noteOn, 9=noteOff
  
  if (command === 9 && velocity > 0) {
    emitEvent('noteOn', note, velocity);
  } else if (command === 8 || (command === 9 && velocity === 0)) {
    emitEvent('noteOff', note, 0);
  }
}
```

### 5.3 MIDI Advantages

| Benefit | Impact |
|---------|--------|
| Exact note-on/note-off | No pitch detection ambiguity |
| Zero latency | Instant response |
| Velocity sensitivity | Natural dynamics |
| Multiple channels | Support for different hands/tracks |

### 5.4 MIDI Configuration (v1.5)

- Auto-detect connected MIDI devices
- Allow user to select specific device
- MIDI input channel selection (or accept all channels)
- Velocity curve adjustment (linear/exponential)

---

## 6. Common Input Bridge

### 6.1 Event Normalization

All input sources emit via the same bridge:

```typescript
class InputBridge extends EventEmitter {
  
  // Register an input source
  registerSource(source: 'mic' | 'touch' | 'midi', handler: (event: InputEvent) => void) {
    this.handlers[source] = handler;
  }
  
  // Emit normalized event
  emitNoteOn(pitch: string, velocity: number, source: 'mic' | 'touch' | 'midi') {
    const event: InputEvent = {
      type: 'noteOn',
      pitch,
      midiNote: pitchToMidi(pitch),
      velocity,
      timestamp: performance.now(),
      source,
      confidence: source === 'mic' ? this.lastConfidence : undefined
    };
    this.emit('noteOn', event);
  }
  
  emitNoteOff(pitch: string, source: 'mic' | 'touch' | 'midi') {
    const event: InputEvent = {
      type: 'noteOff',
      pitch,
      midiNote: pitchToMidi(pitch),
      velocity: 0,
      timestamp: performance.now(),
      source
    };
    this.emit('noteOff', event);
  }
}
```

### 6.2 Game Engine Interface

The game engine subscribes to the InputBridge:

```typescript
// In GameScene.ts
this.inputBridge.on('noteOn', (event: InputEvent) => {
  this.evaluateNote(event.pitch, event.timestamp);
});

this.inputBridge.on('noteOff', (event: InputEvent) => {
  this.releaseNote(event.pitch);
});
```

---

## 7. Permission & Setup Flow

### 7.1 First Launch / First Mic Use

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIC PERMISSION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User selects song, taps "Play"                                 │
│                    ↓                                            │
│  ┌─────────────────────────────────────┐                        │
│  │  "To play with your piano, we need   │                        │
│  │   access to your microphone."        │                        │
│  │                                     │                        │
│  │   [ Allow Mic Access ]              │                        │
│  │   [ Use Touch Keyboard Instead ]     │                        │
│  └─────────────────────────────────────┘                        │
│                    ↓                                            │
│  ┌───────────────────┐                                          │
│  │ Browser Permission │                                          │
│  │    Prompt          │                                          │
│  └───────────────────┘                                          │
│         ↓                    ↓                                  │
│    [ Granted ]           [ Denied ]                             │
│         ↓                    ↓                                  │
│  ┌────────────┐       ┌────────────────┐                        │
│  │ Start Calib│       │ Fall back to    │                        │
│  │ (1 second) │       │ Touch Keyboard  │                        │
│  └────────────┘       └────────────────┘                        │
│         ↓                                                          │
│  ┌────────────────────────────────────┐                          │
│  │  Brief audio level indicator        │                          │
│  │  "You're all set! Tap Play to begin"│                          │
│  └────────────────────────────────────┘                          │
│                    ↓                                             │
│              Game Starts                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Permission States

| State | Behavior |
|-------|----------|
| `unknown` | Show permission prompt on first play attempt |
| `granted` | Mic input active, show mic indicator |
| `denied` | Fall back to touch keyboard, show "Mic unavailable" badge |
| `unavailable` | Touch keyboard only, show "No microphone detected" message |

### 7.3 User Preferences (per profile)

```javascript
{
  inputMode: 'mic' | 'touch' | 'midi',  // Preferred input
  micEnabled: boolean,
  touchEnabled: boolean,
  midiEnabled: boolean,  // v1.5
  selectedMidiDevice: string | null   // v1.5
}
```

---

## 8. Audio Processing Configuration

### 8.1 Web Audio Setup

```javascript
const audioContext = new AudioContext({ 
  sampleRate: 44100,
  latencyHint: 'interactive' // Prioritize low latency
});

// Mic source
const micStream = await navigator.mediaDevices.getUserMedia({ 
  audio: {
    echoCancellation: false,   // Disable for music
    noiseSuppression: false,  // Disable for music
    autoGainControl: false   // Disable for consistent detection
  }
});

const micSource = audioContext.createMediaStreamSource(micStream);

// FFT for pitch detection
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
micSource.connect(analyser);
```

**Why echo/noise/AGC disabled:**
- Piano notes may look like "noise" to these algorithms
- Better to let Pitchy handle pitch detection cleanly

### 8.2 Buffer Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Sample rate | 44100 Hz | CD quality, standard |
| Buffer size | 2048 samples | ~46ms per buffer, good frequency resolution |
| FFT size | 2048 | Matches buffer |
| Update rate | ~60 Hz | One detection per frame |

---

## 9. Error Handling

### 9.1 Runtime Errors

| Error | Handling |
|-------|----------|
| Mic permission revoked mid-game | Pause, show "Mic access revoked" modal, offer touch fallback |
| Mic disconnected | Pause, show reconnect option |
| Browser doesn't support getUserMedia | Show "Browser not supported" message |
| Audio context suspended | Resume on user interaction (browser autoplay policy) |
| Pitch detection fails | Silently ignore frame, try again next frame |

### 9.2 Debug Tools

For development and debugging:

```javascript
// Debug overlay showing:
// - Current detected pitch
// - Pitch confidence
// - Latency estimate
// - Input source (mic/touch/midi)
// - Active touches count

// Keyboard shortcut: Alt+D to toggle debug overlay
```

---

## 10. Performance Considerations

| Concern | Mitigation |
|---------|------------|
| CPU load from pitch detection | Pitchy is efficient; offload to Web Worker if needed |
| Memory from audio buffers | Fixed buffer size, no accumulation |
| Touch response time | Direct DOM/Canvas event, minimal processing |
| Multiple chords | Process all touches each frame, no artificial limit |

### 10.1 Optimization Targets

| Metric | Target |
|--------|--------|
| Pitch detection latency | <50ms |
| Touch-to-visual latency | <16ms (one frame) |
| CPU usage (mic mode) | <30% on mid-range mobile |
| Memory overhead | <50MB for audio buffers |

---

## 11. Testing Checklist

### Microphone Input
- [ ] Detects single notes accurately
- [ ] Handles chord detection (2-4 simultaneous notes)
- [ ] Debounce prevents double-triggering
- [ ] Noise gate filters background sound
- [ ] Works with acoustic piano
- [ ] Works with digital piano (may have overtones)
- [ ] Graceful handling when mic permission denied
- [ ] Graceful handling when mic disconnected mid-game

### Touch Keyboard
- [ ] All visible keys respond to touch
- [ ] Multi-touch chords work (5+ simultaneous touches)
- [ ] Keys outside visible range not accessible (correct clamping)
- [ ] Touch feedback (visual depression) works
- [ ] Rapid key taps register correctly
- [ ] Touch works alongside mic (when both available)

### Web MIDI (v1.5 prep)
- [ ] Detects connected MIDI devices
- [ ] Receives noteOn/noteOff correctly
- [ ] Handles multiple MIDI devices
- [ ] Works with various MIDI controllers

### Integration
- [ ] InputBridge correctly routes events from all sources
- [ ] Game engine receives normalized events
- [ ] Timestamp accuracy consistent across sources
- [ ] No duplicate events (debounce works)

---

## 12. Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| pitchy | Pitch detection | Latest |
| Web Audio API | Audio capture (browser native) | — |
| Web MIDI API | MIDI input (browser native) | — |
| Phaser 3 | Input handling (touch) | 3.x |

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-23 | AI | Initial draft |

---

**Next PRD:** [PRD 3: Song Library & Data Management](./prd-03-song-library.md)
