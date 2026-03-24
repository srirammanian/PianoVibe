# PianoVibe — QA Acceptance Criteria

**Version:** 1.0  
**Scope:** v1 MVP  
**Purpose:** Verification checklist for QA agents to validate implementation against PRDs  

---

## Overview

This document provides systematic acceptance criteria for all v1 MVP features. Each feature has:
- **Feature ID** for traceability to PRDs
- **Test Case** description
- **Steps to Verify**
- **Expected Result**
- **Pass/Fail criteria**

---

## Feature Matrix

| Feature Area | Priority | PRD |
|--------------|----------|-----|
| [F1] Core Game Loop | P0 | PRD 1 |
| [F2] Falling Notes | P0 | PRD 1 |
| [F3] Hit Detection & Timing | P0 | PRD 1 |
| [F4] Scoring & Streaks | P0 | PRD 1 |
| [F5] Visual Feedback | P1 | PRD 1 |
| [F6] Practice Tools | P1 | PRD 1 |
| [F7] Microphone Input | P0 | PRD 2 |
| [F8] Touch Keyboard | P0 | PRD 2 |
| [F9] Song Library | P1 | PRD 3 |
| [F10] MIDI Import | P1 | PRD 3 |
| [F11] Track Selection | P2 | PRD 3 |
| [F12] Profiles | P1 | PRD 4 |
| [F13] XP & Progression | P1 | PRD 4 |
| [F14] Run History | P2 | PRD 4 |
| [F15] Main Menu & Navigation | P1 | PRD 5 |
| [F16] Splash Screen | P2 | PRD 5 |
| [F17] Onboarding Tutorial | P2 | PRD 5 |
| [F18] Data Persistence | P0 | All |

---

## P0 — Critical (Must Pass)

### [F1] Core Game Loop

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F1.1 | Game starts from song selection | 1. Select profile<br>2. Choose song<br>3. Tap Play | Game scene loads with falling notes | Notes appear and fall within 3 seconds |
| F1.2 | Game pauses | 1. During gameplay, tap pause<br>2. Verify game stops | Overlay appears, notes freeze | Notes do not move while paused |
| F1.3 | Game resumes | 1. From paused state, tap Resume | Game continues from pause point | Notes resume falling, timing preserved |
| F1.4 | Game ends | 1. Play song to completion | Results screen appears | Grade, score, XP displayed correctly |
| F1.5 | Restart works | 1. After results, tap Play Again<br>2. Verify clean state | Fresh game with zero score | No stale notes, score resets to 0 |

---

### [F2] Falling Notes

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F2.1 | Notes fall correctly | 1. Start any song<br>2. Observe note speed | Notes fall at constant velocity | Notes reach play line at correct time |
| F2.2 | Note visual style | 1. Observe note appearance | Gem-shaped rectangles with gradient and glow | Matches UI mock (rectangular, colored, subtle shine) |
| F2.3 | Hand color coding | 1. Play song with both hands<br>2. Observe note colors | Right hand = red, Left hand = blue | Colors are distinct and match spec |
| F2.4 | Auto-zoom to song range | 1. Select song<br>2. Note keyboard range shown | Keyboard zooms to show song's notes | C3-C5 song shows 3 octaves, not full 88 keys |
| F2.5 | Ghost mode (muted hand) | 1. In settings, select "Right hand only"<br>2. Start song | Left hand notes ghost out | Left notes are 30% opacity, no glow |
| F2.6 | Fingering display | 1. Play bundled song<br>2. Observe notes | Finger numbers (1-5) on notes | Numbers visible on bundled songs only |

---

### [F3] Hit Detection & Timing

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F3.1 | Perfect timing registered | 1. Play note exactly when it crosses line | "Perfect!" feedback, green glow | Grade = Perfect, max points |
| F3.2 | Good timing registered | 1. Play note slightly off-center | "Good!" feedback, yellow glow | Grade = Good, 75% points |
| F3.3 | Miss registered | 1. Let note pass without playing | "Miss!" feedback, red fade | Streak breaks, no points |
| F3.4 | Wrong note penalty | 1. Play wrong note intentionally | Red flash on played key | Streak breaks, note stays |
| F3.5 | Early note (Standard mode) | 1. Set to Standard timing<br>2. Play note 200ms early | Partial credit with penalty | Points reduced by 25% |
| F3.6 | Early note (Beginner mode) | 1. Set to Beginner timing<br>2. Play note 200ms early | No feedback | No credit, no penalty |
| F3.7 | Chord detection | 1. Play C-E-G simultaneously<br>2. All notes should register | Each note graded independently | All notes in chord evaluated |
| F3.8 | Timing preset: Beginner | 1. Set to Relaxed timing<br>2. Play at ±400ms from line | Still counts as hit | Tolerance = ±500ms |
| F3.9 | Timing preset: Hard | 1. Set to Strict timing<br>2. Play at ±100ms from line | Counts as hit | Tolerance = ±150ms |

---

### [F7] Microphone Input

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F7.1 | Mic permission prompt | 1. First launch, select song<br>2. Choose mic input | Browser permission dialog appears | Dialog shown before mic access |
| F7.2 | Mic permission granted | 1. Grant mic permission<br>2. Play piano note | Note detected and registered | Note appears in game |
| F7.3 | Mic permission denied | 1. Deny mic permission | Falls back to touch keyboard | Touch keyboard activates |
| F7.4 | Piano detection accuracy | 1. Play C4 clearly<br>2. Play E4 clearly<br>3. Verify each registers | Correct notes detected | No wrong note detection |
| F7.5 | Mic disconnection | 1. Start game with mic<br>2. Disconnect mic | Game pauses | "Mic disconnected" message shown |
| F7.6 | Background noise filtering | 1. Have TV/music playing in background<br>2. Play song | Only piano notes register | No false triggers from noise |

---

### [F8] Touch Keyboard

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F8.1 | Touch registers | 1. Tap any key on touch keyboard | Note plays | Note appears in game |
| F8.2 | Multi-touch chords | 1. Touch 3 keys simultaneously<br>2. All should register | All notes detected | 3+ simultaneous touches work |
| F8.3 | Keyboard range matches song | 1. Select song with C3-C5 range<br>2. Verify keyboard shows | Shows 3 octaves, not full 88 | Auto-zoom works |
| F8.4 | Key visual feedback | 1. Touch and hold key | Key depresses visually | Key darkens and moves down |

---

### [F18] Data Persistence

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F18.1 | Profile persists | 1. Create profile<br>2. Close browser<br>3. Reopen | Profile exists | Profile visible on return |
| F18.2 | XP persists | 1. Play song, earn XP<br>2. Close browser<br>3. Reopen | XP unchanged | XP value preserved |
| F18.3 | Imported song persists | 1. Import MIDI file<br>2. Close browser<br>3. Reopen | Song in library | Imported song still there |
| F18.4 | Run history persists | 1. Play song<br>2. Check history<br>3. Close<br>4. Reopen | History shows previous play | History entries preserved |

---

## P1 — High Priority

### [F4] Scoring & Streaks

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F4.1 | Score calculates correctly | 1. Play 5 Perfect notes<br>2. Check score | Score = 500 (5 × 100) | Score matches expected |
| F4.2 | Streak multiplier applies | 1. Hit 10 consecutive notes<br>2. Verify multiplier | 3x multiplier active | Points × 3 for hits |
| F4.3 | Streak breaks on miss | 1. Build streak to 15<br>2. Miss one note | Streak resets to 0 | Multiplier resets to 1x |
| F4.4 | Streak caps at 4x | 1. Build streak past 20<br>2. Verify multiplier | Caps at 4x | Multiplier does not exceed 4x |
| F4.5 | Final grade calculates | 1. Play song at known accuracy<br>2. Check grade | 95%+ = S, 85%+ = A, etc. | Grade matches accuracy thresholds |
| F4.6 | Practice mode no score | 1. Select Practice mode<br>2. Play song | Score hidden | Score not visible during play |

---

### [F5] Visual Feedback

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F5.1 | Hit particles emit | 1. Hit a note with Perfect timing<br>2. Observe | Particle burst at note | 8-12 particles visible |
| F5.2 | Feedback text animates | 1. Hit note<br>2. Observe "Perfect!" | Text scales in, floats up, fades | Animation completes in ~450ms |
| F5.3 | Streak flame appears | 1. Build streak to 5<br>2. Observe | Flame icon appears next to streak | Flame animates (flickers) |
| F5.4 | High streak screen shake | 1. Build streak to 20+<br>2. Hit more notes | Subtle screen shake | Canvas shakes slightly on each hit |
| F5.5 | Miss feedback | 1. Let note pass | Note turns red, fades | Note color changes and disappears |

---

### [F6] Practice Tools

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F6.1 | Speed slider works | 1. Set speed to 50%<br>2. Play song | Notes fall at half speed | Timing proportional |
| F6.2 | Speed scales timing | 1. Set 50% speed<br>2. Play note | Timing window also halved | 250ms window at 50% speed |
| F6.3 | A-B loop marks | 1. During song, tap "Mark A"<br>2. Play more, tap "Mark B"<br>3. Wait | Song loops | Returns to Mark A point |
| F6.4 | Clear loop | 1. With loop active, tap Clear | Loop removed | Song plays through normally |

---

### [F9] Song Library

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F9.1 | Bundled songs visible | 1. Open song library | All 10 bundled songs listed | 10 songs appear |
| F9.2 | Tier locked indicator | 1. Check Tier 2 songs at Level 1 | Locked padlock shown | Lock icon visible |
| F9.3 | Tier unlock message | 1. Tap locked Tier 2 song | Shows "Reach Level 3" | Message appears |
| F9.4 | Song info displayed | 1. View any song card | Shows title, composer, difficulty | Info matches bundled data |

---

### [F10] MIDI Import

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F10.1 | Import via drag-drop | 1. Drag .mid file to import zone | File processes | Song appears in "My Songs" |
| F10.2 | Invalid file rejected | 1. Drop non-MIDI file | Error message | "Invalid file" shown |
| F10.3 | Large file rejected | 1. Drop file >5MB | Error message | "File too large" shown |
| F10.4 | Imported song playable | 1. Tap imported song<br>2. Start game | Notes fall | Game runs with imported notes |

---

### [F12] Profiles

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F12.1 | Guest profile auto-created | 1. Fresh install, launch app | Guest profile exists | "Guest" shown as option |
| F12.2 | Create named profile | 1. Tap "Add Profile"<br>2. Enter name, pick emoji<br>3. Submit | Profile created | Profile appears in list |
| F12.3 | Switch profiles | 1. With multiple profiles<br>2. Select different profile | Profile switches | XP/level shows new profile data |
| F12.4 | Delete profile | 1. Long-press profile<br>2. Select Delete | Profile removed | Profile no longer in list |
| F12.5 | Guest upgrade | 1. On guest profile<br>2. Create named profile | Named profile has guest's XP | XP transferred |

---

### [F13] XP & Progression

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F13.1 | XP earned on completion | 1. Play song with Grade A<br>2. Check XP earned | XP increases | XP matches formula |
| F13.2 | Level up triggers | 1. Accumulate enough XP<br>2. Complete song | Level up celebration | "Level Up!" animation shows |
| F13.3 | Tier 2 unlocks at L3 | 1. Reach Level 3<br>2. Check Tier 2 songs | Songs unlocked | Tier 2 now playable |
| F13.4 | Grade bonus applies | 1. Play same song with S vs D | S grade = more XP | XP(S) > XP(D) |
| F13.5 | Practice mode XP penalty | 1. Play in Practice mode<br>2. Compare to Performance | Practice = less XP | Practice XP ~30% of Performance |

---

### [F15] Main Menu & Navigation

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F15.1 | Menu options present | 1. Open main menu | Shows Play, Library, Profile | 3 options visible |
| F15.2 | Play navigates to library | 1. Tap Play | Shows unlocked songs | Filtered to playable songs |
| F15.3 | Back navigation | 1. From any screen, tap back | Returns to previous | No dead ends |
| F15.4 | Song setup screen | 1. Select a song<br>2. See setup options | Shows mode, speed, hand selection | All options present |

---

## P2 — Medium Priority

### [F11] Track Selection

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F11.1 | Track selector appears | 1. Select multi-track MIDI<br>2. Before game | Selector shows all tracks | Piano tracks auto-selected |
| F11.2 | Track toggle works | 1. Uncheck a track<br>2. Start game | Track notes not present | Only selected tracks play |

---

### [F14] Run History

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F14.1 | History records | 1. Complete a song<br>2. Check history | Entry appears | Song, date, grade, score shown |
| F14.2 | History shows last 10 | 1. Play 15 songs<br>2. Check history | Shows 10 most recent | Only 10 entries visible |
| F14.3 | History filter | 1. Filter by song name<br>2. Results filtered | Only matching songs shown | Filter works correctly |

---

### [F16] Splash Screen

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F16.1 | Splash animates | 1. Launch app<br>2. Observe | Logo animates, loading bar | Smooth animation, no jank |
| F16.2 | Transitions to profile | 1. Wait for load | Fades to profile selector | No white flash or blank screen |

---

### [F17] Onboarding Tutorial

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| F17.1 | Tutorial on first launch | 1. Fresh install, first play | Tutorial appears | Step 1 welcome shows |
| F17.2 | Tutorial skip | 1. During tutorial, tap Skip | Tutorial exits | Main menu appears |
| F17.3 | Mic setup in tutorial | 1. Follow tutorial to mic step | Permission prompt appears | Browser dialog shows |
| F17.4 | Tutorial complete | 1. Follow all steps | "You're Ready!" shown | Can proceed to menu |

---

## Edge Case Tests

| TC-ID | Test Case | Steps | Expected Result | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| EC1 | Tab loses focus | 1. During gameplay, switch tabs | Game pauses | Auto-pause works |
| EC2 | Browser resize | 1. During gameplay, resize window | Game adapts | No visual glitches |
| EC3 | Empty MIDI | 1. Import MIDI with no notes | Error message | "No playable notes" shown |
| EC4 | Very fast song | 1. Play song >200 BPM | Game still playable | Notes still fall correctly |
| EC5 | No mic available | 1. On device without mic<br>2. Try to use mic input | Falls back to touch | Touch keyboard shown |

---

## Visual Checkpoints

### Must Match UI Mock

| Element | Checkpoint |
|---------|------------|
| Note gems | Rectangular with gradient, subtle shine, glow |
| Background | Dark charcoal (#0D1117), not pure black |
| Hand colors | Warm red (#E74C3C) and royal blue (#3498DB) |
| Feedback text | Large, uppercase, with text shadow |
| Streak counter | Top-left, with flame icon at 5+ |
| Progress bar | Top-center, gradient fill |
| Particles | Soft glows, not harsh sparks |

---

## Test Execution Order

### Phase 1: Critical Path (P0)
1. F1.1 - Game starts
2. F2.1-F2.3 - Notes display
3. F3.1-F3.3 - Hit detection
4. F7.2 - Mic input
5. F8.1 - Touch input
6. F18.1-F18.2 - Persistence

### Phase 2: Core Features (P1)
7. F4.1-F4.5 - Scoring
8. F5.1-F5.3 - Visual feedback
9. F6.1-F6.3 - Practice tools
10. F9.1-F9.2 - Library
11. F12.1-F12.3 - Profiles
12. F13.1-F13.2 - XP/Progression

### Phase 3: Polish (P2)
13. F11.1-F11.2 - Track selection
14. F14.1-F14.2 - History
15. F16.1-F16.2 - Splash
16. F17.1-F17.3 - Tutorial

---

## Reporting Format

For each failing test, report:
```
[FAIL] TC-ID: Test Case Name
- Expected: [what should happen]
- Actual: [what happened]
- Severity: P0/P1/P2
- Screenshot: [attach if visual]
- Device: [browser/OS]
```

---

## Sign-Off Checklist

Before declaring v1 MVP complete, all P0 tests must pass, and ≥90% of P1 tests must pass.

| Priority | Required Pass Rate | Status |
|----------|-------------------|--------|
| P0 | 100% | [ ] |
| P1 | 90% | [ ] |
| P2 | 75% | [ ] |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-23 | AI | Initial QA criteria |

---

*Traceability: Test cases map to PRD sections. See PRD index for feature details.*
