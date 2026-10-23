import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  X,
  Volume2,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { FlashcardItem } from '../../../types/DeckType';
import useSpeech from '../../../hooks/useSpeech';
import WallpaperModal from '../../../components/general/WallpaperModal';
import { useWallpaper } from '../../../contexts/WallpaperContext';
import { playMatchSound, playMismatchSound, playCardFlipSound } from '../../../utils/soundEffects';

export interface SrsMatchPairsProps {
  cards: FlashcardItem[];
  onCardRated: (cardId: number, rating: 1 | 2 | 3 | 5) => void;
  onBatchFinish: () => void;
  onExit: () => void;
  customTopActions?: React.ReactNode;
  srsProgressText?: string;
  totalBatchCount?: number;
  completedCount?: number;
}

interface TileItem {
  id: number;
  type: 'en' | 'vi';
  text: string;
  phonetic?: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = cloned[i]!;
    cloned[i] = cloned[j]!;
    cloned[j] = temp;
  }
  return cloned;
}

const ROUND_SIZE = 5;

export default function SrsMatchPairs({
  cards,
  onCardRated,
  onBatchFinish,
  onExit,
  customTopActions,
  srsProgressText,
  totalBatchCount = cards.length,
  completedCount = 0,
}: SrsMatchPairsProps) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { speak } = useSpeech();
  const { config: wallpaperConfig, setIsModalOpen: setWallpaperModalOpen } = useWallpaper();

  // Cards that still need to be matched in this session
  const [unmatchedCards, setUnmatchedCards] = useState<FlashcardItem[]>([...cards]);
  const [roundIndex, setRoundIndex] = useState(0);

  // Sync state whenever cards prop changes (e.g. new batch or uncompleted cards list changes)
  useEffect(() => {
    setUnmatchedCards([...cards]);
    setRoundIndex(0);
  }, [cards]);

  // Current round's cards
  const currentRoundCards = useMemo(() => {
    return unmatchedCards.slice(0, ROUND_SIZE);
  }, [unmatchedCards]);

  // Shuffled English & Vietnamese column tiles
  const [enTiles, setEnTiles] = useState<TileItem[]>([]);
  const [viTiles, setViTiles] = useState<TileItem[]>([]);

  // Selection states
  const [selectedEnId, setSelectedEnId] = useState<number | null>(null);
  const [selectedViId, setSelectedViId] = useState<number | null>(null);

  // Feedback states
  const [matchedIdsInRound, setMatchedIdsInRound] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ enId: number; viId: number } | null>(null);
  const [justMatchedId, setJustMatchedId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mistakes tracker per cardId to calculate SM-2 rating
  const [mistakes, setMistakes] = useState<Record<number, number>>({});

  // Initialize round tiles whenever currentRoundCards changes
  useEffect(() => {
    if (currentRoundCards.length === 0) return;

    const enList: TileItem[] = currentRoundCards.map((c) => ({
      id: c.id,
      type: 'en',
      text: c.front,
      phonetic: c.phonetic,
    }));

    const viList: TileItem[] = currentRoundCards.map((c) => ({
      id: c.id,
      type: 'vi',
      text: c.back,
    }));

    setEnTiles(shuffleArray(enList));
    setViTiles(shuffleArray(viList));
    setMatchedIdsInRound(new Set());
    setSelectedEnId(null);
    setSelectedViId(null);
    setWrongPair(null);
    setIsProcessing(false);
  }, [currentRoundCards]);

  // Handle tile click
  const handleTileClick = useCallback(
    (tile: TileItem) => {
      if (isProcessing) return;
      if (matchedIdsInRound.has(tile.id)) return;

      playCardFlipSound();

      if (tile.type === 'en') {
        speak(tile.text);
        if (selectedEnId === tile.id) {
          setSelectedEnId(null);
          return;
        }
        setSelectedEnId(tile.id);

        // If VI is already selected, check match
        if (selectedViId !== null) {
          checkPair(tile.id, selectedViId);
        }
      } else {
        if (selectedViId === tile.id) {
          setSelectedViId(null);
          return;
        }
        setSelectedViId(tile.id);

        // If EN is already selected, check match
        if (selectedEnId !== null) {
          checkPair(selectedEnId, tile.id);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isProcessing, matchedIdsInRound, selectedEnId, selectedViId, speak]
  );

  const checkPair = useCallback(
    (enId: number, viId: number) => {
      setIsProcessing(true);

      if (enId === viId) {
        // Correct match!
        playMatchSound();
        setJustMatchedId(enId);

        const cardMistakes = mistakes[enId] || 0;
        const rating = cardMistakes === 0 ? 3 : cardMistakes === 1 ? 2 : 1;
        onCardRated(enId, rating);

        const nextMatched = new Set(matchedIdsInRound);
        nextMatched.add(enId);
        setMatchedIdsInRound(nextMatched);

        setTimeout(() => {
          setJustMatchedId(null);
          setSelectedEnId(null);
          setSelectedViId(null);
          setIsProcessing(false);

          // Check if this round is cleared
          if (nextMatched.size >= currentRoundCards.length) {
            // Remove matched cards from unmatchedCards pool
            const remaining = unmatchedCards.filter((c) => !nextMatched.has(c.id));
            if (remaining.length === 0) {
              onBatchFinish();
            } else {
              setUnmatchedCards(remaining);
              setRoundIndex((r) => r + 1);
            }
          }
        }, 320);
      } else {
        // Incorrect match!
        playMismatchSound();
        setWrongPair({ enId, viId });
        setMistakes((prev) => ({
          ...prev,
          [enId]: (prev[enId] || 0) + 1,
          [viId]: (prev[viId] || 0) + 1,
        }));

        setTimeout(() => {
          setWrongPair(null);
          setSelectedEnId(null);
          setSelectedViId(null);
          setIsProcessing(false);
        }, 500);
      }
    },
    [matchedIdsInRound, currentRoundCards, unmatchedCards, mistakes, onCardRated, onBatchFinish]
  );

  const totalCardsInBatch = totalBatchCount;
  const currentCompleted = completedCount;
  const roundRemainingCount = currentRoundCards.length - matchedIdsInRound.size;

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-x-clip text-slate-900 dark:text-slate-100 transition-colors duration-200 ${
        wallpaperConfig.enabled && wallpaperConfig.url ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-950'
      }`}
    >
      {/* Background wallpaper if configured */}
      {wallpaperConfig.enabled && wallpaperConfig.url && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-all duration-500 ease-out"
          style={{
            backgroundImage: `url(${wallpaperConfig.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${wallpaperConfig.blur}px) brightness(${wallpaperConfig.brightness})`,
          }}
        />
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <X size={16} />
            <span className="hidden sm:inline">{isVi ? 'Thoát' : 'Exit'}</span>
          </button>

          {/* Mode Title & Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
              🧩
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                {isVi ? 'Ghép nghĩa Duolingo' : 'Duolingo Match'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {isVi ? `Lượt ${roundIndex + 1} · Còn ${roundRemainingCount} cặp` : `Round ${roundIndex + 1} · ${roundRemainingCount} left`}
              </span>
            </div>
          </div>

          {/* Right Action area: Custom Switch Menu & Controls */}
          <div className="flex items-center gap-2">
            {customTopActions}

            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 font-mono" style={{ fontFamily: 'var(--font-display)' }}>
              {srsProgressText || `${currentCompleted}/${totalCardsInBatch}`}
            </span>

            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWallpaperModalOpen(true)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isVi ? 'Đổi hình nền' : 'Customize wallpaper'}
                aria-label="Customize wallpaper"
              >
                <ImageIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-4xl w-full mx-auto">
        <div className="w-full mb-3 flex items-center justify-between px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isVi ? 'Từ Tiếng Anh' : 'English'}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {isVi ? 'Nghĩa Tiếng Việt' : 'Meaning'}
          </span>
        </div>

        {/* 2-Column Matching Grid */}
        <div className="w-full grid grid-cols-2 gap-3 sm:gap-4">
          {/* Left Column: English Tiles */}
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <AnimatePresence>
              {enTiles.map((tile) => {
                const isMatched = matchedIdsInRound.has(tile.id);
                const isSelected = selectedEnId === tile.id;
                const isWrong = wrongPair?.enId === tile.id;
                const isJustMatched = justMatchedId === tile.id;

                if (isMatched && !isJustMatched) {
                  return (
                    <div
                      key={`en-${tile.id}`}
                      className="h-16 sm:h-20 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-800/40 bg-slate-100/30 dark:bg-slate-900/20 opacity-30 flex items-center justify-center"
                    >
                      <CheckCircle2 size={18} className="text-emerald-500/60" />
                    </div>
                  );
                }

                return (
                  <motion.button
                    key={`en-${tile.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                      opacity: 1,
                      scale: isSelected ? 1.02 : 1,
                      x: isWrong ? [-6, 6, -4, 4, 0] : 0,
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleTileClick(tile)}
                    disabled={isMatched || isProcessing}
                    className={`w-full min-h-[64px] sm:min-h-[80px] p-3 sm:p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-sm relative group overflow-hidden ${
                      isJustMatched
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
                        : isWrong
                        ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-700 dark:text-rose-200 ring-2 ring-rose-500/30'
                        : isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-200 ring-2 ring-indigo-500/40 shadow-md shadow-indigo-500/10'
                        : 'bg-white/90 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/90 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-extrabold text-sm sm:text-base leading-snug break-words" style={{ fontFamily: 'var(--font-display)' }}>
                        {tile.text}
                      </span>
                      {tile.phonetic && (
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          {tile.phonetic}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(tile.text);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0"
                      title={isVi ? 'Nghe phát âm' : 'Listen'}
                    >
                      <Volume2 size={16} />
                    </button>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right Column: Vietnamese Tiles */}
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <AnimatePresence>
              {viTiles.map((tile) => {
                const isMatched = matchedIdsInRound.has(tile.id);
                const isSelected = selectedViId === tile.id;
                const isWrong = wrongPair?.viId === tile.id;
                const isJustMatched = justMatchedId === tile.id;

                if (isMatched && !isJustMatched) {
                  return (
                    <div
                      key={`vi-${tile.id}`}
                      className="h-16 sm:h-20 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-800/40 bg-slate-100/30 dark:bg-slate-900/20 opacity-30 flex items-center justify-center"
                    >
                      <CheckCircle2 size={18} className="text-emerald-500/60" />
                    </div>
                  );
                }

                return (
                  <motion.button
                    key={`vi-${tile.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                      opacity: 1,
                      scale: isSelected ? 1.02 : 1,
                      x: isWrong ? [-6, 6, -4, 4, 0] : 0,
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleTileClick(tile)}
                    disabled={isMatched || isProcessing}
                    className={`w-full min-h-[64px] sm:min-h-[80px] p-3 sm:p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-sm relative group overflow-hidden ${
                      isJustMatched
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
                        : isWrong
                        ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-700 dark:text-rose-200 ring-2 ring-rose-500/30'
                        : isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-200 ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/10'
                        : 'bg-white/90 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/90 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <span className="font-semibold text-xs sm:text-sm leading-snug break-words">
                      {tile.text}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Round Progress indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Sparkles size={14} className="text-amber-500" />
          <span>
            {isVi
              ? `Chạm từ tiếng Anh rồi chạm nghĩa tiếng Việt để ghép cặp`
              : `Tap English word then tap matching Vietnamese meaning`}
          </span>
        </div>
      </main>

      <WallpaperModal />
    </div>
  );
}
