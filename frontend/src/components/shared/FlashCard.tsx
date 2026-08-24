import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import type { FlashcardItem } from '../../types/DeckType';

export interface FlashCardRef {
  flip: () => void;
  flipTo: (showBack: boolean) => void;
  toggleFlip: () => void;
  speak: () => void;
  isFlipped: () => boolean;
}

interface FlashCardProps {
  card: FlashcardItem;
  onFlipped: () => void;
}

const FlashCard = forwardRef<FlashCardRef, FlashCardProps>(function FlashCard(
  { card, onFlipped },
  ref
) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const speakWord = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const triggerFlip = useCallback(
    (targetFlipped?: boolean) => {
      setFlipped((prev) => {
        const next = targetFlipped !== undefined ? targetFlipped : !prev;
        if (next && !hasFlipped) {
          setHasFlipped(true);
          onFlipped();
        }
        return next;
      });
    },
    [hasFlipped, onFlipped]
  );

  useImperativeHandle(
    ref,
    () => ({
      flip: () => triggerFlip(),
      flipTo: (showBack: boolean) => triggerFlip(showBack),
      toggleFlip: () => triggerFlip(),
      speak: () => speakWord(card.front),
      isFlipped: () => flipped,
    }),
    [triggerFlip, speakWord, card.front, flipped]
  );

  return (
    <div
      className="relative cursor-pointer select-none group w-full max-w-lg h-[270px] sm:h-[300px]"
      style={{ perspective: '1200px' }}
      onClick={() => triggerFlip()}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Front (English) */}
        <div
          className="absolute inset-0 rounded-3xl flex flex-col items-center justify-between p-5 sm:p-7 text-white"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 20px 60px rgba(79,70,229,0.35)',
          }}
        >
          <div className="w-full flex items-center justify-between">
            <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              English
            </span>
            <span className="text-indigo-200/80 text-xs font-semibold flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">Space</kbd> {t('study_audio')}
            </span>
          </div>

          <div className="flex flex-col items-center my-auto">
            <h2
              className="text-white text-center leading-tight mb-2"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5.5vw, 3.2rem)', fontWeight: 800 }}
            >
              {card.front}
            </h2>
            {card.phonetic && (
              <p className="text-indigo-200 text-sm font-medium tracking-wide font-mono">
                {card.phonetic}
              </p>
            )}
            {card.exampleEn && (
              <p className="text-indigo-100/80 text-xs text-center italic mt-2 max-w-sm">
                "{card.exampleEn}"
              </p>
            )}
          </div>

          <div className="w-full flex items-center justify-between pt-2 border-t border-white/10">
            {/* Speaker button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakWord(card.front);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
              aria-label={`Pronounce ${card.front}`}
            >
              <AnimatePresence mode="wait">
                {speaking ? (
                  <motion.span
                    key="wave"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-end gap-[3px] h-4"
                  >
                    {[0, 0.1, 0.2].map((delay) => (
                      <motion.span
                        key={delay}
                        className="w-[3px] rounded-full bg-white"
                        animate={{ height: ['6px', '14px', '6px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
                      />
                    ))}
                  </motion.span>
                ) : (
                  <motion.span
                    key="icon"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <Volume2 size={15} className="text-white" />
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="text-white text-xs font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {speaking ? t('study_audio_playing') : t('study_audio')}
              </span>
            </button>

            <span className="text-indigo-200 text-xs flex items-center gap-1.5 font-medium">
              <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">↓</kbd> {t('study_flip_to_vi')}
            </span>
          </div>
        </div>

        {/* Back (Vietnamese) */}
        <div
          className="absolute inset-0 rounded-3xl flex flex-col items-center justify-between p-5 sm:p-7 bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-800 shadow-xl dark:shadow-black/40 text-slate-900 dark:text-white"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="w-full flex items-center justify-between">
            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60">
              Tiếng Việt
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{t('study_meaning')}</span>
          </div>

          <div className="flex flex-col items-center my-auto">
            <h2
              className="text-slate-900 dark:text-white text-center leading-tight mb-2"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 800 }}
            >
              {card.back}
            </h2>
            {card.exampleVi && (
              <p className="text-slate-500 dark:text-slate-400 text-xs text-center italic mt-2 max-w-sm">
                "{card.exampleVi}"
              </p>
            )}
          </div>

          <div className="w-full flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakWord(card.front);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 active:scale-95 transition-all cursor-pointer text-xs font-semibold"
            >
              <Volume2 size={14} />
              <span>{t('study_listen_again')}</span>
            </button>

            <span className="text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1.5 font-medium">
              <kbd className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-[10px] font-mono">↑</kbd> {t('study_flip_to_en')}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default FlashCard;
