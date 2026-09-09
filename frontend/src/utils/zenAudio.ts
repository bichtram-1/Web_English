/**
 * Zen Ambient & Nature Audio Engine
 * Combines real high-definition audio recordings (Bamboo Flute Instrumental Song, Rain, River, Birds, Thunder)
 * with organic synthesizers (Crystal Wind Chimes & Tranquil Felt Piano)
 * and a Tibetan Singing Bowl Chime.
 */

export interface SoundChannel {
  id: string;
  nameVi: string;
  nameEn: string;
  icon: string;
  enabled: boolean;
  volume: number; // 0 to 1
  type: 'audio' | 'synth';
  src?: string;
}

export type ZenPresetId = 'morning' | 'rainy_night' | 'tranquil_stream' | 'deep_meditation';

export interface ZenPresetInfo {
  id: ZenPresetId;
  nameVi: string;
  nameEn: string;
  icon: string;
  descVi: string;
  descEn: string;
}

export const ZEN_PRESETS: ZenPresetInfo[] = [
  {
    id: 'deep_meditation',
    nameVi: 'Đại Định Bồng Lai',
    nameEn: 'Deep Celestial Zen',
    icon: '🎋',
    descVi: 'Sáo trúc bồng lai kết hợp tiếng suối thiền tịnh',
    descEn: 'Acoustic bamboo flute merged with tranquil mountain brook',
  },
  {
    id: 'tranquil_stream',
    nameVi: 'Suối Rừng Yên Ả',
    nameEn: 'Tranquil Forest Stream',
    icon: '🌊',
    descVi: 'Suối reo róc rách hòa chuông gió pha lê và tiếng sáo',
    descEn: 'Gentle babbling stream with crystal chimes and soft flute',
  },
  {
    id: 'rainy_night',
    nameVi: 'Đêm Mưa Sâu Lắng',
    nameEn: 'Deep Rainy Night',
    icon: '🌧️',
    descVi: 'Mưa đêm rơi tĩnh lặng với tiếng sấm dịu & sáo trúc',
    descEn: 'Serene rainfall with distant soft thunder and acoustic flute',
  },
  {
    id: 'morning',
    nameVi: 'Cõi Ban Mai Rạng Rỡ',
    nameEn: 'Radiant Morning Dew',
    icon: '🐦',
    descVi: 'Tiếng chim hót ríu rít, suối reo cùng sáo trúc du dương',
    descEn: 'Forest birds singing by the stream with melodious flute',
  },
];

// Default channels configuration
export const DEFAULT_CHANNELS: SoundChannel[] = [
  {
    id: 'flute_bonglai',
    nameVi: 'Khúc Sáo Bồng Lai ',
    nameEn: 'Celestial Bamboo Flute ',
    icon: '🎋',
    enabled: true,
    volume: 0.75,
    type: 'audio',
    src: '/sounds/zen/flute_bonglai.mp3',
  },
  {
    id: 'flute_peaceful',
    nameVi: 'Khúc Đàn Du Dương ',
    nameEn: 'Tranquil Piano Melody ',
    icon: '🪈',
    enabled: false,
    volume: 0.7,
    type: 'audio',
    src: '/sounds/zen/flute.mp3',
  },
  {
    id: 'rain',
    nameVi: 'Tiếng Mưa Rơi',
    nameEn: 'Gentle Rainfall',
    icon: '🌧️',
    enabled: true,
    volume: 0.6,
    type: 'audio',
    src: '/sounds/zen/rain.mp3',
  },
  {
    id: 'river',
    nameVi: 'Tiếng Suối Reo',
    nameEn: 'Babbling Brook',
    icon: '🌊',
    enabled: false,
    volume: 0.65,
    type: 'audio',
    src: '/sounds/zen/river.mp3',
  },
  {
    id: 'forest',
    nameVi: 'Tiếng Chim Hót',
    nameEn: 'Forest Songbirds',
    icon: '🐦',
    enabled: false,
    volume: 0.7,
    type: 'audio',
    src: '/sounds/zen/forest.mp3',
  },
  {
    id: 'thunder',
    nameVi: 'Tiếng Sấm Dịu',
    nameEn: 'Distant Thunder',
    icon: '⚡',
    enabled: false,
    volume: 0.5,
    type: 'audio',
    src: '/sounds/zen/thunder.mp3',
  },
  {
    id: 'windchime',
    nameVi: 'Chuông Gió Pha Lê',
    nameEn: 'Crystal Wind Chimes',
    icon: '🎐',
    enabled: false,
    volume: 0.6,
    type: 'synth',
  },
  {
    id: 'piano',
    nameVi: 'Đàn Piano Dịu Êm',
    nameEn: 'Tranquil Piano',
    icon: '🎹',
    enabled: false,
    volume: 0.65,
    type: 'synth',
  },
];

// Internal state
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isEngineActive = false;
let globalMasterVolume = 0.8;

// HTML5 Audio elements map for nature recordings & flute song
const audioElements: Map<string, HTMLAudioElement> = new Map();

// Intervals for synths
let chimeInterval: any = null;
let pianoInterval: any = null;

function getOrCreateContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(globalMasterVolume, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Tibetan Singing Bowl Chime (432Hz Healing Frequency)
 */
export function playZenChime(): void {
  try {
    const ctx = getOrCreateContext();
    if (!ctx || !masterGain) return;

    const now = ctx.currentTime;
    const chimeGain = ctx.createGain();
    chimeGain.gain.setValueAtTime(0.55 * globalMasterVolume, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);
    chimeGain.connect(masterGain);

    // 432Hz Fundamental tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(432, now);
    osc1.frequency.exponentialRampToValueAtTime(430, now + 3.4);
    osc1.connect(chimeGain);
    osc1.start(now);
    osc1.stop(now + 3.6);

    // Harmonic 864Hz
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(864, now);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.25, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
    osc2.connect(gain2);
    gain2.connect(chimeGain);
    osc2.start(now);
    osc2.stop(now + 2.8);

    // Shimmer 1296Hz
    const osc3 = ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1296, now + 0.05);
    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0.12, now + 0.05);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    osc3.connect(gain3);
    gain3.connect(chimeGain);
    osc3.start(now + 0.05);
    osc3.stop(now + 2.2);
  } catch (e) {
    console.warn('Zen chime audio error:', e);
  }
}

/**
 * Soft Stone Tap Sound
 */
export function playZenTapSound(): void {
  try {
    const ctx = getOrCreateContext();
    if (!ctx || !masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.09);

    gain.gain.setValueAtTime(0.16 * globalMasterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.11);
  } catch (e) {
    console.warn('Zen tap audio error:', e);
  }
}

/**
 * Luminous Crystal Wind Chimes (528Hz Solfeggio Healing Frequency)
 * Pure, airy, celestial crystal glass chimes that sway gently
 */
const CHIME_FREQUENCIES = [528, 660, 792, 880, 1056, 1320];

function playWindChime(ctx: AudioContext, gainTarget: GainNode, channelVol: number) {
  if (!isEngineActive) return;

  const now = ctx.currentTime;
  const count = 1 + Math.floor(Math.random() * 2);

  for (let i = 0; i < count; i++) {
    const freq = CHIME_FREQUENCIES[Math.floor(Math.random() * CHIME_FREQUENCIES.length)]!;
    const chimeStart = now + i * (0.18 + Math.random() * 0.2);
    const duration = 2.8 + Math.random() * 1.2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, chimeStart);

    gain.gain.setValueAtTime(0, chimeStart);
    gain.gain.linearRampToValueAtTime(0.09 * channelVol * globalMasterVolume, chimeStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, chimeStart + duration);

    osc.connect(gain);
    gain.connect(gainTarget);

    osc.start(chimeStart);
    osc.stop(chimeStart + duration);
  }
}

/**
 * Tranquil Felt Piano Synthesizer
 * Gentle Satie/Ghibli style piano chords & arpeggios
 */
const PIANO_PROGRESSIONS = [
  // Cmaj9 (C3, G3, B3, E4, D4)
  [130.81, 196.0, 246.94, 329.63, 293.66],
  // Am9 (A2, E3, G3, C4, B3)
  [110.0, 164.81, 196.0, 261.63, 246.94],
  // Fmaj7 (F2, C3, E3, A3, C4)
  [87.31, 130.81, 164.81, 220.0, 261.63],
  // Em7 (E2, B2, D3, G3, B3)
  [82.41, 123.47, 146.83, 196.0, 246.94],
];
let pianoChordIdx = 0;

function playPianoArpeggio(ctx: AudioContext, gainTarget: GainNode, channelVol: number) {
  if (!isEngineActive) return;

  const notes = PIANO_PROGRESSIONS[pianoChordIdx % PIANO_PROGRESSIONS.length]!;
  pianoChordIdx++;

  const now = ctx.currentTime;
  const decayTime = 4.2;

  // Warm felt filter
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1100, now);
  filter.connect(gainTarget);

  notes.forEach((freq, i) => {
    const noteStart = now + i * 0.22;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, noteStart);

    // Warm piano strike & long decay
    noteGain.gain.setValueAtTime(0, noteStart);
    noteGain.gain.linearRampToValueAtTime(0.12 * channelVol * globalMasterVolume, noteStart + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + decayTime);

    osc.connect(noteGain);
    noteGain.connect(filter);

    osc.start(noteStart);
    osc.stop(noteStart + decayTime);
  });
}

/**
 * Manage HTML5 audio tracks (Flute song, Rain, River, Birds, Thunder)
 */
function updateAudioElement(channel: SoundChannel) {
  if (typeof window === 'undefined' || !channel.src) return;

  let el = audioElements.get(channel.id);
  if (!el) {
    el = new Audio(channel.src);
    el.loop = true;
    el.preload = 'auto';
    audioElements.set(channel.id, el);
  }

  el.volume = Math.max(0, Math.min(1, channel.volume * globalMasterVolume));

  if (isEngineActive && channel.enabled) {
    if (el.paused) {
      el.play().catch(() => {});
    }
  } else {
    if (!el.paused) {
      el.pause();
    }
  }
}

/**
 * Apply all channel settings
 */
export function applySoundChannels(channels: SoundChannel[]): void {
  const ctx = getOrCreateContext();

  channels.forEach((ch) => {
    if (ch.type === 'audio') {
      updateAudioElement(ch);
    }
  });

  // Manage Wind Chimes
  const chimeCh = channels.find((c) => c.id === 'windchime');
  if (chimeCh && chimeCh.enabled && isEngineActive) {
    if (!chimeInterval && ctx && masterGain) {
      playWindChime(ctx, masterGain, chimeCh.volume);
      chimeInterval = setInterval(() => {
        if (isEngineActive && ctx && masterGain) {
          playWindChime(ctx, masterGain, chimeCh.volume);
        }
      }, 5200);
    }
  } else {
    if (chimeInterval) {
      clearInterval(chimeInterval);
      chimeInterval = null;
    }
  }

  // Manage Piano
  const pianoCh = channels.find((c) => c.id === 'piano');
  if (pianoCh && pianoCh.enabled && isEngineActive) {
    if (!pianoInterval && ctx && masterGain) {
      playPianoArpeggio(ctx, masterGain, pianoCh.volume);
      pianoInterval = setInterval(() => {
        if (isEngineActive && ctx && masterGain) {
          playPianoArpeggio(ctx, masterGain, pianoCh.volume);
        }
      }, 4800);
    }
  } else {
    if (pianoInterval) {
      clearInterval(pianoInterval);
      pianoInterval = null;
    }
  }
}

/**
 * Start overall Zen Sound Engine
 */
export function startZenEngine(channels: SoundChannel[], masterVol = 0.8): void {
  isEngineActive = true;
  globalMasterVolume = masterVol;
  const ctx = getOrCreateContext();
  if (masterGain && ctx) {
    masterGain.gain.setValueAtTime(masterVol, ctx.currentTime);
  }
  applySoundChannels(channels);
}

/**
 * Stop all playing channels and reset intervals
 */
export function stopZenEngine(): void {
  isEngineActive = false;

  audioElements.forEach((el) => {
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      // ignore
    }
  });

  if (chimeInterval) {
    clearInterval(chimeInterval);
    chimeInterval = null;
  }

  if (pianoInterval) {
    clearInterval(pianoInterval);
    pianoInterval = null;
  }
}

/**
 * Set master volume
 */
export function setMasterVolume(vol: number, channels: SoundChannel[]): void {
  globalMasterVolume = Math.max(0, Math.min(1, vol));
  const ctx = getOrCreateContext();
  if (masterGain && ctx) {
    masterGain.gain.setValueAtTime(globalMasterVolume, ctx.currentTime);
  }
  applySoundChannels(channels);
}

export function isZenEngineActive(): boolean {
  return isEngineActive;
}

/**
 * Presets generator helper
 */
export function applyPresetToChannels(presetId: ZenPresetId, current: SoundChannel[]): SoundChannel[] {
  return current.map((ch) => {
    switch (presetId) {
      case 'morning': // Chim hót + Suối reo + Sáo du dương
        return {
          ...ch,
          enabled: ch.id === 'forest' || ch.id === 'river' || ch.id === 'flute_peaceful',
          volume: ch.id === 'flute_peaceful' ? 0.75 : ch.id === 'forest' ? 0.7 : 0.6,
        };
      case 'rainy_night': // Mưa rào + Sấm + Sáo Bồng Lai
        return {
          ...ch,
          enabled: ch.id === 'rain' || ch.id === 'thunder' || ch.id === 'flute_bonglai',
          volume: ch.id === 'rain' ? 0.8 : ch.id === 'thunder' ? 0.5 : 0.65,
        };
      case 'tranquil_stream': // Suối reo + Chuông gió + Sáo Bồng Lai
        return {
          ...ch,
          enabled: ch.id === 'river' || ch.id === 'windchime' || ch.id === 'flute_bonglai',
          volume: ch.id === 'flute_bonglai' ? 0.7 : ch.id === 'river' ? 0.75 : 0.55,
        };
      case 'deep_meditation': // Sáo Bồng Lai thật + Suối reo
        return {
          ...ch,
          enabled: ch.id === 'flute_bonglai' || ch.id === 'river',
          volume: ch.id === 'flute_bonglai' ? 0.85 : 0.5,
        };
      default:
        return ch;
    }
  });
}
