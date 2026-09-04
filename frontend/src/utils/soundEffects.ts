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

/**
 * Card Flip Sound - Crisp tactile click / card snap
 */
export function playCardFlipSound() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    console.warn('Audio playback error (flip):', e);
  }
}

/**
 * Card Match Sound - Cheerful, sparkling triple chord (C5 -> E5 -> G5 -> C6)
 */
export function playMatchSound() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const startTime = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === freqs.length - 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch (e) {
    console.warn('Audio playback error (match):', e);
  }
}

/**
 * Mismatch Sound - Soft gentle two-tone "wrong" wobble
 */
export function playMismatchSound() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.linearRampToValueAtTime(170, now + 0.2);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {
    console.warn('Audio playback error (mismatch):', e);
  }
}

/**
 * Combo Sound - Scaled pitch sparkle for consecutive matches
 */
export function playComboSound(combo: number) {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = 520 + Math.min(combo, 8) * 90;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.18);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.warn('Audio playback error (combo):', e);
  }
}

/**
 * Win Fanfare Sound - Grand celebratory victory chime sequence
 */
export function playWinFanfare() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Triumphant chord progression: C5 -> E5 -> G5 -> C6 -> E6
    const notes = [
      { f: 523.25, t: 0, d: 0.2 },
      { f: 659.25, t: 0.12, d: 0.2 },
      { f: 783.99, t: 0.24, d: 0.2 },
      { f: 1046.5, t: 0.36, d: 0.4 },
      { f: 1318.5, t: 0.52, d: 0.7 },
    ];

    notes.forEach(({ f, t, d }) => {
      const startTime = now + t;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + d);
    });
  } catch (e) {
    console.warn('Audio playback error (win fanfare):', e);
  }
}

/**
 * Letter Place Sound - Crisp mechanical click
 */
export function playLetterPlaceSound() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {
    console.warn('Audio playback error (letter place):', e);
  }
}

/**
 * Letter Remove Sound - Subtle pop
 */
export function playLetterRemoveSound() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    console.warn('Audio playback error (letter remove):', e);
  }
}

/**
 * Treasure Chest Open Sound - Magic golden chimes cascade
 */
export function playTreasureChestSound() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];

    notes.forEach((freq, i) => {
      const startTime = now + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch (e) {
    console.warn('Audio playback error (treasure sound):', e);
  }
}


