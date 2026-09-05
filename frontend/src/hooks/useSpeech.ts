import { useState, useCallback, useEffect, useRef } from 'react';

// Regex to detect Vietnamese characters
const VIETNAMESE_REGEX = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

// Function to clean text for speech synthesis (remove emojis, special symbols)
export function cleanTtsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[🐔🧠🎮🎨🚀🗣️✨🃏🎯🌿✍️🏴‍☠️💡]/gu, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find best matching voice for Vietnamese with priority on natural AI voices
 */
function getBestVietnameseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const viVoices = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('vi') ||
      v.lang.toLowerCase().includes('vi-vn') ||
      v.name.toLowerCase().includes('vietnam')
  );

  if (viVoices.length === 0) return undefined;

  // Priority 1: Natural / Neural online voices (Edge / Windows 11 HoaiMy, NamMinh)
  const naturalVoice = viVoices.find(
    (v) =>
      v.name.includes('Natural') ||
      v.name.includes('Online') ||
      v.name.toLowerCase().includes('hoaimy') ||
      v.name.toLowerCase().includes('namminh')
  );
  if (naturalVoice) return naturalVoice;

  // Priority 2: Google Vietnamese voice (Chrome)
  const googleVoice = viVoices.find((v) => v.name.toLowerCase().includes('google'));
  if (googleVoice) return googleVoice;

  // Priority 3: Apple / Siri / Mobile Vietnamese voices (Linh)
  const appleVoice = viVoices.find(
    (v) => v.name.toLowerCase().includes('linh') || v.name.toLowerCase().includes('siri')
  );
  if (appleVoice) return appleVoice;

  // Priority 4: Any other voice except outdated SAPI5 "Microsoft An" if alternatives exist
  const betterVoice = viVoices.find((v) => !v.name.toLowerCase().includes('an '));
  if (betterVoice) return betterVoice;

  return viVoices[0];
}

/**
 * Find best matching voice for English
 */
function getBestEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const enVoices = voices.filter(
    (v) => v.lang.toLowerCase().startsWith('en') || v.lang.toLowerCase().includes('en-us')
  );

  if (enVoices.length === 0) return undefined;

  const naturalVoice = enVoices.find(
    (v) =>
      v.name.includes('Natural') ||
      v.name.includes('Online') ||
      v.name.toLowerCase().includes('google')
  );
  if (naturalVoice) return naturalVoice;

  const standardVoice = enVoices.find((v) => !v.name.includes('David Desktop'));
  return standardVoice || enVoices[0];
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  const stop = useCallback(() => {
    // Stop any active Google TTS audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {
        // ignore
      }
      currentAudioRef.current = null;
    }

    // Stop Web Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
  }, []);

  const speakWithSynthesis = useCallback((cleanedText: string, lang: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = lang;

    // IMPORTANT: Keep pitch exactly at 1.0 for Vietnamese to preserve natural tonal contours (F0)
    // Changing pitch on tonal languages breaks tones (huyền, sắc, hỏi, ngã, nặng)
    utterance.pitch = 1.0;
    utterance.rate = lang.startsWith('vi') ? 0.95 : 0.9;

    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (lang.startsWith('vi')) {
        const viVoice = getBestVietnameseVoice(voices);
        if (viVoice) {
          utterance.voice = viVoice;
        }
      } else {
        const enVoice = getBestEnglishVoice(voices);
        if (enVoice) {
          utterance.voice = enVoice;
        }
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback((text: string, preferredLang?: string) => {
    stop();

    const cleanedText = cleanTtsText(text);
    if (!cleanedText) return;

    // Auto-detect Vietnamese vs English
    let lang = preferredLang;
    if (!lang) {
      lang = VIETNAMESE_REGEX.test(cleanedText) ? 'vi-VN' : 'en-US';
    } else if (lang === 'en-US' && VIETNAMESE_REGEX.test(cleanedText)) {
      lang = 'vi-VN';
    }

    // If Vietnamese text is within safe URL length (< 200 chars), try high-quality Google TTS Audio first
    // This provides natural 100% human-like Vietnamese pronunciation
    if (lang.startsWith('vi') && cleanedText.length <= 180) {
      try {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanedText)}&tl=vi&client=tw-ob`;
        const audio = new Audio(ttsUrl);
        audio.playbackRate = 1.0;

        audio.onplay = () => {
          setIsSpeaking(true);
        };
        audio.onended = () => {
          setIsSpeaking(false);
          currentAudioRef.current = null;
        };
        audio.onerror = () => {
          // If network error, fallback to browser SpeechSynthesis
          currentAudioRef.current = null;
          speakWithSynthesis(cleanedText, lang);
        };

        currentAudioRef.current = audio;
        audio.play().catch(() => {
          // If playback blocked (e.g. autoplay policy), fallback to SpeechSynthesis
          currentAudioRef.current = null;
          speakWithSynthesis(cleanedText, lang);
        });
        return;
      } catch (e) {
        // Fallback to SpeechSynthesis
        speakWithSynthesis(cleanedText, lang);
        return;
      }
    }

    // Default to SpeechSynthesis for long text or English
    speakWithSynthesis(cleanedText, lang);
  }, [stop, speakWithSynthesis]);

  return { speak, stop, isSpeaking };
}

export default useSpeech;
