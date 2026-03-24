// ─── MicInput ─────────────────────────────────────────────────────────────────
// Captures microphone audio and performs real-time pitch detection using pitchy.
// Emits normalised noteOn events via InputBridge when a piano note is detected.
//
// Usage:
//   import { initMic, destroyMic } from './MicInput';
//   await initMic();   // Requests mic permission + starts detection loop
//   destroyMic();      // Stops detection and releases audio resources

import { AUDIO } from '../core/Constants';
import { emitNoteOn, emitNoteOff } from './InputBridge';

// ─── Note name lookup ─────────────────────────────────────────────────────────
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

// Pitchy PitchDetector instance (class-based API)
// Type is erased here so the module can tree-shake in non-mic builds.
let pitchDetector: { findPitch: (input: Float32Array, sampleRate: number) => [number, number] } | null = null;

// Debounce: track last emission time per MIDI note to avoid rapid re-fires
const lastNoteTime = new Map<number, number>();

// Track currently active mic notes so we can emit noteOff
let currentMidiNote: number | null = null;

// ─── Initialisation ───────────────────────────────────────────────────────────
export async function initMic(): Promise<void> {
  if (audioContext) return; // Already running

  // Request mic access with raw audio (no processing that distorts pitch)
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

  // Dynamic import keeps pitchy out of the main bundle until mic is actually used.
  // Pitchy v4+ exposes PitchDetector (class-based) not a findPitch function.
  const { PitchDetector } = await import('pitchy');
  pitchDetector = PitchDetector.forFloat32Array(cfg.BUFFER_SIZE);

  startDetectionLoop();
}

// ─── Detection loop ───────────────────────────────────────────────────────────
function startDetectionLoop(): void {
  const cfg = AUDIO.PITCHY;
  const buffer = new Float32Array(cfg.BUFFER_SIZE);

  const detect = (): void => {
    if (!analyser || !pitchDetector) return;

    analyser.getFloatTimeDomainData(buffer);
    const [frequency, clarity] = pitchDetector!.findPitch(buffer, cfg.SAMPLE_RATE);

    const now = performance.now();

    if (
      clarity >= cfg.MIN_CONFIDENCE &&
      frequency >= cfg.MIN_FREQUENCY &&
      frequency <= cfg.MAX_FREQUENCY
    ) {
      const midiNote = frequencyToMidi(frequency);
      const lastTime = lastNoteTime.get(midiNote) ?? 0;

      if (now - lastTime >= cfg.DEBOUNCE_MS) {
        // Emit noteOff for any previously active different note
        if (currentMidiNote !== null && currentMidiNote !== midiNote) {
          emitNoteOff(midiToPitch(currentMidiNote), currentMidiNote, 'mic');
        }

        lastNoteTime.set(midiNote, now);
        currentMidiNote = midiNote;

        // Velocity is approximated from RMS amplitude of the buffer
        const rms = computeRms(buffer);
        const velocity = Math.min(127, Math.round(rms * 1000));

        emitNoteOn(midiToPitch(midiNote), midiNote, velocity || 100, 'mic', clarity);
      }
    } else {
      // No confident pitch — emit noteOff for the active note
      if (currentMidiNote !== null) {
        emitNoteOff(midiToPitch(currentMidiNote), currentMidiNote, 'mic');
        currentMidiNote = null;
      }
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

// ─── Teardown ─────────────────────────────────────────────────────────────────
export function destroyMic(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (currentMidiNote !== null) {
    emitNoteOff(midiToPitch(currentMidiNote), currentMidiNote, 'mic');
    currentMidiNote = null;
  }

  audioContext?.close();
  audioContext = null;
  analyser = null;

  // Stop all tracks so the browser mic indicator goes away
  mediaStream?.getTracks().forEach((t) => t.stop());
  mediaStream = null;

  pitchDetector = null;
  lastNoteTime.clear();
}

export function isMicActive(): boolean {
  return audioContext !== null;
}
