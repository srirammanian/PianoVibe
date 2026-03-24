# PRD 3: Song Library & Data Management

**Version:** 1.0  
**Author:** PianoVibe Team  
**Status:** Draft  
**Parent Spec:** `pianovibe.md`  
**Dependencies:** PRD 1: Core Game Engine, PRD 2: Input System  

---

## 1. Overview

This PRD defines how PianoVibe manages songs — MIDI parsing, bundled song library, user import, track selection, and the data structures used throughout the app.

**Design Decisions Summary:**
- MIDI files as the core song format
- JSON files for metadata and fingering annotations
- IndexedDB for persistent storage (bundled + imported songs)
- @tonejs/midi for parsing
- Classical piano songs from public/open sources
- No public domain pop songs available — classical/folk focus, user import for pop

---

## 2. Song Sources

### 2.1 Available Sources

| Source | Songs Available | License | Fingering | Notes |
|--------|-----------------|---------|-----------|-------|
| **ClassicalPianoMIDI dataset** (GitHub) | 337 classical pieces | MIT (code) | None | Best comprehensive source |
| **piano-midi.de** | ~1000+ classical | Non-commercial implied | None | Most popular source |
| **Mutopia Project** | ~50 piano pieces | True public domain | None | Smaller collection |
| **User Import** | Any MIDI | User responsibility | None (v1) | Drag-and-drop |

### 2.2 Recommended Bundled Songs (v1)

Based on research, here are beginner-appropriate songs:

#### Absolute Beginner (Tier 1)
| Title | Composer | Difficulty | Notes |
|-------|----------|-----------|-------|
| Für Elise (Theme) | Beethoven | Easy | Iconic, recognizable |
| Prelude in C Major | J.S. Bach | Easy | BWV 846, well-known |
| Arabesque No. 1 (Theme) | Debussy | Easy | Beautiful, accessible |
| Gymnopédie No. 1 | Satie | Easy | Minimalist, charming |
| Burgmüller Etude Op.109 No.1 | Burgmüller | Easy | Designed for beginners |

#### Early Beginner (Tier 2)
| Title | Composer | Difficulty | Notes |
|-------|----------|-----------|-------|
| Moonlight Sonata (1st Mov.) | Beethoven | Medium-Easy | Famous, moderate complexity |
| Nocturne Op.9 No.2 | Chopin | Medium-Easy | Romantic, recognizable |
| The Seasons - "June" | Tchaikovsky | Medium-Easy | Pleasant, piano-native |
| Claire de Lune (Theme) | Debussy | Medium-Easy | Iconic, simplify if needed |

#### Intermediate (Tier 3 — unlock at Level 5)
| Title | Composer | Difficulty | Notes |
|-------|----------|-----------|-------|
| Fantaisie-Impromptu | Chopin | Medium | Challenging passages |
| Chopin Waltz in A Minor | Chopin | Medium | Requires hand independence |

### 2.3 On Contemporary Pop

**Finding:** No viable public domain pop MIDI files exist. Contemporary pop is almost never public domain due to copyright.

**Options:**
1. **Focus on classical/folk** — vast repertoire, timeless, educational
2. **User import** — users import their own pop MIDI files (no fingering in v1)
3. **Future: Audio-to-MIDI conversion** — convert audio recordings to MIDI (v2)
4. **Future: Licensed song store** — partner with publishers (out of scope)

**Decision:** v1 ships with classical/folk songs. User import enables pop. v2 may add licensed catalog.

---

## 3. File Structure

### 3.1 Bundled Song Format

Each bundled song is a folder with standardized files:

```
public/
  songs/
    fur-elise/
      ├── midi.mid
      ├── metadata.json
      ├── fingering.json      (v1: bundled only)
      └── thumbnail.webp      (optional: album art or sheet snippet)
    
    prelude-in-c-major/
      ├── midi.mid
      ├── metadata.json
      ├── fingering.json
      └── thumbnail.webp
```

### 3.2 Metadata Schema

```typescript
interface SongMetadata {
  id: string;                    // URL-safe slug: 'fur-elise'
  title: string;                 // 'Für Elise'
  titleSortable: string;        // 'Fur Elise' (for sorting)
  composer: string;             // 'Ludwig van Beethoven'
  year?: number;                 // 1791 (optional)
  
  // Difficulty & Tier
  difficulty: 1 | 2 | 3 | 4 | 5; // 1=easiest, 5=hardest
  tier: 1 | 2 | 3;              // Unlocked at player levels 1, 3, 5
  unlockedByDefault: boolean;    // Tier 1 songs always available
  
  // Song Properties
  durationSeconds: number;       // Total song length
  timeSignature: string;         // '4/4', '3/4', '6/8'
  bpm?: number;                  // Original tempo (for display)
  
  // Technical
  source: string;                // 'ClassicalPianoMIDI', 'piano-midi.de', etc.
  sourceUrl?: string;           // Link to original
  license?: string;             // 'CC0', 'Non-commercial', etc.
  
  // Display
  tags: string[];               // ['classical', 'beginner', 'iconic']
  description?: string;         // Brief description for player
  
  // Fingering availability
  hasFingering: boolean;        // true for bundled, false for imports
}
```

### 3.3 Fingering Schema

```typescript
interface FingeringData {
  songId: string;                // Matches metadata.id
  version: string;              // '1.0' (for future updates)
  
  // Fingering annotations per note
  // Only includes notes that have fingering data
  // Notes without entry use default fingering algorithm
  notes: Array<{
    time: number;                // Time in seconds
    note: string;               // 'C4', 'F#5' (scientific pitch)
    finger: 1 | 2 | 3 | 4 | 5;   // 1=thumb, 5=pinky
    hand?: 'left' | 'right';     // Optional: explicit hand assignment
  }>;
}
```

### 3.4 Imported Song Format

User-imported songs have minimal data:

```
IndexedDB: imported_songs/
  <uuid>/
    ├── midi.mid               (stored as Blob)
    ├── metadata.json          (auto-generated minimal metadata)
    └── fingering.json         (NOT present in v1)
```

**Auto-generated metadata for imports:**
```typescript
{
  id: generateUUID(),
  title: filename without extension,
  composer: 'Unknown',
  difficulty: auto-detect or user-assigned (1-5),
  tier: 1,                      // Imported songs unlocked immediately
  hasFingering: false,
  source: 'user-import'
}
```

---

## 4. MIDI Parsing

### 4.1 Technology: @tonejs/midi

**Library:** [@tonejs/midi](https://github.com/Tonejs/midi)  
**Purpose:** Parse MIDI files into structured JavaScript objects  
**Size:** ~50KB gzipped  
**API Example:**

```javascript
import Midi from '@tonejs/midi';

const midi = new Midi(midiFileBuffer);

// Access parsed data:
midi.name;                      // Song name from MIDI
midi.tracks;                    // Array of tracks
midi.tracks[0].notes;          // Notes in track 0
midi.tracks[0].notes[0];       // First note
// {
//   name: 'C4',
//   midi: 60,
//   time: 0.5,                 // Time in seconds
//   duration: 0.8,             // Note length
//   velocity: 0.8              // 0-1
// }

// Program changes (for piano track detection):
midi.tracks[0].controlChanges; // CC messages
midi.tracks[0].programChanges; // Program numbers
```

### 4.2 Parsed Note Structure

After MIDI parsing, notes are normalized to:

```typescript
interface ParsedNote {
  id: string;                   // UUID for tracking
  pitch: string;                // 'C4', 'F#5'
  midiNote: number;             // 0-127
  time: number;                 // Seconds from start
  duration: number;             // Seconds
  velocity: number;             // 0-1
  trackIndex: number;           // Which MIDI track
  channel: number;             // MIDI channel (0-15)
  hand?: 'left' | 'right';     // Assigned based on track/channel
  finger?: 1 | 2 | 3 | 4 | 5;   // From fingering data if available
}
```

### 4.3 Piano Track Detection

**Algorithm:**
```javascript
function detectPianoTracks(midi) {
  const pianoTracks = [];
  
  for (let i = 0; i < midi.tracks.length; i++) {
    const track = midi.tracks[i];
    
    // Check 1: Program change (General MIDI Piano = programs 0-7)
    // 0 = Acoustic Grand Piano
    // 1 = Bright Acoustic Piano
    // 2 = Electric Grand Piano
    // ... up to 7 = Harpsichord
    const programChanges = track.programChanges;
    if (programChanges.length > 0) {
      const program = programChanges[0].value;
      if (program >= 0 && program <= 7) {
        pianoTracks.push({ index: i, confidence: 'high' });
        continue;
      }
    }
    
    // Check 2: Note range (piano typically C1-C7)
    const notes = track.notes;
    if (notes.length > 0) {
      const minNote = Math.min(...notes.map(n => n.midi));
      const maxNote = Math.max(...notes.map(n => n.midi));
      
      // If range fits within piano (roughly A0=21 to C8=108)
      if (minNote >= 21 && maxNote <= 108) {
        pianoTracks.push({ index: i, confidence: 'medium' });
      }
    }
  }
  
  return pianoTracks;
}
```

### 4.4 Hand Assignment

**Logic:**
1. If MIDI has multiple tracks → each track is a separate hand
2. If single track with many notes:
   - Notes below middle C (C4, MIDI 60) → Left hand
   - Notes at or above middle C → Right hand
3. User can override via track selector

**Middle C Rule:**
```javascript
const MIDDLE_C = 60; // MIDI note number for C4

function assignHand(note, mode = 'auto') {
  if (mode === 'left-only') return 'left';
  if (mode === 'right-only') return 'right';
  
  // Auto: split at middle C
  return note.midiNote < MIDDLE_C ? 'left' : 'right';
}
```

---

## 5. User Import

### 5.1 Import Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIDI IMPORT FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks "Import Song" button                               │
│                    ↓                                            │
│  ┌─────────────────────────────────────┐                        │
│  │  Drag-and-drop zone appears         │                        │
│  │  (or file picker button)            │                        │
│  │                                       │                        │
│  │  Drop .mid or .midi file here        │                        │
│  └─────────────────────────────────────┘                        │
│                    ↓                                            │
│  File validation:                                               │
│  - Is it a valid MIDI file?                                     │
│  - Size < 5MB?                                                  │
│                    ↓                                            │
│           ┌───────┴───────┐                                     │
│           ↓               ↓                                       │
│      [ Valid ]       [ Invalid ]                                │
│           ↓               ↓                                       │
│  ┌────────────┐    ┌────────────────┐                          │
│  │ Parse MIDI │    │ Show error:     │                          │
│  │ Extract    │    │ "Invalid file" │                          │
│  │ metadata   │    │ or "Too large"  │                          │
│  └────────────┘    └────────────────┘                            │
│           ↓                                                     │
│  ┌─────────────────────────────────────┐                        │
│  │  Success: "Song imported!"          │                        │
│  │  User can edit title/difficulty     │                        │
│  │  Song appears in "My Songs" tab      │                        │
│  └─────────────────────────────────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Validation Rules

| Rule | Limit | Error Message |
|------|-------|---------------|
| File format | .mid, .midi | "Please drop a MIDI file (.mid or .midi)" |
| File size | < 5MB | "File is too large. Maximum size is 5MB." |
| Valid MIDI | Parsable | "Could not read this MIDI file. It may be corrupted." |
| Notes present | ≥ 5 notes | "This MIDI file has no playable notes." |
| No duplicate | Same filename | "This song is already imported." |

### 5.3 Imported Song Limits

**No hard limit** on number of imported songs per profile. IndexedDB storage limit is typically 50MB+ per origin, which can hold hundreds of MIDI files.

---

## 6. Track Selector UI

### 6.1 When It Appears

Track selector appears when:
- A MIDI file has **more than one track** after piano detection
- User taps "Change Tracks" option in song setup screen

### 6.2 Track Selector Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TRACK SELECTOR                                    [ X Close ]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Found 3 tracks in this song:                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [✓] Track 1: Right Hand — Piano (Acoustic Grand)        │    │
│  │     Notes: 234 | Range: C3 - C6                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [ ] Track 2: Left Hand — Piano (Acoustic Grand)         │    │
│  │     Notes: 198 | Range: C2 - B3                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [ ] Track 3: Pedal — Organ                               │    │
│  │     Notes: 45 | Range: C3 - G3                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Auto-selected piano tracks. Tap to toggle.                     │
│  At least one track must be selected.                           │
│                                                                 │
│  [ ] Auto-select all piano tracks                               │
│                                                                 │
│                           [ Done ]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Track Info Displayed

| Info | Source |
|------|--------|
| Track number | MIDI track index |
| Suggested name | Program name from MIDI + heuristics |
| Instrument | From program change message |
| Note count | Number of notes in track |
| Note range | Lowest to highest note |

### 6.4 Persistence

Track selection is **per-song, per-profile**:
```javascript
{
  profileId: 'abc123',
  songId: 'fur-elise',
  selectedTracks: [0, 1],        // Track indices
  handMode: 'both' | 'left' | 'right',
  // Saved and restored when song is replayed
}
```

---

## 7. IndexedDB Schema

### 7.1 Database Structure

```
Database: PianoVibeDB

Object Stores:
  ├── profiles        (keyPath: id)
  ├── songs_metadata  (keyPath: id)
  ├── songs_data      (keyPath: id)  // Parsed MIDI + normalized notes
  ├── imported_songs  (keyPath: id) // User imports
  └── settings        (keyPath: key)
```

### 7.2 Schema Definitions

```typescript
// profiles store
interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  updatedAt: number;
}

// songs_metadata store (bundled songs)
interface SongMetadataDB {
  id: string;
  title: string;
  composer: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tier: 1 | 2 | 3;
  durationSeconds: number;
  hasFingering: boolean;
  tags: string[];
}

// songs_data store (normalized note data)
interface SongDataDB {
  id: string;
  notes: ParsedNote[];
  tracks: TrackInfo[];
  timeSignature: string;
  bpm: number;
}

// imported_songs store
interface ImportedSongDB {
  id: string;
  profileId: string;
  title: string;
  midiBlob: Blob;
  metadata: SongMetadataDB;
  data: SongDataDB;
  importedAt: number;
}
```

### 7.3 Storage Manager

```typescript
class SongStorageManager {
  
  // Bundled songs (read from bundled JSON)
  async getBundledSong(id: string): Promise<SongDataDB> { }
  async getBundledMetadata(): Promise<SongMetadataDB[]> { }
  
  // Imported songs (IndexedDB)
  async importSong(profileId: string, midiBlob: Blob): Promise<string> { }
  async getImportedSongs(profileId: string): Promise<ImportedSongDB[]> { }
  async deleteImportedSong(profileId: string, songId: string): Promise<void> { }
  
  // Combined query
  async getSongsForProfile(profileId: string): Promise<SongMetadataDB[]> {
    const bundled = await this.getBundledMetadata();
    const imported = await this.getImportedSongs(profileId);
    return [...bundled, ...imported.map(i => i.metadata)];
  }
}
```

---

## 8. Song Loading Pipeline

### 8.1 Load Sequence

```
User selects song
        ↓
┌─────────────────────────────────────────────────────┐
│ 1. Load metadata from IndexedDB / bundled JSON      │
│ 2. Check if fingering exists → load fingering.json │
│ 3. Parse MIDI file (or retrieve from cache)         │
│ 4. Detect piano tracks                              │
│ 5. Normalize notes with metadata                    │
│ 6. Apply fingering (if available)                   │
│ 7. Apply hand assignment                            │
│ 8. Pre-calculate fall times, spawn times            │
│ 9. Pass to GameEngine                               │
└─────────────────────────────────────────────────────┘
```

### 8.2 Pre-calculated Game Data

```typescript
interface GameSongData {
  metadata: SongMetadata;
  notes: GameReadyNote[];
  tracks: TrackInfo[];
  totalDuration: number;
  timeSignature: string;
  bpm: number;
}

interface GameReadyNote {
  id: string;
  pitch: string;
  midiNote: number;
  spawnTime: number;      // When to spawn on screen
  targetTime: number;     // When it should be played
  duration: number;
  velocity: number;
  trackIndex: number;
  hand: 'left' | 'right';
  finger?: 1 | 2 | 3 | 4 | 5;
  color: string;           // Pre-resolved based on hand
}

// Pre-calculate fall duration based on canvas height and BPM
const FALL_DURATION = 2.5; // seconds (from spawn to play line)
```

---

## 9. Difficulty Classification

### 9.1 Automatic Detection

For imported songs (without fingering), auto-classify difficulty:

```javascript
function estimateDifficulty(notes: ParsedNote[]): 1 | 2 | 3 | 4 | 5 {
  const stats = {
    noteCount: notes.length,
    avgNoteDensity: calculateNoteDensity(notes),
    maxSimultaneousNotes: countChords(notes),
    handSpan: calculateHandSpan(notes),
    fastPassages: countFastPassages(notes),
  };
  
  // Simple heuristics
  let score = 0;
  
  if (stats.noteCount > 500) score += 2;
  else if (stats.noteCount > 200) score += 1;
  
  if (stats.maxSimultaneousNotes >= 4) score += 2;
  else if (stats.maxSimultaneousNotes >= 2) score += 1;
  
  if (stats.fastPassages > 10) score += 1;
  
  // Map score to difficulty
  return Math.min(5, Math.max(1, score));
}
```

### 9.2 Difficulty Factors

| Factor | Easy (1) | Hard (5) |
|--------|----------|----------|
| Note count | <100 | >500 |
| Simultaneous notes | 1 | 4+ |
| Fast passages | None | Many |
| Hand span required | < octave | > octave |
| Complex rhythms | Simple | Syncopated |

---

## 10. Future Enhancements (v1.5 / v2)

### 10.1 Algorithmic Fingering (v2)

Use **PianoPlayer** (github.com/marcomusy/pianoplayer) or similar to generate fingering for imported MIDIs:

```javascript
// Future: generate fingering on import
async function generateFingering(midiData): Promise<FingeringData> {
  // Use ML model or algorithmic approach
  const fingerings = await pianoPlayer.infer(midiData);
  return { notes: fingerings };
}
```

### 10.2 Audio-to-MIDI (v2)

Convert audio recordings to MIDI:
- Use pitch detection on audio file
- Align to beat grid
- Generate playable MIDI

### 10.3 Community Sharing (v2)

- Users upload fingering annotations for popular imported songs
- Community-verified difficulty ratings
- Song request system

---

## 11. Testing Checklist

### Bundled Songs
- [ ] All bundled songs parse correctly
- [ ] Metadata displays correctly in library
- [ ] Fingering annotations display on notes
- [ ] Track detection works for multi-track MIDIs
- [ ] Difficulty tiers match intended levels

### User Import
- [ ] Drag-and-drop accepts .mid and .midi files
- [ ] Invalid files show appropriate error
- [ ] Large files (>5MB) are rejected
- [ ] Duplicate detection works
- [ ] Import persists across app restarts
- [ ] Imported songs appear in library
- [ ] Imported songs can be deleted

### Track Selector
- [ ] Correctly identifies piano tracks
- [ ] Track info (notes, range) is accurate
- [ ] Selection persists for replay
- [ ] At least one track required validation works

### Storage
- [ ] IndexedDB stores imported songs correctly
- [ ] Storage manager handles errors gracefully
- [ ] Storage limits respected
- [ ] Cache invalidation works for updated songs

### Performance
- [ ] Song loading < 2 seconds for typical MIDI
- [ ] Large MIDIs (1000+ notes) load without blocking UI
- [ ] Memory usage reasonable for 50+ imported songs

---

## 12. Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| @tonejs/midi | MIDI parsing | Latest |
| idb | IndexedDB wrapper (cleaner API) | Latest |

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-23 | AI | Initial draft |

---

**Next PRD:** [PRD 4: User Profiles & Progression](./prd-04-profiles-progression.md)
