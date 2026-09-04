import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  HelpCircle,
  Star,
  Layers,
  Volume1,
} from 'lucide-react';
import type { Deck, FlashcardItem } from '../../../types/DeckType';
import studyApi from '../../../api/studyApi';
import useSpeech from '../../../hooks/useSpeech';
import GameAudioMenu from '../../../components/general/GameAudioMenu';
import {
  playCardFlipSound,
  playMatchSound,
  playMismatchSound,
  playComboSound,
  playWinFanfare,
  isSoundEnabled,
  toggleSound,
} from '../../../utils/soundEffects';

export interface MemoryMatchGameProps {
  deck: Deck;
  onExit: () => void;
}

interface MatchCard {
  uid: string; // Unique instance id
  cardId: number; // Flashcard id
  type: 'en' | 'vi';
  text: string;
  phonetic?: string;
  partnerText: string;
  isFlipped: boolean;
  isMatched: boolean;
  isWrong: boolean;
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'all';

const DIFFICULTY_MAP: Record<Difficulty, number> = {
  easy: 4,
  medium: 6,
  hard: 8,
  all: 999,
};

function shuffleArray<T>(array: T[]): T[] {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j]!, cloned[i]!];
  }
  return cloned;
}

export default function MemoryMatchGame({ deck, onExit }: MemoryMatchGameProps) {
  const { t } = useTranslation();
  const { speak } = useSpeech();

  // Extract valid flashcard items from deck
  const flashcards = useMemo(() => {
    return deck.cards.filter((c): c is FlashcardItem => c.type === 'flashcard' && Boolean(c.front && c.back));
  }, [deck.cards]);

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MatchCard[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [turns, setTurns] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());
  const [autoPronounce, setAutoPronounce] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeVocabList, setActiveVocabList] = useState<FlashcardItem[]>([]);
  const [peekCountdown, setPeekCountdown] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRecordedRef = useRef(false);

  // Initialize or reset game with preview memorization countdown
  const initializeGame = useCallback(
    (diff: Difficulty = difficulty) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      sessionRecordedRef.current = false;

      const targetPairsCount = Math.min(DIFFICULTY_MAP[diff], flashcards.length);
      const chosenCards = shuffleArray(flashcards).slice(0, targetPairsCount);
      setActiveVocabList(chosenCards);

      // Determine initial peek countdown seconds based on pair count:
      // 4 pairs -> 3s, 6 pairs -> 4s, 8+ pairs -> 5s
      const initialPeekSec = targetPairsCount <= 4 ? 3 : targetPairsCount <= 6 ? 4 : 5;

      const generatedCards: MatchCard[] = [];
      chosenCards.forEach((fc) => {
        // English card (starts face-up for preview memorization)
        generatedCards.push({
          uid: `en-${fc.id}-${Math.random().toString(36).substring(2, 7)}`,
          cardId: fc.id,
          type: 'en',
          text: fc.front,
          phonetic: fc.phonetic,
          partnerText: fc.back,
          isFlipped: true,
          isMatched: false,
          isWrong: false,
        });
        // Vietnamese card (starts face-up for preview memorization)
        generatedCards.push({
          uid: `vi-${fc.id}-${Math.random().toString(36).substring(2, 7)}`,
          cardId: fc.id,
          type: 'vi',
          text: fc.back,
          partnerText: fc.front,
          isFlipped: true,
          isMatched: false,
          isWrong: false,
        });
      });

      const shuffled = shuffleArray(generatedCards);
      setCards(shuffled);
      setSelectedCards([]);
      setMatchedCount(0);
      setTurns(0);
      setCombo(0);
      setMaxCombo(0);
      setScore(0);
      setSeconds(0);
      setIsLocked(true); // Locked while memorizing
      setIsCompleted(false);
      setIsStarted(true);
      setPeekCountdown(initialPeekSec);

      // Countdown to flip cards back face down
      let currentCount = initialPeekSec;
      countdownIntervalRef.current = setInterval(() => {
        currentCount -= 1;
        if (currentCount > 0) {
          setPeekCountdown(currentCount);
        } else {
          // Finished countdown: flip all cards face down and start real timer
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setPeekCountdown(null);
          playCardFlipSound();

          setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
          setIsLocked(false);

          timerRef.current = setInterval(() => {
            setSeconds((prev) => prev + 1);
          }, 1000);
        }
      }, 1000);
    },
    [flashcards, difficulty]
  );

  // Initial load
  useEffect(() => {
    if (flashcards.length >= 2) {
      initializeGame(difficulty);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [flashcards, initializeGame, difficulty]);

  // Handle Game Victory
  useEffect(() => {
    const totalPairs = activeVocabList.length;
    if (totalPairs > 0 && matchedCount === totalPairs && isStarted && !isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsCompleted(true);
      playWinFanfare();

      // Submit study session to API
      if (!sessionRecordedRef.current) {
        sessionRecordedRef.current = true;
        studyApi
          .submitSession({
            deckId: deck.id,
            mode: 'match',
            cardsStudied: totalPairs,
            correctCount: totalPairs,
            timeSpentSeconds: Math.max(1, seconds),
          })
          .catch((err) => console.error('Failed to submit match session:', err));
      }
    }
  }, [matchedCount, activeVocabList.length, isStarted, isCompleted, deck.id, seconds]);

  // Card click handler
  const handleCardClick = (clickedCard: MatchCard) => {
    if (isLocked || peekCountdown !== null) return;
    if (clickedCard.isFlipped || clickedCard.isMatched) return;

    playCardFlipSound();

    // Flip the clicked card
    const updatedCards = cards.map((c) => (c.uid === clickedCard.uid ? { ...c, isFlipped: true } : c));
    setCards(updatedCards);

    const newSelected = [...selectedCards, clickedCard];
    setSelectedCards(newSelected);

    // If 1st card flipped, optionally speak English word
    if (newSelected.length === 1) {
      if (clickedCard.type === 'en' && autoPronounce) {
        speak(clickedCard.text);
      }
      return;
    }

    // If 2nd card flipped: Evaluate match
    if (newSelected.length === 2) {
      setIsLocked(true);
      setTurns((prev) => prev + 1);
      const [card1, card2] = newSelected as [MatchCard, MatchCard];

      const isMatch = card1.cardId === card2.cardId && card1.type !== card2.type;

      if (isMatch) {
        // MATCH SUCCESS
        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((prev) => Math.max(prev, newCombo));

        const basePoints = 100;
        const comboBonus = (newCombo - 1) * 35;
        setScore((prev) => prev + basePoints + comboBonus);

        playMatchSound();
        if (newCombo > 1) {
          setTimeout(() => playComboSound(newCombo), 150);
        }

        // Pronounce English card
        const enCard = card1.type === 'en' ? card1 : card2;
        if (autoPronounce) {
          speak(enCard.text);
        }

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.cardId === card1.cardId ? { ...c, isMatched: true, isFlipped: true } : c))
          );
          setMatchedCount((prev) => prev + 1);
          setSelectedCards([]);
          setIsLocked(false);
        }, 500);
      } else {
        // MISMATCH
        setCombo(0);
        playMismatchSound();

        // Mark as wrong for shake animation
        setCards((prev) =>
          prev.map((c) =>
            c.uid === card1.uid || c.uid === card2.uid ? { ...c, isWrong: true } : c
          )
        );

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.uid === card1.uid || c.uid === card2.uid
                ? { ...c, isFlipped: false, isWrong: false }
                : c
            )
          );
          setSelectedCards([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundActive(next);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPairs = activeVocabList.length;
  const accuracy = turns > 0 ? Math.min(100, Math.round((matchedCount / turns) * 100)) : 100;

  // Calculate stars: 3 stars (>= 75% accuracy or fast turns), 2 stars (>= 50%), 1 star
  const starsCount = useMemo(() => {
    if (!isCompleted) return 0;
    if (turns <= totalPairs * 1.4 || accuracy >= 70) return 3;
    if (turns <= totalPairs * 2.2 || accuracy >= 45) return 2;
    return 1;
  }, [isCompleted, turns, totalPairs, accuracy]);

  // If not enough cards in deck
  if (flashcards.length < 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <HelpCircle size={36} />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('match_game_title')}</h2>
        <p className="text-slate-400 max-w-md mb-6">{t('match_not_enough_cards')}</p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all cursor-pointer"
        >
          {t('match_btn_back_deck')}
        </button>
      </div>
    );
  }

  // Dynamic grid column calculation
  const getGridColsClass = () => {
    const count = cards.length;
    if (count <= 8) return 'grid-cols-2 sm:grid-cols-4';
    if (count <= 12) return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6';
    if (count <= 16) return 'grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8';
    return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between select-none relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(145deg, #090d16 0%, #111827 50%, #0f172a 100%)',
        color: '#f8fafc',
      }}
    >
      {/* Confetti on Game Completion */}
      {isCompleted && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          recycle={false}
          numberOfPieces={380}
          gravity={0.18}
        />
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Back button */}
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-semibold text-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{deck.title}</span>
          </button>

          {/* Center Title / Level info */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles size={18} />
            </div>
            <span className="font-bold text-sm sm:text-base text-white tracking-wide">
              {t('match_game_title')}
            </span>
          </div>

          {/* Single Unified Audio Settings Dropdown & Restart */}
          <div className="flex items-center gap-2">
            <GameAudioMenu
              autoPronounce={autoPronounce}
              onTogglePronounce={(val) => setAutoPronounce(val)}
            />

            <button
              onClick={() => initializeGame(difficulty)}
              title={t('match_restart')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 flex flex-col justify-between relative">
        {/* Memorization Phase Countdown Banner */}
        <AnimatePresence>
          {peekCountdown !== null && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="mb-4 w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-center shadow-xl shadow-orange-500/20 border border-amber-300/40 flex items-center justify-center gap-3 animate-pulse"
            >
              <span className="text-2xl">👀</span>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide">
                  Ghi nhớ vị trí các từ vựng trước khi úp thẻ!
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-900 font-black text-sm">
                  {peekCountdown}s
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Stats & Difficulty Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Difficulty selector tabs */}
          <div className="flex items-center bg-slate-800/70 p-1 rounded-xl border border-slate-700/50">
            {(['easy', 'medium', 'hard', 'all'] as Difficulty[]).map((d) => {
              const count = Math.min(DIFFICULTY_MAP[d], flashcards.length);
              if (d === 'hard' && flashcards.length < 8) return null;
              return (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    initializeGame(d);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    difficulty === d
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {d === 'easy' && t('match_difficulty_easy')}
                  {d === 'medium' && t('match_difficulty_medium')}
                  {d === 'hard' && t('match_difficulty_hard')}
                  {d === 'all' && `${t('match_difficulty_all')} (${count})`}
                </button>
              );
            })}
          </div>

          {/* Live Metrics: Matched, Turns, Time, Score, Combo */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
            {/* Matched counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs sm:text-sm font-semibold">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-slate-400">{t('match_pairs_matched')}:</span>
              <span className="text-emerald-300 font-bold">
                {matchedCount}/{totalPairs}
              </span>
            </div>

            {/* Turns counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs sm:text-sm font-semibold">
              <Layers size={16} className="text-indigo-400" />
              <span className="text-slate-400">{t('match_turns')}:</span>
              <span className="text-indigo-300 font-bold">{turns}</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs sm:text-sm font-semibold">
              <Clock size={16} className="text-amber-400" />
              <span className="text-amber-300 font-mono font-bold">{formatTime(seconds)}</span>
            </div>

            {/* Combo Streak Indicator */}
            <AnimatePresence>
              {combo > 1 && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs shadow-lg shadow-orange-500/30 animate-pulse"
                >
                  <Flame size={15} />
                  <span>Combo x{combo}!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Score */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-xs sm:text-sm font-bold text-indigo-200">
              <Trophy size={16} className="text-amber-400" />
              <span>{score} pts</span>
            </div>
          </div>
        </div>

        {/* Card Grid Board */}
        <div className={`grid ${getGridColsClass()} gap-3 sm:gap-4 my-auto py-2`}>
          {cards.map((card) => {
            const isSelected = selectedCards.some((sc) => sc.uid === card.uid);
            const isCardFaceUp = card.isFlipped || card.isMatched;

            return (
              <div
                key={card.uid}
                onClick={() => handleCardClick(card)}
                className="perspective-[1000px] cursor-pointer touch-manipulation aspect-[4/3] sm:aspect-[5/4] min-h-[96px] sm:min-h-[110px]"
              >
                <motion.div
                  animate={{
                    rotateY: isCardFaceUp ? 180 : 0,
                    scale: isSelected ? 1.04 : card.isMatched ? 0.98 : 1,
                    x: card.isWrong ? [-8, 8, -6, 6, -3, 3, 0] : 0,
                  }}
                  transition={{
                    duration: 0.35,
                    ease: 'easeOut',
                  }}
                  className={`relative w-full h-full rounded-2xl transition-shadow select-none shadow-md ${
                    card.isMatched
                      ? 'ring-2 ring-emerald-400 shadow-emerald-500/20'
                      : card.isWrong
                      ? 'ring-2 ring-rose-500 shadow-rose-500/30'
                      : isSelected
                      ? 'ring-2 ring-indigo-400 shadow-indigo-500/30'
                      : 'hover:shadow-indigo-500/10'
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Card Back (Hidden Face) */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-2xl flex flex-col items-center justify-center p-3 border border-slate-700/80 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 hover:from-slate-750 hover:to-slate-800 transition-all group overflow-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    {/* Decorative pattern */}
                    <div
                      className="absolute inset-0 opacity-15 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:12px_12px]"
                      aria-hidden="true"
                    />
                    <div className="relative flex flex-col items-center gap-1 text-slate-400 group-hover:text-indigo-400 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-slate-700/50 group-hover:bg-indigo-600/30 flex items-center justify-center transition-all group-hover:scale-110">
                        <Sparkles size={18} />
                      </div>
                      <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                        Flip
                      </span>
                    </div>
                  </div>

                  {/* Card Front (Revealed Face) */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-2xl flex flex-col justify-between p-3.5 sm:p-4 border transition-all ${
                      card.isMatched
                        ? 'bg-gradient-to-br from-emerald-950/80 to-teal-900/90 border-emerald-500/60 text-emerald-50'
                        : card.isWrong
                        ? 'bg-gradient-to-br from-rose-950/90 to-red-900/90 border-rose-500 text-rose-50'
                        : card.type === 'en'
                        ? 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-indigo-900/90 border-indigo-500/60 text-white'
                        : 'bg-gradient-to-br from-teal-950/90 via-slate-900 to-emerald-950/90 border-teal-500/60 text-white'
                    }`}
                    style={{
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    {/* Top Tag & Type badge */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider ${
                          card.type === 'en'
                            ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
                            : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {card.type === 'en' ? 'EN' : 'VI'}
                      </span>

                      {card.isMatched ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : card.type === 'en' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(card.text);
                          }}
                          className="p-1 rounded-md text-indigo-300 hover:text-white hover:bg-indigo-600/30 transition-colors"
                        >
                          <Volume2 size={14} />
                        </button>
                      ) : null}
                    </div>

                    {/* Word text center */}
                    <div className="text-center my-auto flex flex-col justify-center items-center">
                      <p
                        className={`font-bold leading-tight ${
                          card.text.length > 24
                            ? 'text-xs sm:text-sm'
                            : card.text.length > 14
                            ? 'text-sm sm:text-base'
                            : 'text-base sm:text-lg'
                        }`}
                      >
                        {card.text}
                      </p>
                      {card.phonetic && card.type === 'en' && (
                        <span className="text-[11px] text-indigo-300/70 font-mono mt-0.5">
                          {card.phonetic}
                        </span>
                      )}
                    </div>

                    {/* Bottom Indicator */}
                    <div className="text-right">
                      <span className="text-[9px] opacity-40 font-mono">
                        {card.isMatched ? 'MATCHED' : ''}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Footer Hint */}
        <footer className="mt-4 text-center">
          <p className="text-xs text-slate-400/80">{t('match_flip_hint')}</p>
        </footer>
      </main>

      {/* Victory Celebration Modal */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-lg w-full rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden"
            >
              {/* Glow backdrop behind trophy */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />

              <div className="relative z-10">
                {/* Trophy icon */}
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
                  <Trophy size={42} />
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                  {t('match_victory_title')}
                </h2>
                <p className="text-sm text-slate-400 mb-6">{t('match_victory_desc')}</p>

                {/* Star Rating */}
                <div className="flex justify-center items-center gap-2 mb-6">
                  {[1, 2, 3].map((starIndex) => (
                    <motion.div
                      key={starIndex}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{
                        scale: starIndex <= starsCount ? 1 : 0.8,
                        rotate: 0,
                      }}
                      transition={{ delay: 0.2 + starIndex * 0.15, type: 'spring' }}
                    >
                      <Star
                        size={32}
                        className={
                          starIndex <= starsCount
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'text-slate-700'
                        }
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Performance Metrics Table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 text-left">
                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block mb-1">{t('match_time')}</span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {formatTime(seconds)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block mb-1">{t('match_turns')}</span>
                    <span className="text-base font-bold text-indigo-400">{turns}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block mb-1">{t('match_accuracy')}</span>
                    <span className="text-base font-bold text-emerald-400">{accuracy}%</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block mb-1">{t('match_score')}</span>
                    <span className="text-base font-bold text-yellow-400">+{score} XP</span>
                  </div>
                </div>

                {/* Vocabulary Review Scroll list */}
                <div className="mb-6 text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    {t('match_vocab_summary')} ({activeVocabList.length})
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {activeVocabList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-700/40"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => speak(item.front)}
                            className="p-1 rounded-md text-indigo-400 hover:text-white hover:bg-indigo-600/30"
                          >
                            <Volume2 size={13} />
                          </button>
                          <span className="font-bold text-slate-200">{item.front}</span>
                          {item.phonetic && (
                            <span className="text-slate-500 font-mono">{item.phonetic}</span>
                          )}
                        </div>
                        <span className="text-emerald-400 font-medium text-right">{item.back}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => initializeGame(difficulty)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <RotateCcw size={16} />
                    {t('match_btn_play_again')}
                  </button>

                  <button
                    onClick={onExit}
                    className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-sm transition-all cursor-pointer"
                  >
                    {t('match_btn_back_deck')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
