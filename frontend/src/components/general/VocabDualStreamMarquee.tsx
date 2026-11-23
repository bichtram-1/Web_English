import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Volume2,
  Sparkles,
  Image as ImageIcon,
  Layers,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Deck, FlashcardItem } from '../../types/DeckType';
import { getStoredDecks } from '../../api/deckApi';
import { cleanTtsText } from '../../hooks/useSpeech';

export interface StreamCardItem extends FlashcardItem {
  deckTitle?: string;
  deckId?: string;
}

// Fisher-Yates random shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Safely format and validate meaning to prevent breaking layout:
 * - Strips linebreaks
 * - If text is long (> 36 chars), picks the primary synonym before '/' or ';'
 * - Filters out long paragraphs / explanations (> 50 chars)
 */
function sanitizeMeaning(raw: string, maxLen: number = 36): string | null {
  if (!raw) return null;
  const singleLine = raw.replace(/[\r\n\t]+/g, ' ').trim();
  if (singleLine.length <= maxLen) return singleLine;

  const parts = singleLine.split(/[/;]/);
  if (parts.length > 1) {
    const firstPart = parts[0].trim();
    if (firstPart.length > 0 && firstPart.length <= maxLen) {
      return firstPart;
    }
  }

  if (singleLine.length > 50) {
    return null;
  }

  return singleLine.slice(0, maxLen - 1).trim() + '…';
}

/**
 * Hook providing smooth auto-scrolling with bidirectional swipe / drag capabilities.
 * Supports:
 * - Desktop: Click-and-drag mouse navigation, trackpad horizontal swipe, scroll buttons
 * - Mobile: Native inertia touch swiping (touch-action: pan-y)
 * - Seamless infinite wrapping forward & backward
 */
function useSwipeableMarquee({
  speed = 0.4,
  isPaused = false,
}: {
  speed?: number;
  isPaused?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const scrollPosRef = useRef<number>(0);

  // Initialize scroll position to 1/3 (middle section) on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const initScroll = () => {
      if (el.scrollWidth > el.clientWidth && el.scrollWidth > 300) {
        const oneThird = el.scrollWidth / 3;
        el.scrollLeft = oneThird;
        scrollPosRef.current = oneThird;
      }
    };

    const timer = setTimeout(initScroll, 80);
    return () => clearTimeout(timer);
  }, []);

  // Seamless infinite loop wrap on scroll
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const oneThird = el.scrollWidth / 3;
    if (oneThird <= 100) return;

    scrollPosRef.current = el.scrollLeft;

    // If scrolled past 2/3 of the track, wrap back to 1/3 seamlessly
    if (el.scrollLeft >= oneThird * 2) {
      el.scrollLeft -= oneThird;
      scrollPosRef.current = el.scrollLeft;
      if (isDraggingRef.current) {
        startScrollLeftRef.current -= oneThird;
      }
    }
    // If swiped backward towards 0, wrap forward to 1/3 seamlessly
    else if (el.scrollLeft <= 30) {
      el.scrollLeft += oneThird;
      scrollPosRef.current = el.scrollLeft;
      if (isDraggingRef.current) {
        startScrollLeftRef.current += oneThird;
      }
    }
  }, []);

  // Auto-scroll loop via requestAnimationFrame
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      const el = containerRef.current;
      if (el && !isPaused && !isInteractingRef.current) {
        const delta = (speed * dt) / 16.67;
        scrollPosRef.current += delta;
        el.scrollLeft = scrollPosRef.current;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [speed, isPaused]);

  // Touch handlers for Mobile
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isInteractingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.touches[0].clientX;
    const el = containerRef.current;
    if (el) startScrollLeftRef.current = el.scrollLeft;

    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    if (Math.abs(dx) > 6) {
      hasDraggedRef.current = true;
      isInteractingRef.current = true;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 120);

    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2200);
  }, []);

  // Mouse Drag handlers for Desktop
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = containerRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    hasDraggedRef.current = false;
    isInteractingRef.current = true;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = el.scrollLeft;

    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 6) {
      hasDraggedRef.current = true;
    }

    el.scrollLeft = startScrollLeftRef.current - dx;
    scrollPosRef.current = el.scrollLeft;
  }, []);

  const onMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 120);

    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2000);
  }, []);

  // Trackpad / Wheel scroll support
  const onWheel = useCallback(() => {
    isInteractingRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2000);
  }, []);

  // Smooth scroll button
  const scrollBy = useCallback((amount: number) => {
    const el = containerRef.current;
    if (!el) return;

    isInteractingRef.current = true;
    el.scrollBy({ left: amount, behavior: 'smooth' });

    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2200);
  }, []);

  // Check if click is valid (not a drag gesture)
  const isClickSafe = useCallback(() => {
    return !hasDraggedRef.current && !isDraggingRef.current;
  }, []);

  return {
    containerRef,
    isDragging,
    scrollBy,
    isClickSafe,
    handlers: {
      onScroll: handleScroll,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
      onWheel,
    },
  };
}

interface VocabDualStreamMarqueeProps {
  decks: Deck[];
  isVi?: boolean;
}

export default function VocabDualStreamMarquee({ decks, isVi = true }: VocabDualStreamMarqueeProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const appName = t('app_name') || 'LinguaLeap';

  // Mobile / Desktop active card state (when a card is clicked/tapped to rotate forward)
  const [activeCardId, setActiveCardId] = useState<number | string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  // Play TTS audio
  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleaned = cleanTtsText(text);
      if (!cleaned) return;
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      setSpeakingWord(text);
      utterance.onend = () => setSpeakingWord(null);
      utterance.onerror = () => setSpeakingWord(null);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingWord(null);
    }
  };

  // Extract all authentic flashcards across ALL different decks in database & storage
  // Strictly partitions:
  // - TẦNG 1: Cards without images (Text-only)
  // - TẦNG 2: Cards with images (Visual cards)
  const { allImageCards, allTextCards } = useMemo(() => {
    const stored = getStoredDecks();
    const combinedDecksMap = new Map<string, Deck>();

    (stored || []).forEach((d) => {
      if (d?.id) combinedDecksMap.set(d.id, d);
    });

    (decks || []).forEach((d) => {
      if (d?.id) {
        const existing = combinedDecksMap.get(d.id);
        if (!existing || (d.cards && d.cards.length > (existing.cards?.length || 0))) {
          combinedDecksMap.set(d.id, d);
        }
      }
    });

    const uniqueWordsMap = new Map<string, StreamCardItem>();

    combinedDecksMap.forEach((deck) => {
      if (deck.isPublic === false) return;

      const deckTitle = deck.title || '';
      (deck.cards || []).forEach((card) => {
        if (card.type === 'flashcard' && card.front && card.back) {
          const front = card.front.trim();
          if (!front || front.length > 25) return;

          const cleanBack = sanitizeMeaning(card.back, 36);
          if (!cleanBack) return;

          const sanitizedCard: StreamCardItem = {
            ...card,
            front,
            back: cleanBack,
            deckTitle,
            deckId: deck.id,
          };

          const key = front.toLowerCase();
          const existing = uniqueWordsMap.get(key);

          if (!existing || (!existing.imageUrl && sanitizedCard.imageUrl)) {
            uniqueWordsMap.set(key, sanitizedCard);
          }
        }
      });
    });

    const imagePool: StreamCardItem[] = [];
    const textPool: StreamCardItem[] = [];

    uniqueWordsMap.forEach((card) => {
      if (card.imageUrl && card.imageUrl.trim() !== '') {
        imagePool.push(card);
      } else {
        textPool.push(card);
      }
    });

    return {
      allImageCards: imagePool,
      allTextCards: textPool,
    };
  }, [decks]);

  // Mix and Randomize cards dynamically across all decks on mount
  // Triples the batch for seamless infinite bidirectional scrolling
  const { randomImageCards, randomTextCards } = useMemo(() => {
    const shuffledImg = shuffleArray(allImageCards);
    const shuffledTxt = shuffleArray(allTextCards);

    let baseTxt: StreamCardItem[] = [];
    if (shuffledTxt.length > 0) {
      const batchCount = Math.min(shuffledTxt.length, 16);
      let batch = shuffledTxt.slice(0, batchCount);
      while (batch.length < 10) {
        batch = [...batch, ...batch];
      }
      baseTxt = batch;
    }

    let baseImg: StreamCardItem[] = [];
    if (shuffledImg.length > 0) {
      const sliceCount = Math.min(shuffledImg.length, 8);
      let batch = shuffledImg.slice(0, sliceCount);
      while (batch.length < 6) {
        batch = [...batch, ...batch];
      }
      baseImg = batch;
    }

    // Triple arrays ([...base, ...base, ...base]) for infinite bidirectional loop
    const loopTxt = baseTxt.length > 0 ? [...baseTxt, ...baseTxt, ...baseTxt] : [];
    const loopImg = baseImg.length > 0 ? [...baseImg, ...baseImg, ...baseImg] : [];

    return {
      randomImageCards: loopImg,
      randomTextCards: loopTxt,
    };
  }, [allImageCards, allTextCards]);

  const isPaused = isHovered || activeCardId !== null;

  // TẦNG 1 Controller: dải chữ trôi mỏng
  const tier1 = useSwipeableMarquee({
    speed: 0.35,
    isPaused,
  });

  // TẦNG 2 Controller: giá thẻ hình ảnh 3D
  const tier2 = useSwipeableMarquee({
    speed: 0.42,
    isPaused,
  });

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-indigo-500/30 dark:border-indigo-400/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white select-none transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveCardId(null);
      }}
    >
      {/* Background glow effects */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER BAR: Word Runway Title & Brand Accent */}
      <div className="relative z-10 px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-white/10 bg-white/[0.02] backdrop-blur-md">
        {/* Left: Runway Title */}
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-amber-400 animate-pulse shrink-0" />
          <h2
            className="text-xs sm:text-sm font-black tracking-wide text-indigo-100 uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isVi ? 'SÀN DIỄN TỪ VỰNG' : 'WORD RUNWAY'}
          </h2>
        </div>

        {/* Right: Brand Text */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs sm:text-sm font-black tracking-tight text-shimmer-purple"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {appName}
          </span>
        </div>
      </div>

      {/* TẦNG 1: DẢI CHỮ TRÔI MỎNG (Dành riêng cho thẻ KHÔNG CÓ HÌNH - Vuốt / kéo qua lại 2 chiều) */}
      {randomTextCards.length > 0 && (
        <div className="relative group/tier1 py-2 border-b border-white/10 bg-slate-950/40 backdrop-blur-sm">
          {/* Left & Right gradient fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-r from-indigo-950 to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-l from-slate-950 to-transparent" />

          {/* Desktop Navigation Buttons on Hover */}
          <button
            type="button"
            onClick={() => tier1.scrollBy(-260)}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-slate-900/85 hover:bg-indigo-600 text-white/80 hover:text-white items-center justify-center backdrop-blur-md border border-white/20 shadow-lg opacity-0 group-hover/tier1:opacity-100 transition-all cursor-pointer active:scale-90"
            title={isVi ? 'Xem lại từ vừa trôi qua' : 'Scroll left'}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => tier1.scrollBy(260)}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-slate-900/85 hover:bg-indigo-600 text-white/80 hover:text-white items-center justify-center backdrop-blur-md border border-white/20 shadow-lg opacity-0 group-hover/tier1:opacity-100 transition-all cursor-pointer active:scale-90"
            title={isVi ? 'Xem tiếp từ phía trước' : 'Scroll right'}
          >
            <ChevronRight size={14} />
          </button>

          {/* Swipeable & Draggable Scroll Track */}
          <div
            ref={tier1.containerRef}
            {...tier1.handlers}
            className={`overflow-x-auto scrollbar-none px-4 flex items-center gap-6 whitespace-nowrap will-change-scroll ${
              tier1.isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              touchAction: 'pan-x pan-y',
            }}
          >
            {randomTextCards.map((card, idx) => (
              <div
                key={`text-${card.id}-${idx}`}
                onClick={() => {
                  if (!tier1.isClickSafe()) return;
                  handleSpeak(card.front);
                }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.16] border border-white/10 transition-all cursor-pointer group shrink-0 active:scale-95 select-none"
                title={isVi ? `Bấm để nghe phát âm "${card.front}"` : `Click to listen to "${card.front}"`}
              >
                <span className="font-extrabold text-xs text-white group-hover:text-amber-300 transition-colors">
                  {card.front}
                </span>
                {card.phonetic && (
                  <span className="text-[11px] text-amber-300/80 font-mono">
                    {card.phonetic}
                  </span>
                )}
                <span className="text-white/30 text-xs">—</span>
                <span className="text-[11px] text-slate-300 font-medium max-w-[200px] truncate">
                  {card.back}
                </span>
                <Volume2
                  size={11}
                  className={`text-slate-400 group-hover:text-amber-300 transition-colors ml-0.5 ${
                    speakingWord === card.front ? 'text-amber-400 animate-pulse' : 'opacity-60 group-hover:opacity-100'
                  }`}
                />
                {card.deckId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!tier1.isClickSafe()) return;
                      navigate(`/deck/${card.deckId}`);
                    }}
                    className="p-0.5 text-slate-400 hover:text-amber-300 transition-all opacity-40 group-hover:opacity-100 hover:scale-110 ml-0.5"
                    title={isVi ? `Đi tới bộ thẻ: "${card.deckTitle || ''}"` : `Go to deck: "${card.deckTitle || ''}"`}
                  >
                    <ExternalLink size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TẦNG 2: GIÁ THẺ HÌNH ẢNH 3D (Dành riêng cho thẻ CÓ HÌNH - Vuốt / kéo qua lại 2 chiều) */}
      <div className="relative group/tier2 py-3.5 px-2 min-h-[175px] flex items-center">
        {/* Left & Right gradient fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-14 z-20 pointer-events-none bg-gradient-to-r from-indigo-950 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-14 z-20 pointer-events-none bg-gradient-to-l from-slate-950 to-transparent" />

        {/* Desktop Navigation Buttons on Hover */}
        {randomImageCards.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => tier2.scrollBy(-320)}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-900/85 hover:bg-indigo-600 text-white/80 hover:text-white items-center justify-center backdrop-blur-md border border-white/20 shadow-lg opacity-0 group-hover/tier2:opacity-100 transition-all cursor-pointer active:scale-90"
              title={isVi ? 'Xem lại từ vừa trôi qua' : 'Scroll left'}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => tier2.scrollBy(320)}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-900/85 hover:bg-indigo-600 text-white/80 hover:text-white items-center justify-center backdrop-blur-md border border-white/20 shadow-lg opacity-0 group-hover/tier2:opacity-100 transition-all cursor-pointer active:scale-90"
              title={isVi ? 'Xem tiếp từ phía trước' : 'Scroll right'}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {randomImageCards.length > 0 ? (
          <div
            ref={tier2.containerRef}
            {...tier2.handlers}
            className={`w-full overflow-x-auto scrollbar-none px-4 flex items-center gap-3.5 whitespace-nowrap will-change-scroll py-2 ${
              tier2.isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              touchAction: 'pan-x pan-y',
              perspective: '1000px',
            }}
          >
            {randomImageCards.map((card, idx) => {
              const isSelected = activeCardId === `${card.id}-${idx}`;

              return (
                <div
                  key={`img-${card.id}-${idx}`}
                  onClick={() => {
                    if (!tier2.isClickSafe()) return;
                    const idKey = `${card.id}-${idx}`;
                    if (activeCardId === idKey) {
                      setActiveCardId(null);
                    } else {
                      setActiveCardId(idKey);
                      handleSpeak(card.front);
                    }
                  }}
                  className={`group relative rounded-2xl cursor-pointer transition-all duration-300 shrink-0 select-none ${
                    isSelected
                      ? 'w-64 sm:w-72 z-30 ring-2 ring-amber-400 shadow-2xl shadow-indigo-500/50 bg-slate-900'
                      : 'w-16 sm:w-20 hover:w-64 sm:hover:w-72 hover:z-30 hover:ring-2 hover:ring-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/50 bg-slate-900/90'
                  } border border-white/15 overflow-hidden`}
                  style={{
                    height: '160px',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* 1. COLLAPSED VIEW: Thấy cạnh mỏng của thẻ bài khi chưa hover/tap */}
                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-between p-2 transition-opacity duration-300 ${
                      isSelected ? 'opacity-0 pointer-events-none' : 'opacity-100 group-hover:opacity-0 group-hover:pointer-events-none'
                    }`}
                    style={{
                      transform: 'perspective(600px) rotateY(-20deg)',
                      transformOrigin: 'left center',
                    }}
                  >
                    {/* Slim Image Edge Banner */}
                    <div className="w-full h-16 rounded-xl overflow-hidden relative border border-white/10 shadow-inner bg-slate-950">
                      <img
                        src={card.imageUrl}
                        alt={card.front}
                        className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all pointer-events-none"
                        loading="lazy"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-indigo-900/30 backdrop-blur-[1px]" />
                    </div>

                    {/* Vertical / Truncated Title Preview */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-0.5">
                      <span className="font-black text-[11px] sm:text-xs text-white tracking-wider truncate w-14 sm:w-16">
                        {card.front}
                      </span>
                      {card.phonetic && (
                        <span className="text-[9px] text-amber-300/90 font-mono truncate w-14 sm:w-16">
                          {card.phonetic}
                        </span>
                      )}
                    </div>

                    {/* Bottom indicator hint */}
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse mb-0.5" />
                  </div>

                  {/* 2. EXPANDED VIEW: Tấm thẻ QUAY NGANG RA CHÍNH DIỆN để xem hình to & chữ */}
                  <div
                    className={`absolute inset-0 p-2.5 flex flex-col justify-between bg-gradient-to-b from-slate-800 to-slate-950 transition-all duration-300 ${
                      isSelected ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
                    }`}
                  >
                    {/* Full Image with Ambient Blur Backdrop + Deck Badge */}
                    <div className="w-full h-24 rounded-xl overflow-hidden relative border border-white/10 shadow-md bg-slate-950">
                      <img
                        src={card.imageUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover filter blur-md opacity-35 scale-110 pointer-events-none"
                        draggable={false}
                      />
                      <img
                        src={card.imageUrl}
                        alt={card.front}
                        className="relative z-1 w-full h-full object-contain p-1 pointer-events-none"
                        draggable={false}
                      />

                      {/* Clickable Deck Badge in Top-Left */}
                      {card.deckTitle && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!tier2.isClickSafe()) return;
                            if (card.deckId) navigate(`/deck/${card.deckId}`);
                          }}
                          className="absolute z-10 top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/70 hover:bg-indigo-600 backdrop-blur-md text-[9px] text-amber-200 hover:text-white font-semibold max-w-[130px] truncate border border-white/20 transition-all flex items-center gap-1 cursor-pointer group/deck shadow-sm"
                          title={isVi ? `Đi tới bộ thẻ: "${card.deckTitle}"` : `Go to deck: "${card.deckTitle}"`}
                        >
                          <span className="truncate">{card.deckTitle}</span>
                          <ExternalLink size={9} className="opacity-70 group-hover/deck:opacity-100 shrink-0" />
                        </button>
                      )}

                      <div className="absolute z-10 top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white/90 flex items-center gap-1 border border-white/20 pointer-events-none">
                        <ImageIcon size={10} className="text-amber-400" />
                        <span>{isVi ? 'Hình ảnh' : 'Photo'}</span>
                      </div>
                    </div>

                    {/* Card Details: Word, Phonetic, Meaning, Audio & Go to Deck */}
                    <div className="flex items-center justify-between gap-1.5 pt-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-sm text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>
                            {card.front}
                          </span>
                          {card.phonetic && (
                            <span className="text-[10px] text-amber-300 font-mono shrink-0">
                              {card.phonetic}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium truncate" title={card.back}>
                          {card.back}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Audio TTS button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            if (!tier2.isClickSafe()) return;
                            handleSpeak(card.front, e);
                          }}
                          className="w-7 h-7 rounded-xl bg-indigo-600 hover:bg-amber-400 hover:text-slate-950 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                          title={isVi ? 'Nghe phát âm' : 'Listen'}
                        >
                          <Volume2
                            size={13}
                            className={speakingWord === card.front ? 'animate-bounce text-amber-300' : ''}
                          />
                        </button>

                        {/* Direct Go-to-Deck action button */}
                        {card.deckId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!tier2.isClickSafe()) return;
                              navigate(`/deck/${card.deckId}`);
                            }}
                            className="w-7 h-7 rounded-xl bg-white/10 hover:bg-indigo-600 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border border-white/10"
                            title={isVi ? `Đi tới bộ thẻ: "${card.deckTitle || ''}"` : `Go to deck: "${card.deckTitle || ''}"`}
                          >
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full py-6 flex flex-col items-center justify-center text-center px-4 text-slate-400">
            <Layers size={24} className="text-indigo-400/60 mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              {isVi
                ? 'Chưa có thẻ nào có hình ảnh trong các bộ thẻ của bạn.'
                : 'No cards with images found in your decks.'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {isVi
                ? 'Hãy thêm hình ảnh khi tạo hoặc sửa thẻ để kích hoạt băng chuyền 3D nhé!'
                : 'Add images when creating or editing flashcards to activate the 3D visual carousel!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
