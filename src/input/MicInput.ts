// ─── MicInput ─────────────────────────────────────────────────────────────────
// Captures microphone audio and performs real-time pitch detection using pitchy.
// Emits normalised noteOn events via InputBridge when a piano note is detected.
//
// Key improvements over naive pitch detection:
// 1. Frequency smoothing — rolling average over N frames to reduce jitter
// 2. Confirmation buffer — a note must be detected N consecutive frames
//    before we commit to it (prevents overtones triggering wrong notes)
// 3. Hysteresis — require clarity to stay below threshold for N frames
//    before releasing (prevents dropouts mid-note)
// 4. RMS noise gate — ignore detections where RMS amplitude is too low
// 5. Per-note debounce — prevent rapid re-fires of the same note
//
// Usage:
//   import { initMic, destroyMic } from './MicInput';
//   await initMic();   // Requests mic permission + starts detection loop
//   destroyMic();      // Stops detection and releases audio resources

import { AUDIO } from '../core/Constants';
import { emitNoteOn, emitNoteOff } from './InputBridge';

// ─── Tuning constants ────────────────────────────────────────────────────────
const DETECTION_FRAMES = 4;     // Consecutive frames needed to confirm a note
const RELEASE_FRAMES = 3;        // Consecutive frames below threshold to release
const FREQ_SMOOTH_FRAMES = 5;   // Frames for rolling average frequency
const MIN_RMS = 0.005;          // Minimum RMS amplitude to register a note
const RMS_VELOCITY_SCALE = 300; // Scale RMS to 0-127 velocity range
const INTER_NOTE_DEBOUNCE_MS = 80; // Minimum ms between different notes

// ─── Note name lookup ───────────────────────────────────────────────────────
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export function midiToPitch(midi: number): string {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

export function frequencyToMidi(freq: number): number {
  return Math.round(12 * Math.log2(freq / 440) + 69);
}

// ─── Module-level state ───────────────────────────────────────────────────────
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let mediaStream: MediaStream | null = null;
let animationFrameId: number | null = null;
let pitchDetector: { findPitch: (input: Float32Array, sampleRate: number) => [number, number] } | null = null;

// ─── Detection smoothing state ─────────────────────────────────────────────────
let freqHistory: number[] = [];         // Rolling average of frequency
let clarityHistory: number[] = [];      // Rolling average of clarity
let rmsHistory: number[] = [];          // Rolling average of RMS amplitude

let confirmedMidiNote: number | null = null;   // Note we've confirmed holding
let confirmCount = 0;                          // Frames at current note
let releaseCount = 0;                          // Frames below threshold
let lastEmittedMidiNote: number | null = null; // For debounce
let lastEmittedTime = 0;                       // For debounce

// ─── Initialisation ───────────────────────────────────────────────────────────
export async function initMic(): Promise<void> {
  if (audioContext) return;

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  const cfg = AUDIO.PITCHY;
  audioContext = new AudioContext({ sampleRate: cfg.SAMPLE_RATE });
  const source = audioContext.createMediaStreamSource(mediaStream);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = cfg.BUFFER_SIZE;
  analyser.smoothingTimeConstant = 0; // We want instantaneous frames
  source.connect(analyser);

  const { PitchDetector } = await import('pitchy');
  pitchDetector = PitchDetector.forFloat32Array(cfg.BUFFER_SIZE);

  // Reset smoothing state
  freqHistory = [];
  clarityHistory = [];
  rmsHistory = [];
  confirmedMidiNote = null;
  confirmCount = 0;
  releaseCount = 0;
  lastEmittedMidiNote = null;
  lastEmittedTime = 0;

  startDetectionLoop();
}

// ─── Rolling average helper ─────────────────────────────────────────────────────
function pushAndAverage(arr: number[], value: number, maxLen: number): number {
  arr.push(value);
  if (arr.length > maxLen) arr.shift();
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ─── Detection loop ────────────────────────────────────────────────────────────
function startDetectionLoop(): void {
  const cfg = AUDIO.PITCHY;
  const buffer = new Float32Array(cfg.BUFFER_SIZE);

  const detect = (): void => {
    if (!analyser || !pitchDetector) {
      animationFrameId = requestAnimationFrame(detect);
      return;
    }

    analyser.getFloatTimeDomainData(buffer);
    const [rawFrequency, rawClarity] = pitchDetector!.findPitch(buffer, cfg.SAMPLE_RATE);
    const rms = computeRms(buffer);

    // Update rolling averages
    const avgClarity = pushAndAverage(clarityHistory, rawClarity, DETECTION_FRAMES);
    const avgRms = pushAndAverage(rmsHistory, rms, DETECTION_FRAMES);

    const now = performance.now();

    // ── Noise gate: ignore if amplitude too low ────────────────────────────────
    if (avgRms < MIN_RMS) {
      // Silence — release any held note
      if (confirmedMidiNote !== null) {
        emitNoteOff(midiToPitch(confirmedMidiNote), confirmedMidiNote, 'mic');
        confirmedMidiNote = null;
        confirmCount = 0;
        releaseCount = 0;
      }
      animationFrameId = requestAnimationFrame(detect);
      return;
    }

    // ── Confidence gate ────────────────────────────────────────────────────
    if (avgClarity < cfg.MIN_CONFIDENCE) {
      // Low clarity — this could be silence or noise
      if (confirmedMidiNote !== null) {
        releaseCount++;
        if (releaseCount >= RELEASE_FRAMES) {
          // Been unclear for several frames — release the note
          emitNoteOff(midiToPitch(confirmedMidiNote), confirmedMidiNote, 'mic');
          confirmedMidiNote = null;
          confirmCount = 0;
          releaseCount = 0;
        }
      }
      animationFrameId = requestAnimationFrame(detect);
      return;
    }

    // ── Valid detection — check frequency bounds ─────────────────────────────
    if (rawFrequency < cfg.MIN_FREQUENCY || rawFrequency > cfg.MAX_FREQUENCY) {
      animationFrameId = requestAnimationFrame(detect);
      return;
    }

    // ── Smooth the frequency ───────────────────────────────────────────────
    const avgFrequency = pushAndAverage(freqHistory, rawFrequency, FREQ_SMOOTH_FRAMES);
    const detectedMidi = frequencyToMidi(avgFrequency);

    // ── If same note as confirmed, keep counting ─────────────────────────────
    if (detectedMidi === confirmedMidiNote) {
      confirmCount++;
      releaseCount = 0; // Reset release counter
    } else {
      // Different note detected
      if (detectedMidi === lastEmittedMidiNote) {
        // Same as last emitted — this is a re-detection after dropout
        // Treat as confirmation of the held note
        confirmCount++;
        releaseCount = 0;
        confirmedMidiNote = detectedMidi;
      } else {
        // New, different note
        confirmCount = 1;
        releaseCount = 0;
      }
    }

    // ── Confirm new note after N consecutive detections ────────────────────
    if (confirmedMidiNote === null && confirmCount >= DETECTION_FRAMES) {
      // Transitioning to a new note

      // Debounce between different notes
      if (lastEmittedMidiNote !== null &&
          lastEmittedMidiNote !== detectedMidi &&
          now - lastEmittedTime < INTER_NOTE_DEBOUNCE_MS) {
        // Too soon after last note — skip this detection
        animationFrameId = requestAnimationFrame(detect);
        return;
      }

      confirmedMidiNote = detectedMidi;

      // Velocity from RMS amplitude, scaled to 0-127
      const velocity = Math.min(127, Math.round(avgRms * RMS_VELOCITY_SCALE)) || 80;

      emitNoteOn(midiToPitch(detectedMidi), detectedMidi, velocity, 'mic', avgClarity);
      lastEmittedMidiNote = detectedMidi;
      lastEmittedTime = now;

    } else if (confirmedMidiNote !== null &&
               confirmedMidiNote !== detectedMidi &&
               confirmCount >= DETECTION_FRAMES) {
      // Transitioning between two different notes

      if (lastEmittedMidiNote !== null &&
          lastEmittedMidiNote !== detectedMidi &&
          now - lastEmittedTime < INTER_NOTE_DEBOUNCE_MS) {
        animationFrameId = requestAnimationFrame(detect);
        return;
      }

      // Emit noteOff for the old note and noteOn for the new one
      emitNoteOff(midiToPitch(confirmedMidiNote), confirmedMidiNote, 'mic');
      emitNoteOn(midiToPitch(detectedMidi), detectedMidi, Math.min(127, Math.round(avgRms * RMS_VELOCITY_SCALE)) || 80, 'mic', avgClarity);
      lastEmittedMidiNote = detectedMidi;
      lastEmittedTime = now;
      confirmedMidiNote = detectedMidi;
    }

    animationFrameId = requestAnimationFrame(detect);
  };

  animationFrameId = requestAnimationFrame(detect);
}

function computeRms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

// ─── Teardown ────────────────────────────────────────────────────────────────
export function destroyMic(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (confirmedMidiNote !== null) {
    emitNoteOff(midiToPitch(confirmedMidiNote), confirmedMidiNote, 'mic');
    confirmedMidiNote = null;
  }

  audioContext?.close();
  audioContext = null;
  analyser = null;
  mediaStream?.getTracks().forEach((t) => t.stop());
  mediaStream = null;
  pitchDetector = null;
  freqHistory = [];
  clarityHistory = [];
  rmsHistory = [];
  confirmCount = 0;
  releaseCount = 0;
  lastEmittedMidiNote = null;
  lastEmittedTime = 0;
}

export function isMicActive(): boolean {
  return audioContext !== null;
}
