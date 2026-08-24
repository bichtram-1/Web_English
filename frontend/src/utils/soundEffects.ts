/**
 * Audio synthesis sound effects utility for LinguaLeap
 * Uses Web Audio API for zero-latency, 100% offline "ting" (correct) and "tèng tèng" (incorrect) audio.
 */

const SOUND_STORAGE_KEY = 'lingualeap_sound_enabled';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(SOUND_STORAGE_KEY);
  return val === null ? true : val === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
}

export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  return next;
}

/**
 * "Ting!" - Cheerful, crisp victory chime for correct answers
 * Plays a bright high-frequency dual chime (E5 -> A5 with E6 overtone)
 */
export function playCorrectSound() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Primary bell strike (E5 - 659.25Hz -> A5 - 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // High sparkling sparkle overtone (E6 - 1318.5Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, now + 0.06);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.2, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.warn('Audio playback error (ting):', e);
  }
}

/**
 * "Tèng tèng" - Distinct two-tone descending failure sound for incorrect answers
 * Plays Tone 1: 260Hz -> 220Hz, Tone 2: 196Hz -> 150Hz
 */
export function playIncorrectSound() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First "Tèng" (C4 -> A3: 260Hz -> 220Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(260, now);
    osc1.frequency.exponentialRampToValueAtTime(210, now + 0.14);
    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Second lower "Tèng" (G3 -> D3: 196Hz -> 146Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(196, now + 0.16);
    osc2.frequency.exponentialRampToValueAtTime(140, now + 0.36);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.26, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.42);
  } catch (e) {
    console.warn('Audio playback error (teng teng):', e);
  }
}
