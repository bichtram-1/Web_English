import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  HelpCircle,
  Key,
  Flame,
  Check,
  X,
  ChevronRight,
  Shuffle,
  Lightbulb,
  Coins,
  Crown,
  Lock,
  Unlock,
} from 'lucide-react';
import type { Deck, FlashcardItem } from '../../../types/DeckType';
import studyApi from '../../../api/studyApi';
import useSpeech from '../../../hooks/useSpeech';
import ChickenMascot from '../../../components/general/ChickenMascot';
import GameAudioMenu from '../../../components/general/GameAudioMenu';
import {
  playCorrectSound,
  playIncorrectSound,
  playMatchSound,
  playMismatchSound,
  playWinFanfare,
  playLetterPlaceSound,
  playLetterRemoveSound,
  playTreasureChestSound,
  isSoundEnabled,
} from '../../../utils/soundEffects';

export interface TreasureHuntGameProps {
  deck?: Deck;
  cardsPool?: FlashcardItem[];
  title?: string;
  onExit: () => void;
}

interface LetterTile {
  id: string;
  char: string;
  originalIndex: number;
}

interface StageQuestion {
  card: FlashcardItem;
  scrambledChars: string[];
  options: { id: string; text: string; isCorrect: boolean }[];
  hint: string;
}

const TOTAL_CHESTS_PER_EXPEDITION = 5;

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

// Scramble word letters ensuring it does not equal the original word if length > 2
function scrambleWord(word: string): string[] {
  const clean = word.replace(/\s+/g, '').toUpperCase().split('');
  if (clean.length <= 1) return clean;

  let scrambled = shuffle(clean);
  let tries = 0;
  while (scrambled.join('') === clean.join('') && tries < 10) {
    scrambled = shuffle(clean);
    tries++;
  }
  return scrambled;
}

export default function TreasureHuntGame({
  deck,
  cardsPool,
  title,
  onExit,
}: TreasureHuntGameProps) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { speak } = useSpeech();

  // Combine and clean source cards
  const rawCards = useMemo(() => {
    if (cardsPool && cardsPool.length > 0) return cardsPool;
    if (deck?.cards) {
      return deck.cards.filter((c): c is FlashcardItem => c.type === 'flashcard' && Boolean(c.front && c.back));
    }
    return [];
  }, [deck, cardsPool]);

  const [stages, setStages] = useState<StageQuestion[]>([]);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [phase, setPhase] = useState<'meaning' | 'spelling' | 'chest_opened'>('meaning');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [meaningIsWrong, setMeaningIsWrong] = useState(false);

  // Spelling anagram state
  const [letterPool, setLetterPool] = useState<LetterTile[]>([]);
  const [placedLetters, setPlacedLetters] = useState<(LetterTile | null)[]>([]);
  const [spellingIsWrong, setSpellingIsWrong] = useState(false);

  // Scoring & Stats
  const [gold, setGold] = useState(0);
  const [score, setScore] = useState(0);
  const [chestsUnlocked, setChestsUnlocked] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [autoPronounce, setAutoPronounce] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRecordedRef = useRef(false);

  // Generate Stage Questions
  const initGame = useCallback(() => {
    if (rawCards.length < 2) return;
    if (timerRef.current) clearInterval(timerRef.current);
    sessionRecordedRef.current = false;

    const chosen = shuffle(rawCards).slice(0, Math.min(TOTAL_CHESTS_PER_EXPEDITION, rawCards.length));
    const allMeanings = rawCards.map((c) => c.back);

    const generatedStages: StageQuestion[] = chosen.map((card) => {
      const wrongPool = shuffle(allMeanings.filter((m) => m !== card.back)).slice(0, 3);
      const options = shuffle([
        { id: 'correct', text: card.back, isCorrect: true },
        ...wrongPool.map((w, idx) => ({ id: `wrong-${idx}`, text: w, isCorrect: false })),
      ]);

      const scrambled = scrambleWord(card.front);
      const cleanWord = card.front.replace(/\s+/g, '').toUpperCase();
      const hint = card.exampleEn
        ? `Ví dụ: "${card.exampleEn.replace(new RegExp(card.front, 'gi'), '_____')}"`
        : `Từ có ${cleanWord.length} chữ cái, bắt đầu bằng '${cleanWord[0]}'`;

      return {
        card,
        scrambledChars: scrambled,
        options,
        hint,
      };
    });

    setStages(generatedStages);
    setCurrentStageIdx(0);
    setPhase('meaning');
    setSelectedOptionId(null);
    setMeaningIsWrong(false);
    setShowHint(false);
    setGold(0);
    setScore(0);
    setChestsUnlocked(0);
    setSeconds(0);
    setIsCompleted(false);

    // Setup initial spelling state for stage 0
    if (generatedStages[0]) {
      setupSpellingStage(generatedStages[0]);
    }

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, [rawCards]);

  const setupSpellingStage = (stage: StageQuestion) => {
    const tiles: LetterTile[] = stage.scrambledChars.map((char, idx) => ({
      id: `tile-${idx}-${char}-${Math.random().toString(36).substring(2, 6)}`,
      char,
      originalIndex: idx,
    }));
    setLetterPool(tiles);
    setPlacedLetters(new Array(stage.card.front.replace(/\s+/g, '').length).fill(null));
    setSpellingIsWrong(false);
  };

  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initGame]);

  const currentStage = stages[currentStageIdx];

  // Phase 1: Handle Meaning Quiz Choice
  const handleSelectMeaning = (optionId: string) => {
    if (phase !== 'meaning' || !currentStage) return;
    const opt = currentStage.options.find((o) => o.id === optionId);
    if (!opt) return;

    setSelectedOptionId(optionId);

    if (opt.isCorrect) {
      playCorrectSound();
      setMeaningIsWrong(false);
      setGold((g) => g + 50);
      setScore((s) => s + 100);

      // Transition to Phase 2 (Letter placement) after short delay
      setTimeout(() => {
        setPhase('spelling');
        setupSpellingStage(currentStage);
      }, 500);
    } else {
      playMismatchSound();
      setMeaningIsWrong(true);
      setTimeout(() => {
        setSelectedOptionId(null);
        setMeaningIsWrong(false);
      }, 800);
    }
  };

  // Phase 2: Letter Anagram Slot Handlers
  const handlePlaceLetter = (tile: LetterTile) => {
    if (phase !== 'spelling') return;
    playLetterPlaceSound();

    // Find first empty slot
    const firstEmptyIdx = placedLetters.findIndex((slot) => slot === null);
    if (firstEmptyIdx === -1) return;

    const nextPlaced = [...placedLetters];
    nextPlaced[firstEmptyIdx] = tile;
    setPlacedLetters(nextPlaced);

    // Remove tile from pool
    setLetterPool((prev) => prev.filter((t) => t.id !== tile.id));

    // Check if word is fully assembled
    checkSpellingCompletion(nextPlaced);
  };

  const handleRemoveLetter = (index: number) => {
    if (phase !== 'spelling') return;
    const tile = placedLetters[index];
    if (!tile) return;

    playLetterRemoveSound();

    const nextPlaced = [...placedLetters];
    nextPlaced[index] = null;
    setPlacedLetters(nextPlaced);

    // Return to pool
    setLetterPool((prev) => [...prev, tile]);
    setSpellingIsWrong(false);
  };

  const handleClearLetters = () => {
    if (!currentStage) return;
    setupSpellingStage(currentStage);
  };

  const handleShufflePool = () => {
    setLetterPool((prev) => shuffle(prev));
  };

  const checkSpellingCompletion = (currentSlots: (LetterTile | null)[]) => {
    if (!currentStage) return;
    const isFull = currentSlots.every((s) => s !== null);
    if (!isFull) return;

    const assembledWord = currentSlots.map((s) => s?.char || '').join('');
    const targetWord = currentStage.card.front.replace(/\s+/g, '').toUpperCase();

    if (assembledWord === targetWord) {
      // SUCCESS! UNLOCK TREASURE CHEST!
      playTreasureChestSound();
      if (autoPronounce) {
        speak(currentStage.card.front);
      }

      setPhase('chest_opened');
      setChestsUnlocked((c) => c + 1);
      setGold((g) => g + 150);
      setScore((s) => s + 250);
    } else {
      // Wrong spelling
      playIncorrectSound();
      setSpellingIsWrong(true);
      setTimeout(() => {
        setSpellingIsWrong(false);
      }, 900);
    }
  };

  // Advance to Next Stage Chest
  const handleNextChest = () => {
    if (currentStageIdx < stages.length - 1) {
      const nextIdx = currentStageIdx + 1;
      setCurrentStageIdx(nextIdx);
      setPhase('meaning');
      setSelectedOptionId(null);
      setShowHint(false);
      setupSpellingStage(stages[nextIdx]!);
    } else {
      // Expedition completed!
      if (timerRef.current) clearInterval(timerRef.current);
      setIsCompleted(true);
      playWinFanfare();

      if (!sessionRecordedRef.current && deck?.id) {
        sessionRecordedRef.current = true;
        studyApi
          .submitSession({
            deckId: deck.id,
            mode: 'minigame',
            cardsStudied: stages.length,
            correctCount: stages.length,
            timeSpentSeconds: Math.max(5, seconds),
          })
          .catch(console.error);
      }
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Not enough cards guard
  if (rawCards.length < 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <ChickenMascot size="lg" />
        <h3 className="text-xl font-bold mt-4 mb-2">Cần ít nhất 2 thẻ từ vựng để mở hòm kho báu!</h3>
        <button
          onClick={onExit}
          className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 font-bold hover:bg-indigo-700 cursor-pointer"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between select-none relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(150deg, #090e1a 0%, #13122b 50%, #0a1128 100%)',
        color: '#f8fafc',
      }}
    >
      {/* Confetti on Completion */}
      {isCompleted && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          recycle={false}
          numberOfPieces={400}
          gravity={0.18}
        />
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-900/80 border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-semibold text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{title || deck?.title || (isVi ? 'Thoát' : 'Exit')}</span>
          </button>

          {/* Center Brand Title */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Crown size={18} />
            </div>
            <span className="font-black text-sm sm:text-base text-amber-300 tracking-wide">
              {isVi ? 'Truy Tìm Kho Báu Từ Vựng' : 'Treasure Hunt Quest'}
            </span>
          </div>

          {/* Single Unified Sound & Pronunciation Dropdown + Restart */}
          <div className="flex items-center gap-2">
            <GameAudioMenu
              autoPronounce={autoPronounce}
              onTogglePronounce={(val) => setAutoPronounce(val)}
            />

            <button
              onClick={initGame}
              title={isVi ? 'Chơi lại từ đầu' : 'Restart'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Quest Arena */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 sm:py-6 flex flex-col justify-between">
        {/* Expedition Progress & Treasure Bar */}
        <div className="flex items-center justify-between gap-3 mb-4 bg-slate-900/70 p-3 rounded-2xl border border-slate-800/80">
          {/* Stage Chests Meter */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {stages.map((_, idx) => (
              <div
                key={idx}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                  idx < currentStageIdx || (idx === currentStageIdx && phase === 'chest_opened')
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30 ring-1 ring-amber-300'
                    : idx === currentStageIdx
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 animate-pulse'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {idx < currentStageIdx || (idx === currentStageIdx && phase === 'chest_opened') ? (
                  '👑'
                ) : idx === currentStageIdx ? (
                  <Key size={14} />
                ) : (
                  <Lock size={12} />
                )}
              </div>
            ))}
          </div>

          {/* Live Gold & Time stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs sm:text-sm">
              <Coins size={16} className="text-yellow-400 animate-bounce" />
              <span>{gold} Vàng</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs sm:text-sm font-bold">
              ⏱️ {formatTime(seconds)}
            </div>
          </div>
        </div>

        {/* Current Question Card */}
        {currentStage && (
          <div className="my-auto py-2 flex flex-col items-center">
            {/* Scrambled Word Header Showcase */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full text-center mb-6"
            >
              {/* Chicken Mascot Observer */}
              <div className="flex justify-center mb-2">
                <ChickenMascot size="md" animate />
              </div>

              {/* Scrambled Word Display */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 shadow-xl shadow-indigo-500/10 mb-3">
                <span className="text-xs text-amber-400 font-bold uppercase tracking-widest mr-1">
                  Mật Mã:
                </span>
                {currentStage.scrambledChars.map((char, idx) => (
                  <span
                    key={idx}
                    className="w-8 h-9 sm:w-10 sm:h-11 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-white font-black text-lg sm:text-2xl flex items-center justify-center shadow-inner"
                  >
                    {char}
                  </span>
                ))}
              </div>

              {/* Step indicator */}
              <div className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md ${
                    phase === 'meaning' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  {isVi ? 'Bước 1: Chọn Nghĩa Đúng' : 'Step 1: Choose Meaning'}
                </span>
                <ChevronRight size={14} />
                <span
                  className={`px-2 py-0.5 rounded-md ${
                    phase === 'spelling' ? 'bg-indigo-600 text-white' : phase === 'chest_opened' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isVi ? 'Bước 2: Ghép Chữ Mở Rương' : 'Step 2: Solve & Unlock'}
                </span>
              </div>
            </motion.div>

            {/* PHASE 1: Multiple Choice Meaning */}
            {phase === 'meaning' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentStage.options.map((opt, i) => {
                    const isSelected = selectedOptionId === opt.id;
                    const letterTag = ['A', 'B', 'C', 'D'][i];

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectMeaning(opt.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left font-bold text-sm transition-all cursor-pointer shadow-md active:scale-98 ${
                          isSelected && opt.isCorrect
                            ? 'bg-emerald-600 border-emerald-400 text-white ring-2 ring-emerald-300'
                            : isSelected && !opt.isCorrect
                            ? 'bg-rose-600 border-rose-400 text-white ring-2 ring-rose-300 animate-shake'
                            : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/60 text-slate-200 hover:bg-slate-850'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-xl bg-slate-800 text-indigo-300 flex items-center justify-center font-mono font-black text-xs shrink-0">
                          {letterTag}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Hint Button & Box */}
                <div className="pt-2 text-center">
                  {!showHint ? (
                    <button
                      onClick={() => setShowHint(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Lightbulb size={13} />
                      <span>{isVi ? 'Xem gợi ý mật mã' : 'Need a Hint?'}</span>
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-medium max-w-md mx-auto"
                    >
                      💡 {currentStage.hint}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* PHASE 2: Letter Anagram Slot Assembler */}
            {phase === 'spelling' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg flex flex-col items-center space-y-6"
              >
                {/* Vietnamese Meaning Banner */}
                <div className="px-5 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2">
                  <Check size={14} />
                  <span>Nghĩa: {currentStage.card.back}</span>
                </div>

                {/* Target Word Slots */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
                  {placedLetters.map((tile, idx) => (
                    <motion.div
                      key={idx}
                      onClick={() => handleRemoveLetter(idx)}
                      animate={{
                        x: spellingIsWrong ? [-6, 6, -4, 4, 0] : 0,
                      }}
                      className={`w-11 h-13 sm:w-13 sm:h-15 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl transition-all cursor-pointer select-none shadow-md ${
                        tile
                          ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white border-2 border-indigo-400 shadow-indigo-500/30'
                          : 'border-2 border-dashed border-slate-700 bg-slate-900/60 text-slate-600'
                      }`}
                    >
                      {tile ? tile.char : ''}
                    </motion.div>
                  ))}
                </div>

                {/* Available Scrambled Letter Pool */}
                <div className="w-full p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    {isVi ? 'Bấm chữ cái để ghép vào ô trống' : 'Tap letters to assemble'}
                  </span>

                  <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 mb-3 min-h-[50px]">
                    {letterPool.map((tile) => (
                      <motion.button
                        key={tile.id}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePlaceLetter(tile)}
                        className="w-11 h-12 sm:w-12 sm:h-13 rounded-2xl bg-slate-800 hover:bg-indigo-700 border border-slate-600 text-white font-black text-lg sm:text-xl shadow-md cursor-pointer transition-all flex items-center justify-center active:scale-90"
                      >
                        {tile.char}
                      </motion.button>
                    ))}
                  </div>

                  {/* Actions: Shuffle & Clear */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShufflePool}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Shuffle size={13} />
                      <span>{isVi ? 'Đảo chữ' : 'Shuffle'}</span>
                    </button>

                    <button
                      onClick={handleClearLetters}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>{isVi ? 'Xếp lại từ đầu' : 'Reset'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PHASE 3: Treasure Chest Unlocked & Opened! */}
            {phase === 'chest_opened' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-md p-6 rounded-3xl bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-950 border-2 border-amber-400/80 text-center shadow-2xl shadow-amber-500/20 relative overflow-hidden"
              >
                {/* Glowing Light Ray Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.2)_0%,transparent_70%)] pointer-events-none" />

                {/* Chest Open Graphic */}
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
                  className="text-7xl mb-3 filter drop-shadow-[0_10px_20px_rgba(251,191,36,0.5)]"
                >
                  🎁
                </motion.div>

                <h3 className="text-2xl font-black text-amber-300 mb-1">
                  {isVi ? 'Mở Khóa Rương Kho Báu Thành Công!' : 'Treasure Chest Unlocked!'}
                </h3>

                {/* Pronunciation & Meaning */}
                <div className="my-4 p-3 rounded-2xl bg-slate-900/90 border border-amber-400/30 flex items-center justify-between">
                  <div className="text-left">
                    <span className="font-extrabold text-lg text-white block">
                      {currentStage.card.front}
                    </span>
                    {currentStage.card.phonetic && (
                      <span className="text-xs font-mono text-indigo-300">
                        {currentStage.card.phonetic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speak(currentStage.card.front)}
                      className="p-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all"
                    >
                      <Volume2 size={16} />
                    </button>
                    <span className="text-sm font-bold text-emerald-400">{currentStage.card.back}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-amber-300 font-extrabold text-sm mb-5">
                  <span>+150 Vàng 🪙</span>
                  <span>·</span>
                  <span>+250 Điểm ✨</span>
                </div>

                {/* Continue button */}
                <button
                  onClick={handleNextChest}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>{currentStageIdx < stages.length - 1 ? (isVi ? 'Mở Rương Kế Tiếp' : 'Next Chest') : (isVi ? 'Hoàn Thành Chuyến Đi' : 'Finish Quest')}</span>
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 pt-2">
          {isVi ? '🏴‍☠️ Chinh phục các rương kho báu để ghi nhớ từ vựng tiếng Anh sâu sắc!' : 'Unlock all chests to master your English vocabulary!'}
        </footer>
      </main>

      {/* Expedition Victory Modal */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-lg w-full rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
                <Trophy size={42} />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                {isVi ? 'Chinh Phục Toàn Bộ Kho Báu! 🏆' : 'Expedition Completed! 🏆'}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                {isVi ? 'Bạn đã giải mã xuất sắc toàn bộ mật mã từ vựng!' : 'You unlocked all treasure chests!'}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5 mb-6 text-left">
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[11px] text-slate-400 block mb-1">{isVi ? 'Rương Đã Mở' : 'Chests'}</span>
                  <span className="text-base font-bold text-amber-400">{chestsUnlocked}/{stages.length}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[11px] text-slate-400 block mb-1">{isVi ? 'Vàng Thu Được' : 'Gold'}</span>
                  <span className="text-base font-bold text-yellow-300">+{gold} 🪙</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[11px] text-slate-400 block mb-1">{isVi ? 'Thời Gian' : 'Time'}</span>
                  <span className="text-base font-bold text-indigo-300 font-mono">{formatTime(seconds)}</span>
                </div>
              </div>

              {/* Vocabulary review list */}
              <div className="mb-6 text-left max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {stages.map((st) => (
                  <div
                    key={st.card.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speak(st.card.front)}
                        className="p-1 rounded-md text-amber-400 hover:text-white"
                      >
                        <Volume2 size={13} />
                      </button>
                      <span className="font-bold text-white">{st.card.front}</span>
                    </div>
                    <span className="text-emerald-400 font-medium">{st.card.back}</span>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={initGame}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  <span>{isVi ? 'Thử Thách Mới' : 'Play Again'}</span>
                </button>

                <button
                  onClick={onExit}
                  className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm cursor-pointer"
                >
                  {isVi ? 'Thoát' : 'Exit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
