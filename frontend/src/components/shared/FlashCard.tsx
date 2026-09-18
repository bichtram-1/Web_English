import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Star, Image as ImageIcon } from 'lucide-react';
import { cleanTtsText } from '../../hooks/useSpeech';
import type { FlashcardItem } from '../../types/DeckType';

export interface FlashCardRef {
  flip: (direction?: 'up' | 'down') => void;
  flipTo: (showBack: boolean, direction?: 'up' | 'down') => void;
  toggleFlip: (direction?: 'up' | 'down') => void;
  speak: () => void;
  isFlipped: () => boolean;
}

interface FlashCardProps {
  card: FlashcardItem;
  onFlipped?: (flipped: boolean) => void;
  isStarred?: boolean;
  onToggleStar?: () => void;
}

const FlashCard = forwardRef<FlashCardRef, FlashCardProps>(function FlashCard(
  { card, onFlipped, isStarred = false, onToggleStar },
  ref
) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [rotationX, setRotationX] = useState(0);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isBack = Math.abs(rotationX % 360) === 180;

  const speakWord = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleaned = cleanTtsText(text);
    if (!cleaned) return;
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    setRotationX(0);
    setHasFlipped(false);
    setImageError(false);
  }, [card.id, card.imageUrl]);

  const triggerFlip = useCallback(
    (direction: 'up' | 'down' = 'down') => {
      setRotationX((prev) => {
        const delta = direction === 'up' ? -180 : 180;
        const next = prev + delta;
        const nextFlipped = Math.abs(next % 360) === 180;
        if (nextFlipped && !hasFlipped) {
          setHasFlipped(true);
        }
        onFlipped?.(nextFlipped);
        return next;
      });
    },
    [hasFlipped, onFlipped]
  );

  const flipTo = useCallback(
    (showBack: boolean, direction?: 'up' | 'down') => {
      setRotationX((prev) => {
        const currentFlipped = Math.abs(prev % 360) === 180;
        if (currentFlipped === showBack) return prev;
        const dir = direction || (showBack ? 'down' : 'up');
        const delta = dir === 'up' ? -180 : 180;
        const next = prev + delta;
        onFlipped?.(showBack);
        return next;
      });
    },
    [onFlipped]
  );

  useImperativeHandle(
    ref,
    () => ({
      flip: (dir?: 'up' | 'down') => triggerFlip(dir),
      flipTo: (showBack: boolean, dir?: 'up' | 'down') => flipTo(showBack, dir),
      toggleFlip: (dir?: 'up' | 'down') => triggerFlip(dir),
      speak: () => speakWord(card.front),
      isFlipped: () => isBack,
    }),
    [triggerFlip, flipTo, speakWord, card.front, isBack]
  );

  return (
    <div
      className="relative cursor-pointer select-none group w-full max-w-lg md:max-w-2xl lg:max-w-3xl h-[280px] sm:h-[320px] md:h-[360px] lg:h-[390px]"
      style={{ perspective: '1200px' }}
      onClick={() => triggerFlip('down')}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateX: rotationX }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Front (English) */}
        <div
          className="absolute inset-0 rounded-3xl flex flex-col items-center justify-between p-5 sm:p-7 md:p-9 text-white"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 25px 65px rgba(79,70,229,0.38)',
            zIndex: isBack ? 1 : 2,
            pointerEvents: isBack ? 'none' : 'auto',
          }}
        >
          <div className="w-full flex items-center justify-between">
            <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm flex items-center gap-1.5">
              <span>{isVi ? 'Tiếng Anh' : 'English'}</span>
              {card.imageUrl && !imageError && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-100 bg-white/20 px-1.5 py-0.5 rounded-md"
                  title={isVi ? 'Có hình minh họa khi lật thẻ' : 'Has illustration image'}
                >
                  <ImageIcon size={10} />
                  <span>{isVi ? 'Ảnh' : 'Img'}</span>
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {onToggleStar && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar();
                  }}
                  className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    isStarred
                      ? 'bg-amber-400 text-amber-950 shadow-md scale-105 ring-2 ring-amber-300'
                      : 'bg-white/15 text-white/70 hover:text-white hover:bg-white/25'
                  }`}
                  title={isStarred ? (isVi ? 'Bỏ gắn sao thuật ngữ này' : 'Unstar this term') : (isVi ? 'Gán sao thuật ngữ này' : 'Star this term')}
                >
                  <Star size={15} className={isStarred ? 'fill-amber-900 text-amber-950' : ''} />
                </button>
              )}
              <span className="text-indigo-200/80 text-xs font-semibold flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">Space</kbd> {t('study_audio')}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center my-auto px-2">
            <h2
              className="text-white text-center leading-tight mb-2"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4.2vw, 3.6rem)', fontWeight: 800 }}
            >
              {card.front}
            </h2>
            {card.phonetic && (
              <p className="text-indigo-200 text-sm sm:text-base font-medium tracking-wide font-mono">
                {card.phonetic}
              </p>
            )}
            {card.exampleEn && (
              <p className="text-indigo-100/80 text-xs sm:text-sm text-center italic mt-2.5 max-w-md lg:max-w-xl">
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
              <span className="flex items-center gap-0.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">↓</kbd>
              </span>
              {t('study_flip_to_vi')}
            </span>
          </div>
        </div>

        {/* Back (Vietnamese) */}
        <div
          className="absolute inset-0 rounded-3xl flex flex-col items-center justify-between p-5 sm:p-7 md:p-9 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-indigo-100 dark:border-slate-800 shadow-2xl dark:shadow-black/50 text-slate-900 dark:text-white"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
            zIndex: isBack ? 2 : 1,
            pointerEvents: isBack ? 'auto' : 'none',
          }}
        >
          <div className="w-full flex items-center justify-between">
            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60">
              {isVi ? 'Tiếng Việt' : 'Vietnamese'}
            </span>
            <div className="flex items-center gap-2">
              {onToggleStar && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar();
                  }}
                  className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    isStarred
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-500 shadow-xs ring-2 ring-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                  title={isStarred ? (isVi ? 'Bỏ gắn sao thuật ngữ này' : 'Unstar this term') : (isVi ? 'Gán sao thuật ngữ này' : 'Star this term')}
                >
                  <Star size={15} className={isStarred ? 'fill-amber-400 text-amber-500' : ''} />
                </button>
              )}
              <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{t('study_meaning')}</span>
            </div>
          </div>

          <div className="flex flex-col items-center my-auto px-2 w-full max-h-[72%] overflow-hidden">
            {card.imageUrl && !imageError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="relative mb-2 sm:mb-2.5 shrink-0 group/cardimg"
              >
                <img
                  src={card.imageUrl}
                  alt={card.back || card.front}
                  onError={() => setImageError(true)}
                  className="h-20 sm:h-28 md:h-32 lg:h-36 max-h-[140px] w-auto max-w-[240px] sm:max-w-[320px] md:max-w-[380px] object-cover rounded-2xl shadow-md border border-indigo-100 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 transition-transform duration-200 group-hover/cardimg:scale-105"
                  loading="lazy"
                />
              </motion.div>
            )}
            <h2
              className="text-slate-900 dark:text-white text-center leading-tight mb-1"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: card.imageUrl && !imageError ? 'clamp(1.5rem, 2.8vw, 2.2rem)' : 'clamp(2rem, 3.8vw, 3.2rem)',
                fontWeight: 800,
              }}
            >
              {card.back}
            </h2>
            {card.exampleVi && (
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm text-center italic mt-1 max-w-md lg:max-w-xl line-clamp-2">
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
              <span className="flex items-center gap-0.5">
                <kbd className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-[10px] font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-[10px] font-mono">↓</kbd>
              </span>
              {t('study_flip_to_en')}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default FlashCard;
