# PRD 4: User Profiles & Progression

**Version:** 1.0  
**Author:** PianoVibe Team  
**Status:** Draft  
**Parent Spec:** `pianovibe.md`  
**Dependencies:** PRD 1: Core Game Engine, PRD 3: Song Library  

---

## 1. Overview

This PRD defines PianoVibe's user profile system and progression mechanics — profile management, XP and leveling, run history, and difficulty tier unlocks.

**Design Decisions Summary:**
- Emoji-based avatar picker
- Exponential XP curve
- Simple 10-level progression
- 3 difficulty tiers with level-based unlocks
- Guest profile for frictionless trial
- Last 10 runs stored in history

---

## 2. Profile System

### 2.1 Profile Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PROFILE SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                                │
│  │   Guest     │  ← Default profile, no signup                  │
│  │   Profile   │  ← All features, but not persistent            │
│  └─────────────┘  ← Data lost on logout/clear                   │
│                                                                 │
│         OR                                                       │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  Profile 1  │     │  Profile 2  │     │  Profile 3  │        │
│  │  (Local)    │     │  (Local)    │     │  (Local)    │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                                                                 │
│  Each profile stores:                                            │
│  - XP, Level, Tier unlocks                                      │
│  - Run history                                                  │
│  - Settings                                                     │
│  - Imported songs                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Profile Data Structure

```typescript
interface Profile {
  id: string;                    // UUID
  name: string;                 // Display name
  avatar: string;               // Emoji character
  isGuest: boolean;             // true = guest profile
  
  // Progression
  xp: number;                   // Current XP
  level: number;                // Current level (1-10)
  unlockedTiers: 1 | 2 | 3[];  // Which tiers are unlocked
  
  // Meta
  createdAt: number;           // Unix timestamp
  lastActiveAt: number;         // Last time profile was used
  totalPlayTime: number;        // Seconds played (sum of all sessions)
  songsPlayed: number;          // Count of completed songs
}
```

### 2.3 Guest Profile

**Behavior:**
- Created automatically on first app launch
- Named "Guest" with a random emoji avatar
- All features work normally
- Data stored locally in IndexedDB
- **No data recovery** if browser data is cleared

**Conversion to Real Profile:**
- User can "upgrade" guest → named profile
- XP, level, history are preserved
- After upgrade, data is persistent (still local-only, no cloud)

### 2.4 Profile Creation

**Emoji Avatar Picker:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE PROFILE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  What's your name?                                               │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ Alex                                                  │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  Choose your avatar:                                            │
│                                                                 │
│     🎹  🎵  🎶  🌟  🎼  🎺  🎸  🥁  🎻  🎹                       │
│     🎹  🎵  🎶  🌟  🎼  🎺  🎸  🥁  🎻  🎹                       │
│     🎹  🎵  🎶  🌟  🎼  🎺  🎸  🥁  🎻  🎹                       │
│                                                                 │
│  (Scrollable grid of ~50 music/emoji options)                   │
│                                                                 │
│                           [ Create Profile ]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Avatar Options:**
| Category | Emojis |
|----------|--------|
| Music | 🎹 🎵 🎶 🎼 🎺 🎸 🎻 🥁 🪗 🪘 |
| Stars | 🌟 ⭐ ✨ 💫 🌠 |
| Achievement | 🏆 🎖 🥇 🎗 |
| Nature | 🌸 🌺 🌻 🌼 🌷 |
| Animals | 🐱 🐶 🐰 🦊 🐻 |
| Misc | 💎 🔮 🎯 🎲 🎭 |

**Constraints:**
- Name: 1-20 characters, alphanumeric + spaces
- Avatar: single emoji, required

### 2.5 Profile Switcher

**On App Launch:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    WELCOME TO PIANOVIBE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Who's playing?                                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  🎹  Guest                                                │    │
│  │       Level 3 · 1,250 XP                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  👤  Alex                                                │    │
│  │       Level 5 · 3,400 XP                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  👤  Sam                                                 │    │
│  │       Level 2 · 850 XP                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  + Add New Profile                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Profile Options (tap and hold / long press):**
- Edit Profile (name, avatar)
- Delete Profile (with confirmation)
- Reset Progress (keep profile, reset XP/level)

---

## 3. Progression System

### 3.1 XP Calculation

**Per-Song XP Formula:**
```javascript
function calculateXP(score, grade, songDifficulty, mode) {
  // Base XP by song difficulty
  const baseXPByDifficulty = {
    1: 30,    // Tier 1 (easiest)
    2: 50,
    3: 75,
    4: 100,
    5: 150   // Tier 3 (hardest)
  };
  
  const baseXP = baseXPByDifficulty[songDifficulty] || 50;
  
  // Grade multiplier (exponential reward for better performance)
  const gradeMultiplier = {
    'S': 2.0,
    'A': 1.5,
    'B': 1.2,
    'C': 1.0,
    'D': 0.5
  };
  
  // Practice mode penalty (no pressure, less reward)
  const modeMultiplier = mode === 'practice' ? 0.3 : 1.0;
  
  // Speed bonus (playing faster = more XP)
  let speedBonus = 1.0;
  if (mode === 'practice' && speed > 100) {
    speedBonus = 1.0 + (speed - 100) * 0.01; // +1% per 1% speed increase
  }
  
  const finalXP = Math.floor(baseXP * gradeMultiplier[grade] * modeMultiplier * speedBonus);
  return Math.max(1, finalXP); // Minimum 1 XP even for D grade
}
```

**Example XP Values:**
| Song Tier | Grade | XP Earned |
|-----------|-------|-----------|
| 1 (Easy) | S | 60 |
| 1 (Easy) | A | 45 |
| 1 (Easy) | D | 15 |
| 3 (Hard) | S | 300 |
| 3 (Hard) | A | 225 |

### 3.2 Level Progression

**Level Thresholds:**
```javascript
const LEVEL_THRESHOLDS = [
  0,      // Level 1 = 0 XP
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2700,   // Level 8
  3800,   // Level 9
  5200    // Level 10 (max)
];
```

**XP to Next Level:**
```javascript
function xpToNextLevel(currentLevel, currentXP) {
  if (currentLevel >= 10) return null; // Max level
  return LEVEL_THRESHOLDS[currentLevel] - currentXP;
}
```

**Leveling Up:**
- XP accumulates across songs
- Level up triggers celebration animation
- Each level unlocks access to higher tiers

### 3.3 Tier Unlocks

| Tier | Level Required | Songs Included |
|------|----------------|----------------|
| **Tier 1** | Level 1 (default) | ~5 beginner songs |
| **Tier 2** | Level 3 | ~5 early intermediate songs |
| **Tier 3** | Level 5 | ~5 intermediate songs |

**Unlock Experience:**
- When a higher tier unlocks, show celebration:
  ```
  🎉 Level Up!
  
  You're now Level 3!
  
  Tier 2 unlocked:
  • Nocturne Op.9 No.2
  • Moonlight Sonata
  • And more...
  
  [ View New Songs ]
  ```
- Locked tiers show padlock icon in library
- Tapping locked tier shows: "Reach Level X to unlock"

### 3.4 Max Level (v1)

**Level 10 is the cap for v1.**

After Level 10:
- XP can still be earned (no cap)
- XP display shows: "Level 10 · 5,800 XP"
- No further tiers to unlock (v1.5 may add Tier 4 or prestige system)

---

## 4. Run History

### 4.1 Data Structure

```typescript
interface RunHistoryEntry {
  id: string;                   // UUID
  profileId: string;
  songId: string;               // Reference to song
  songTitle: string;            // Denormalized for quick display
  completedAt: number;          // Unix timestamp
  
  // Performance
  score: number;               // Raw score
  accuracy: number;             // Percentage (0-100)
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  bestStreak: number;          // Highest streak achieved
  
  // Settings used
  mode: 'performance' | 'practice';
  speed: number;               // 25-150%
  handMode: 'both' | 'left' | 'right';
  timingPreset: 'beginner' | 'standard' | 'hard';
}
```

### 4.2 History Display

**"My Runs" Screen:**
```
┌─────────────────────────────────────────────────────────────────┐
│  MY RUNS                                         [ Filter ▼ ]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🎹 Für Elise                                    Mar 22   │    │
│  │    Grade: A · 92% · Streak: 34                        │    │
│  │    Speed: 100% · Both hands                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🎵 Prelude in C Major                            Mar 22   │    │
│  │    Grade: S · 98% · Streak: 52                        │    │
│  │    Speed: 110% · Right hand                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🎶 Gymnopédie No.1                              Mar 21   │    │
│  │    Grade: B · 78% · Streak: 12                        │    │
│  │    Speed: 75% · Both hands                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ... (last 10 runs, newest first)                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Filter Options:**
- All songs
- Specific song
- Grade (S, A, B, C, D)
- Mode (Performance, Practice)

### 4.3 History Limits

- **Storage:** Last 50 runs per profile
- **Display:** Last 10 runs in list view
- **Older runs:** Kept in IndexedDB for future features (stats, trends)
- **Cleanup:** When >50 runs, oldest are pruned automatically

---

## 5. Level-Up Celebration

### 5.1 Visual Celebration

When player levels up:

1. **Overlay appears:**
   ```
   ┌────────────────────────────────────────────┐
   │                                            │
   │              ⭐ LEVEL UP! ⭐                │
   │                                            │
   │                  LEVEL 3                   │
   │                                            │
   │            You've earned 250 XP            │
   │                                            │
   │       ┌─────────────────────────┐         │
   │       │     [ New Songs! ]      │         │
   │       │     [ Keep Playing ]    │         │
   │       └─────────────────────────┘         │
   │                                            │
   └────────────────────────────────────────────┘
   ```

2. **Animation sequence:**
   - Screen dims slightly
   - "LEVEL UP" scales in from 0 → 1.2 → 1.0
   - Level number counts up (e.g., "2" → "3")
   - XP bar fills
   - If tier unlocked, unlock animation plays
   - Particles/sparks effect

3. **Duration:** ~3 seconds before options appear

### 5.2 First-Time Milestones

Special celebrations for:
- **First song completed**
- **First S grade**
- **First 10-song streak**
- **First level-up**

After first occurrence, these don't trigger extra fanfare (just normal level-up).

---

## 6. Profile Data Flow

### 6.1 Data Partitioning

Each profile has isolated data:

```
IndexedDB: PianoVibeDB
  ├── profiles/
  │     { id, name, avatar, xp, level, ... }
  │
  ├── run_history/
  │     { profileId, ... }  // All entries have profileId
  │
  ├── imported_songs/
  │     { profileId, ... }  // Imported songs belong to profile
  │
  └── settings/
        { profileId, ... }   // Profile-specific settings
```

### 6.2 Data Operations

```typescript
class ProfileManager {
  
  // Profile CRUD
  async createProfile(name: string, avatar: string): Promise<Profile> { }
  async getProfile(id: string): Promise<Profile | null> { }
  async getAllProfiles(): Promise<Profile[]> { }
  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> { }
  async deleteProfile(id: string): Promise<void> { }
  
  // XP & Leveling
  async addXP(profileId: string, amount: number): Promise<LevelUpResult | null> {
    // Adds XP, checks for level up, returns result if leveled
  }
  
  // Run History
  async recordRun(profileId: string, runData: RunHistoryEntry): Promise<void> { }
  async getRunHistory(profileId: string, limit: number = 10): Promise<RunHistoryEntry[]> { }
  async getBestScore(profileId: string, songId: string): Promise<RunHistoryEntry | null> { }
  
  // Guest Profile
  async createGuestProfile(): Promise<Profile> { }
  async isGuestProfile(id: string): Promise<boolean> { }
  async convertGuestToReal(guestId: string, name: string, avatar: string): Promise<Profile> { }
}
```

---

## 7. Edge Cases

| Scenario | Handling |
|----------|----------|
| Guest profile plays, then creates real profile | Both exist; switchable on launch |
| Delete last remaining profile | Cannot delete last profile; show "At least one profile required" |
| XP overflow (exceeds Level 10 cap) | XP continues accumulating, display shows "Level 10 +" |
| Run history corrupted/missing | Graceful degradation; show empty history with "Play your first song!" |
| Profile switch mid-song | Warn user: "Switching profiles will pause your game. Continue?" |

---

## 8. Settings Persistence

Profile-specific settings stored with profile:

```typescript
interface ProfileSettings {
  profileId: string;
  
  // Audio
  micEnabled: boolean;
  touchEnabled: boolean;
  metronomeEnabled: boolean;
  synthBackingEnabled: boolean;
  
  // Timing
  timingPreset: 'beginner' | 'standard' | 'hard';
  
  // Visual
  showFingering: boolean;
  showParticles: boolean;
  
  // Gameplay Defaults
  defaultHandMode: 'both' | 'left' | 'right';
  defaultSpeed: number;       // 100 by default
  
  // Notifications
  showTutorialHints: boolean;
}
```

---

## 9. Testing Checklist

### Profiles
- [ ] Guest profile created on first launch
- [ ] Can create new named profile
- [ ] Can edit profile name and avatar
- [ ] Can delete profile (except last one)
- [ ] Profile switcher shows all profiles
- [ ] Profile switcher accessible on launch
- [ ] Profile data persists across app restarts
- [ ] Profile data is isolated (switching doesn't bleed data)

### Progression
- [ ] XP earned correctly per song
- [ ] Grade multiplier applies correctly
- [ ] Practice mode XP penalty applies
- [ ] Speed bonus calculates correctly
- [ ] Level up triggers at correct threshold
- [ ] Level-up celebration displays
- [ ] Tier 2 unlocks at Level 3
- [ ] Tier 3 unlocks at Level 5
- [ ] Locked tiers show padlock
- [ ] Level 10 is cap (no level 11)

### Run History
- [ ] Completed song creates history entry
- [ ] Entry contains all required fields
- [ ] History shows newest first
- [ ] Only last 10 shown in list
- [ ] Filter by song works
- [ ] History persists across sessions

### Edge Cases
- [ ] Switching profile mid-game warns user
- [ ] Deleting last profile prevented
- [ ] Guest → real profile conversion works
- [ ] Settings persist per profile

---

## 10. Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| idb | IndexedDB wrapper | Latest |

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-23 | AI | Initial draft |

---

**Next PRD:** [PRD 5: UI/UX, Visual Design & Onboarding](./prd-05-ui-design-onboarding.md)
