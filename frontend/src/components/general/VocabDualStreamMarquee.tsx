import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Volume2, Sparkles, Image as ImageIcon, Layers, ExternalLink } from 'lucide-react';
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

  // If slash or semicolon exists, take the primary concise definition
  const parts = singleLine.split(/[/;]/);
  if (parts.length > 1) {
    const firstPart = parts[0].trim();
    if (firstPart.length > 0 && firstPart.length <= maxLen) {
      return firstPart;
    }
  }

  // Reject overly long paragraphs or sentences entirely
  if (singleLine.length > 50) {
    return null;
  }

  return singleLine.slice(0, maxLen - 1).trim() + '…';
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
      // BẢO MẬT QUYỀN RIÊNG TƯ: Chỉ lấy từ vựng từ các bộ thẻ CÔNG KHAI (isPublic !== false)
      if (deck.isPublic === false) return;

      const deckTitle = deck.title || '';
      (deck.cards || []).forEach((card) => {
        if (card.type === 'flashcard' && card.front && card.back) {
          const front = card.front.trim();
          // Filter word length (words/short phrases <= 25 characters to prevent layout breaking)
          if (!front || front.length > 25) return;

          // Filter & sanitize meaning length (under 36 chars)
          const cleanBack = sanitizeMeaning(card.back, 36);
          if (!cleanBack) return; // Drop card if meaning is too long or paragraph

          const sanitizedCard: StreamCardItem = {
            ...card,
            front,
            back: cleanBack,
            deckTitle,
            deckId: deck.id,
          };

          const key = front.toLowerCase();
          const existing = uniqueWordsMap.get(key);

          // If new or upgrade to an image version, save it
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
        // TẦNG 2: Thẻ có hình ảnh thực sự
        imagePool.push(card);
      } else {
        // TẦNG 1: Thẻ chỉ có chữ (không có hình ảnh)
        textPool.push(card);
      }
    });

    return {
      allImageCards: imagePool,
      allTextCards: textPool,
    };
  }, [decks]);

  // Mix and Randomize cards dynamically across all decks on mount
  const { randomImageCards, randomTextCards } = useMemo(() => {
    // Shuffle cards from different decks together
    const shuffledImg = shuffleArray(allImageCards);
    const shuffledTxt = shuffleArray(allTextCards);

    // Pick a gentle batch of 12-14 random cards per session to prevent oversized track width & fast scrolling
    let loopTxt: StreamCardItem[] = [];
    if (shuffledTxt.length > 0) {
      const batch = shuffledTxt.slice(0, 14);
      loopTxt = [...batch];
      while (loopTxt.length < 10) {
        loopTxt = [...loopTxt, ...batch];
      }
      loopTxt = [...loopTxt, ...loopTxt]; // Duplicate for 50% translateX loop
    }

    // Pick 6-7 random visual cards for 3D rack so each visit shows a distinctly different set
    let loopImg: StreamCardItem[] = [];
    if (shuffledImg.length > 0) {
      const sliceCount = Math.min(shuffledImg.length, 6);
      const batch = shuffledImg.slice(0, sliceCount);
      loopImg = [...batch];
      while (loopImg.length < 8) {
        loopImg = [...loopImg, ...batch];
      }
      loopImg = [...loopImg, ...loopImg]; // Duplicate for 50% translateX loop
    }

    return {
      randomImageCards: loopImg,
      randomTextCards: loopTxt,
    };
  }, [allImageCards, allTextCards]);

  const isPaused = isHovered || activeCardId !== null;

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-indigo-500/30 dark:border-indigo-400/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white select-none transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveCardId(null);
      }}
      onTouchStart={() => setIsHovered(true)}
    >
      {/* Background glow effects */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER BAR: Word Runway Title & Brand Accent */}
      <div className="relative z-10 px-4 sm:px-6 py-2 flex items-center justify-between border-b border-white/10 bg-white/[0.02] backdrop-blur-md">
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

        {/* Right: Shimmering Purple-Pink Brand Text */}
        <div className="flex items-center">
          <span
            className="text-xs sm:text-sm font-black tracking-tight text-shimmer-purple"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {appName}
          </span>
        </div>
      </div>

      {/* TẦNG 1: DẢI CHỮ TRÔI MỎNG (Dành riêng cho thẻ KHÔNG CÓ HÌNH - Xáo trộn ngẫu nhiên nhiều bộ thẻ) */}
      {randomTextCards.length > 0 && (
        <div className="relative py-2 border-b border-white/10 bg-slate-950/40 backdrop-blur-sm overflow-hidden">
          {/* Left & Right gradient fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-r from-indigo-950 to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-l from-slate-950 to-transparent" />

          <div
            className={`flex items-center gap-6 whitespace-nowrap will-change-transform ${
              isPaused ? 'vocab-marquee-paused' : 'vocab-marquee-track-fast'
            }`}
            style={{
              width: 'max-content',
              animationDuration: `${Math.max(120, (randomTextCards.length / 2) * 10)}s`,
            }}
          >
            {randomTextCards.map((card, idx) => (
              <div
                key={`text-${card.id}-${idx}`}
                onClick={() => handleSpeak(card.front)}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.16] border border-white/10 transition-all cursor-pointer group shrink-0 active:scale-95"
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

      {/* TẦNG 2: GIÁ THẺ HÌNH ẢNH 3D (Dành riêng cho thẻ CÓ HÌNH - Xáo trộn ngẫu nhiên nhiều bộ thẻ) */}
      <div className="relative py-3.5 px-2 overflow-hidden min-h-[175px] flex items-center">
        {/* Left & Right gradient fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-14 z-20 pointer-events-none bg-gradient-to-r from-indigo-950 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-14 z-20 pointer-events-none bg-gradient-to-l from-slate-950 to-transparent" />

        {randomImageCards.length > 0 ? (
          <div
            className={`flex items-center gap-3.5 whitespace-nowrap will-change-transform py-2 ${
              isPaused ? 'vocab-marquee-paused' : 'vocab-marquee-track-slow'
            }`}
            style={{
              width: 'max-content',
              perspective: '1000px',
              animationDuration: `${Math.max(80, (randomImageCards.length / 2) * 9)}s`,
            }}
          >
            {randomImageCards.map((card, idx) => {
              const isSelected = activeCardId === `${card.id}-${idx}`;

              return (
                <div
                  key={`img-${card.id}-${idx}`}
                  onClick={() => {
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
                        className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all"
                        loading="lazy"
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
                      {/* Ambient blur backdrop to fill container gracefully */}
                      <img
                        src={card.imageUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover filter blur-md opacity-35 scale-110 pointer-events-none"
                      />
                      {/* Sharp complete uncropped image with object-contain */}
                      <img
                        src={card.imageUrl}
                        alt={card.front}
                        className="relative z-1 w-full h-full object-contain p-1"
                      />

                      {/* Clickable Deck Badge in Top-Left */}
                      {card.deckTitle && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
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
                          onClick={(e) => handleSpeak(card.front, e)}
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
