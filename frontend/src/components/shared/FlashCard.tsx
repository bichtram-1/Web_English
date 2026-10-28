import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Star,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  ZoomIn,
  X,
  ChevronDown,
  RotateCw,
} from 'lucide-react';
import { cleanTtsText } from '../../hooks/useSpeech';
import { optimizeImageUrl } from '../../utils/imageCompressor';
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
  isMinimal?: boolean;
  onToggleFullscreen?: () => void;
}

interface TypographyConfig {
  fontSize: string;
  fontWeight: number;
  lineHeight: number | string;
}

/**
 * Quizlet-grade dynamic typography:
 * Automatically scales down font size as text length increases,
 * ensuring sentences and definitions fit comfortably without clipping.
 */
function getFrontTypography(text: string, isMinimal: boolean = false): TypographyConfig {
  const len = (text || '').trim().length;
  let fontSize = isMinimal ? 'clamp(2.4rem, 4.6vw, 4rem)' : 'clamp(2rem, 4vw, 3.4rem)';
  let fontWeight = 800;
  let lineHeight = 1.15;

  if (len > 180) {
    fontSize = isMinimal ? 'clamp(1.1rem, 1.8vw, 1.35rem)' : 'clamp(0.95rem, 1.5vw, 1.15rem)';
    fontWeight = 600;
    lineHeight = 1.5;
  } else if (len > 90) {
    fontSize = isMinimal ? 'clamp(1.25rem, 2.2vw, 1.6rem)' : 'clamp(1.05rem, 1.8vw, 1.35rem)';
    fontWeight = 650;
    lineHeight = 1.4;
  } else if (len > 40) {
    fontSize = isMinimal ? 'clamp(1.5rem, 2.8vw, 2.1rem)' : 'clamp(1.25rem, 2.4vw, 1.75rem)';
    fontWeight = 700;
    lineHeight = 1.3;
  } else if (len > 15) {
    fontSize = isMinimal ? 'clamp(1.85rem, 3.6vw, 2.8rem)' : 'clamp(1.55rem, 3.2vw, 2.35rem)';
    fontWeight = 750;
    lineHeight = 1.25;
  }

  return { fontSize, fontWeight, lineHeight };
}

function getBackTypography(text: string, hasImage: boolean, isMinimal: boolean = false): TypographyConfig {
  const len = (text || '').trim().length;
  let fontSize = isMinimal ? 'clamp(2.2rem, 4.4vw, 3.6rem)' : 'clamp(1.85rem, 3.8vw, 3rem)';
  let fontWeight = 800;
  let lineHeight = 1.2;

  if (hasImage) {
    if (len > 140) {
      fontSize = isMinimal ? 'clamp(1.05rem, 1.6vw, 1.3rem)' : 'clamp(0.9rem, 1.4vw, 1.12rem)';
      fontWeight = 600;
      lineHeight = 1.5;
    } else if (len > 70) {
      fontSize = isMinimal ? 'clamp(1.2rem, 2vw, 1.45rem)' : 'clamp(1rem, 1.7vw, 1.25rem)';
      fontWeight = 650;
      lineHeight = 1.4;
    } else if (len > 30) {
      fontSize = isMinimal ? 'clamp(1.35rem, 2.4vw, 1.8rem)' : 'clamp(1.15rem, 2.1vw, 1.55rem)';
      fontWeight = 700;
      lineHeight = 1.3;
    } else {
      fontSize = isMinimal ? 'clamp(1.6rem, 3vw, 2.2rem)' : 'clamp(1.35rem, 2.6vw, 1.9rem)';
      fontWeight = 750;
      lineHeight = 1.25;
    }
  } else {
    if (len > 220) {
      fontSize = isMinimal ? 'clamp(1.05rem, 1.6vw, 1.3rem)' : 'clamp(0.92rem, 1.4vw, 1.12rem)';
      fontWeight = 600;
      lineHeight = 1.55;
    } else if (len > 120) {
      fontSize = isMinimal ? 'clamp(1.2rem, 2vw, 1.5rem)' : 'clamp(1.02rem, 1.7vw, 1.3rem)';
      fontWeight = 650;
      lineHeight = 1.45;
    } else if (len > 55) {
      fontSize = isMinimal ? 'clamp(1.4rem, 2.6vw, 1.95rem)' : 'clamp(1.18rem, 2.2vw, 1.65rem)';
      fontWeight = 700;
      lineHeight = 1.35;
    } else if (len > 20) {
      fontSize = isMinimal ? 'clamp(1.75rem, 3.4vw, 2.6rem)' : 'clamp(1.45rem, 2.8vw, 2.25rem)';
      fontWeight = 750;
      lineHeight = 1.25;
    }
  }

  return { fontSize, fontWeight, lineHeight };
}

const FlashCard = forwardRef<FlashCardRef, FlashCardProps>(function FlashCard(
  {
    card,
    onFlipped,
    isStarred = false,
    onToggleStar,
    isMinimal = false,
    onToggleFullscreen,
  },
  ref
) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const [rotationX, setRotationX] = useState(0);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Lightbox for image preview
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);

  // Scroll tracking to show scroll-more indicators
  const frontScrollRef = useRef<HTMLDivElement>(null);
  const backScrollRef = useRef<HTMLDivElement>(null);
  const [frontCanScrollDown, setFrontCanScrollDown] = useState(false);
  const [backCanScrollDown, setBackCanScrollDown] = useState(false);
  const [frontHasScrolled, setFrontHasScrolled] = useState(false);
  const [backHasScrolled, setBackHasScrolled] = useState(false);

  // Drag / Scroll vs Click detection to avoid accidental flipping
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingOrScrolling = useRef(false);

  const isBack = Math.abs(rotationX % 360) === 180;
  const hasValidImage = Boolean(card.imageUrl && !imageError);

  const frontStyle = getFrontTypography(card.front, isMinimal);
  const backStyle = getBackTypography(card.back, hasValidImage, isMinimal);

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

  const checkScroll = useCallback(() => {
    if (frontScrollRef.current) {
      const el = frontScrollRef.current;
      const canDown = el.scrollHeight - el.scrollTop - el.clientHeight > 14;
      setFrontCanScrollDown(canDown);
      setFrontHasScrolled(el.scrollTop > 8);
    }
    if (backScrollRef.current) {
      const el = backScrollRef.current;
      const canDown = el.scrollHeight - el.scrollTop - el.clientHeight > 14;
      setBackCanScrollDown(canDown);
      setBackHasScrolled(el.scrollTop > 8);
    }
  }, []);

  useEffect(() => {
    setRotationX(0);
    setHasFlipped(false);
    setImageError(false);
    if (frontScrollRef.current) frontScrollRef.current.scrollTop = 0;
    if (backScrollRef.current) backScrollRef.current.scrollTop = 0;
    const timer = setTimeout(checkScroll, 60);
    return () => clearTimeout(timer);
  }, [card.id, card.imageUrl, card.front, card.back, checkScroll]);

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [rotationX, isMinimal, checkScroll]);

  // Handle ESC for lightbox cleanly (using capture phase so it doesn't trigger outer modals)
  useEffect(() => {
    if (!isImageLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setIsImageLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isImageLightboxOpen]);

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

  // Pointer drag detection to prevent flip when scrolling / swiping
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    isDraggingOrScrolling.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartPos.current) return;
    const dx = Math.abs(e.clientX - pointerStartPos.current.x);
    const dy = Math.abs(e.clientY - pointerStartPos.current.y);
    if (dx > 8 || dy > 8) {
      isDraggingOrScrolling.current = true;
    }
  };

  const handleCardClick = () => {
    if (isDraggingOrScrolling.current) {
      isDraggingOrScrolling.current = false;
      return;
    }
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 0) {
      return;
    }
    triggerFlip('down');
  };

  /**
   * Render the 3D flippable card body.
   * In minimal mode (isMinimal = true), footer buttons are hidden for clean focus.
   */
  const renderCardContent = () => (
    <motion.div
      className="relative w-full h-full"
      style={{ transformStyle: 'preserve-3d' }}
      animate={{ rotateX: rotationX }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* ============================================================ */}
      {/* Front Face (English)                                        */}
      {/* ============================================================ */}
      <div
        className="absolute inset-0 rounded-3xl flex flex-col justify-between p-4 sm:p-7 md:p-9 text-white overflow-hidden"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 25px 65px rgba(79,70,229,0.38)',
          zIndex: isBack ? 1 : 2,
          pointerEvents: isBack ? 'none' : 'auto',
        }}
      >
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between pb-2 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm flex items-center gap-1.5">
              <span>{isVi ? 'Tiếng Anh' : 'English'}</span>
              {hasValidImage && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-100 bg-white/20 px-1.5 py-0.5 rounded-md"
                  title={isVi ? 'Có hình minh họa khi lật thẻ' : 'Has illustration image'}
                >
                  <ImageIcon size={10} />
                  <span>{isVi ? 'Ảnh' : 'Img'}</span>
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen / Maximize toggle (only shown in normal view) */}
            {!isMinimal && onToggleFullscreen && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFullscreen();
                }}
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white/80 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                title={isVi ? 'Phóng to toàn màn hình' : 'Fullscreen card'}
              >
                <Maximize2 size={14} />
              </button>
            )}

            {/* Star toggle in normal view */}
            {!isMinimal && onToggleStar && (
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
                title={
                  isStarred
                    ? isVi
                      ? 'Bỏ gắn sao thuật ngữ này'
                      : 'Unstar this term'
                    : isVi
                    ? 'Gán sao thuật ngữ này'
                    : 'Star this term'
                }
              >
                <Star size={14} className={isStarred ? 'fill-amber-900 text-amber-950' : ''} />
              </button>
            )}

            {!isMinimal && (
              <span className="text-indigo-200/80 text-xs font-semibold hidden sm:flex items-center gap-1 pl-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">Space</kbd> {t('study_audio')}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Center Body */}
        <div className="relative flex-1 min-h-0 w-full flex flex-col my-1">
          {frontHasScrolled && (
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#5744e8] to-transparent z-10 pointer-events-none" />
          )}

          <div
            ref={frontScrollRef}
            onScroll={checkScroll}
            className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain px-2 sm:px-6 py-2 flex flex-col items-center flashcard-scrollbar"
          >
            <div className="my-auto w-full flex flex-col items-center text-center py-2">
              <h2
                className="text-white text-center leading-snug mb-2 whitespace-pre-line break-words max-w-full selection:bg-white/30"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: frontStyle.fontSize,
                  fontWeight: frontStyle.fontWeight,
                  lineHeight: frontStyle.lineHeight,
                }}
              >
                {card.front}
              </h2>

              {card.phonetic && (
                <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-indigo-100 text-xs sm:text-base font-medium tracking-wide font-mono mt-1 mb-1 shadow-2xs">
                  {card.phonetic}
                </div>
              )}

              {card.exampleEn && (
                <div className="w-full max-w-2xl mt-4 px-4 sm:px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 shadow-2xs text-left sm:text-center">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">
                    {isVi ? 'Ví dụ câu' : 'Example'}
                  </div>
                  <p className="text-white text-xs sm:text-base italic leading-relaxed whitespace-pre-line break-words selection:bg-white/30">
                    "{card.exampleEn}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {frontCanScrollDown && (
            <>
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#6e3ee0] to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 border border-white/20 animate-bounce shadow-md">
                  <ChevronDown size={11} />
                  <span>{t('study_scroll_more')}</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Bottom Footer: In Minimal/Fullscreen mode, colorful buttons are NOT rendered! */}
        {!isMinimal ? (
          <div className="w-full flex items-center justify-between pt-2 border-t border-white/10 shrink-0">
            <div className="flex items-center gap-2">
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

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent('open-ai-tutor', {
                      detail: {
                        tab: 'chat',
                        prompt: isVi
                          ? `Giải thích từ "${card.front}" kèm phiên âm IPA, nghĩa và câu ví dụ minh họa`
                          : `Explain the word "${card.front}" with IPA phonetics, definition, and example sentences`,
                      },
                    })
                  );
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer text-xs font-semibold"
                title={isVi ? `Hỏi AI Tutor về "${card.front}"` : `Ask AI Tutor about "${card.front}"`}
              >
                <Sparkles size={13} className="text-amber-300" />
                <span className="hidden sm:inline">{isVi ? 'Hỏi AI' : 'Ask AI'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerFlip('down');
              }}
              className="text-indigo-100 hover:text-white px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <RotateCw size={12} className="shrink-0" />
              <span>{t('study_flip_to_vi')}</span>
              <span className="hidden sm:inline-flex items-center gap-0.5 text-indigo-200">
                <kbd className="px-1 py-0.2 rounded bg-white/15 text-[10px] font-mono">↑↓</kbd>
              </span>
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between text-indigo-200/70 text-xs pt-2 border-t border-white/10 shrink-0 font-medium">
            <span>{isVi ? 'Phím cách: Phát âm' : 'Space: Pronounce'}</span>
            <span>{isVi ? 'Phím ↑ / ↓ hoặc Enter: Lật thẻ' : '↑ / ↓ or Enter: Flip'}</span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Back Face (Vietnamese)                                      */}
      {/* ============================================================ */}
      <div
        className="absolute inset-0 rounded-3xl flex flex-col justify-between p-4 sm:p-7 md:p-9 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-2 border-indigo-100 dark:border-slate-800 shadow-2xl dark:shadow-black/50 text-slate-900 dark:text-white overflow-hidden"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateX(180deg)',
          zIndex: isBack ? 2 : 1,
          pointerEvents: isBack ? 'auto' : 'none',
        }}
      >
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between pb-2 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60">
              {isVi ? 'Tiếng Việt' : 'Vietnamese'}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium hidden sm:inline">
              {t('study_meaning')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isMinimal && onToggleFullscreen && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFullscreen();
                }}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
                title={isVi ? 'Phóng to toàn màn hình' : 'Fullscreen card'}
              >
                <Maximize2 size={14} />
              </button>
            )}

            {!isMinimal && onToggleStar && (
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
                title={
                  isStarred
                    ? isVi
                      ? 'Bỏ gắn sao thuật ngữ này'
                      : 'Unstar this term'
                    : isVi
                    ? 'Gán sao thuật ngữ này'
                    : 'Star this term'
                }
              >
                <Star size={14} className={isStarred ? 'fill-amber-400 text-amber-500' : ''} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Center Body */}
        <div className="relative flex-1 min-h-0 w-full flex flex-col my-1">
          {backHasScrolled && (
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
          )}

          <div
            ref={backScrollRef}
            onScroll={checkScroll}
            className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain px-2 sm:px-6 py-2 flex flex-col items-center flashcard-scrollbar-dark"
          >
            <div className="my-auto w-full flex flex-col items-center text-center py-2">
              {hasValidImage && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsImageLightboxOpen(true);
                  }}
                  className="relative mb-3 group/cardimg cursor-zoom-in shrink-0"
                  title={isVi ? 'Bấm để phóng to xem hình ảnh rõ nét' : 'Click to view full image'}
                >
                  <img
                    src={optimizeImageUrl(card.imageUrl!, { width: 560, quality: 80 })}
                    alt={card.back || card.front}
                    onError={() => setImageError(true)}
                    className="h-20 sm:h-28 md:h-36 max-h-[150px] w-auto max-w-[260px] sm:max-w-[360px] object-cover rounded-2xl shadow-sm border border-indigo-100 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 transition-all duration-200 group-hover/cardimg:scale-105 group-hover/cardimg:shadow-md"
                    loading="lazy"
                  />
                  <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1 opacity-85 group-hover/cardimg:opacity-100 transition-opacity">
                    <ZoomIn size={11} />
                    <span>{isVi ? 'Xem ảnh' : 'Zoom'}</span>
                  </div>
                </div>
              )}

              <h2
                className="text-slate-900 dark:text-white text-center leading-snug mb-1 whitespace-pre-line break-words max-w-full selection:bg-indigo-100 dark:selection:bg-indigo-950"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: backStyle.fontSize,
                  fontWeight: backStyle.fontWeight,
                  lineHeight: backStyle.lineHeight,
                }}
              >
                {card.back}
              </h2>

              {card.exampleVi && (
                <div className="w-full max-w-2xl mt-3 px-4 sm:px-5 py-3 rounded-2xl bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100/80 dark:border-slate-700/60 shadow-2xs text-left sm:text-center">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1">
                    {isVi ? 'Ví dụ tiếng Việt' : 'Vietnamese Example'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-base italic leading-relaxed whitespace-pre-line break-words selection:bg-indigo-100 dark:selection:bg-indigo-950">
                    "{card.exampleVi}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {backCanScrollDown && (
            <>
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center gap-1 border border-indigo-200 dark:border-slate-700 animate-bounce shadow-sm">
                  <ChevronDown size={11} />
                  <span>{t('study_scroll_more')}</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Bottom Footer: In Minimal/Fullscreen mode, colorful buttons are NOT rendered! */}
        {!isMinimal ? (
          <div className="w-full flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
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

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent('open-ai-tutor', {
                      detail: {
                        tab: 'chat',
                        prompt: isVi
                          ? `Giải thích từ "${card.front}" (${card.back}) kèm phiên âm IPA, ngữ cảnh sử dụng và câu ví dụ minh họa`
                          : `Explain the word "${card.front}" (${card.back}) with IPA phonetics, usage context, and examples`,
                      },
                    })
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 active:scale-95 transition-all cursor-pointer text-xs font-semibold"
                title={isVi ? `Nhờ AI Tutor giải thích từ "${card.front}"` : `Ask AI Tutor about "${card.front}"`}
              >
                <Sparkles size={13} className="text-violet-500" />
                <span>{isVi ? 'Hỏi AI' : 'Ask AI'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerFlip('up');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <RotateCw size={12} className="shrink-0" />
              <span>{t('study_flip_to_en')}</span>
              <span className="hidden sm:inline-flex items-center gap-0.5 text-indigo-500 dark:text-indigo-400">
                <kbd className="px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/80 text-[10px] font-mono">↑↓</kbd>
              </span>
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between text-slate-400 dark:text-slate-500 text-xs pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0 font-medium">
            <span>{isVi ? 'Phím cách: Nghe lại' : 'Space: Listen again'}</span>
            <span>{isVi ? 'Phím ↑ / ↓ hoặc Enter: Lật thẻ' : '↑ / ↓ or Enter: Flip'}</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Flippable Card Container */}
      <div
        className={
          isMinimal
            ? 'relative cursor-pointer select-none w-full h-full'
            : 'relative cursor-pointer select-none group w-full max-w-lg md:max-w-2xl lg:max-w-3xl h-[320px] sm:h-[370px] md:h-[415px] lg:h-[450px]'
        }
        style={{ perspective: isMinimal ? '1400px' : '1200px' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={handleCardClick}
      >
        {renderCardContent()}
      </div>

      {/* Image Zoom Lightbox Modal */}
      <AnimatePresence>
        {isImageLightboxOpen && card.imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsImageLightboxOpen(false)}
            className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl max-h-[85vh] flex flex-col items-center bg-slate-900 rounded-3xl p-3 border border-white/10 shadow-2xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setIsImageLightboxOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer"
                title={t('study_close_zoom')}
              >
                <X size={18} />
              </button>

              <img
                src={card.imageUrl}
                alt={card.back || card.front}
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-2xl shadow-inner"
              />

              <div className="mt-3 text-center px-4 py-1">
                <div className="text-white text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {card.back}
                </div>
                <div className="text-slate-400 text-xs mt-0.5">{card.front}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default FlashCard;
