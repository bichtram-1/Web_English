import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, RotateCcw, Zap } from 'lucide-react';
import type { Deck, FlashcardItem } from '../../../types/DeckType';
import studyApi from '../../../api/studyApi';

interface Target {
  id: number;
  english: string;
  vietnamese: string;
  x: number;
  y: number;
  speed: number;
  exploding: boolean;
}

interface Projectile {
  id: number;
  x: number;
  fromY: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  pts: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const TICK_MS = 60;
const SPAWN_MS = 2200;
const BOUNDARY = 88;

interface TypingShooterProps {
  deck: Deck;
  onExit: () => void;
}

export default function TypingShooter({ deck, onExit }: TypingShooterProps) {
  const cards = deck.cards.filter((c): c is FlashcardItem => c.type === 'flashcard');
  const pool = useRef(shuffle(cards));
  const poolIdx = useRef(0);

  const [targets, setTargets] = useState<Target[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const projId = useRef(0);
  const explId = useRef(0);
  const livesRef = useRef(3);

  const spawnTarget = useCallback(() => {
    if (pool.current.length === 0) return;
    const card = pool.current[poolIdx.current % pool.current.length]!;
    poolIdx.current++;
    const level = Math.floor(poolIdx.current / 5);
    const speed = 0.18 + level * 0.03 + Math.random() * 0.08;
    setTargets((prev) => [
      ...prev,
      {
        id: nextId.current++,
        english: card.front,
        vietnamese: card.back,
        x: 5 + Math.random() * 78,
        y: -8,
        speed,
        exploding: false,
      },
    ]);
  }, []);

  const stopGame = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
  }, []);

  const startGame = useCallback(() => {
    pool.current = shuffle(cards);
    poolIdx.current = 0;
    nextId.current = 0;
    livesRef.current = 3;
    setTargets([]);
    setProjectiles([]);
    setExplosions([]);
    setInput('');
    setScore(0);
    setLives(3);
    setGameOver(false);
    setStarted(true);
  }, [cards]);

  useEffect(() => {
    if (!started || gameOver) return;

    tickRef.current = setInterval(() => {
      setTargets((prev) => {
        const updated: Target[] = [];
        let misses = 0;

        for (const t of prev) {
          if (t.exploding) {
            updated.push(t);
            continue;
          }
          const newY = t.y + t.speed;
          if (newY >= BOUNDARY) {
            misses++;
          } else {
            updated.push({ ...t, y: newY });
          }
        }

        if (misses > 0) {
          livesRef.current = Math.max(0, livesRef.current - misses);
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            setGameOver(true);
          }
        }

        return updated;
      });
    }, TICK_MS);

    spawnRef.current = setInterval(spawnTarget, SPAWN_MS);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [started, gameOver, spawnTarget]);

  useEffect(() => {
    if (gameOver) {
      stopGame();
      const wordsCount = Math.floor(score / 100);
      studyApi.submitSession({
        deckId: deck.id,
        mode: 'minigame',
        cardsStudied: Math.max(1, wordsCount),
        correctCount: Math.max(1, wordsCount),
        timeSpentSeconds: 45,
      }).catch(console.error);
    }
  }, [gameOver, stopGame, deck.id, score]);

  useEffect(() => {
    if (started) inputRef.current?.focus();
  }, [started]);

  useEffect(() => {
    const explodingIds = targets.filter((t) => t.exploding).map((t) => t.id);
    if (explodingIds.length === 0) return;
    const timer = setTimeout(() => {
      setTargets((prev) => prev.filter((t) => !t.exploding));
    }, 500);
    return () => clearTimeout(timer);
  }, [targets]);

  const tryShoot = useCallback((raw: string) => {
    const typed = raw.trim().toLowerCase();
    if (!typed) return;

    setTargets((prev) => {
      const hit = prev.find((t) => !t.exploding && t.english.toLowerCase() === typed);
      if (!hit) return prev;

      const pid = projId.current++;
      setProjectiles((ps) => [...ps, { id: pid, x: hit.x + 4, fromY: hit.y }]);
      setTimeout(() => setProjectiles((ps) => ps.filter((p) => p.id !== pid)), 350);

      const eid = explId.current++;
      setExplosions((es) => [...es, { id: eid, x: hit.x, y: hit.y, pts: 100 }]);
      setTimeout(() => setExplosions((es) => es.filter((e) => e.id !== eid)), 900);

      setScore((s) => {
        const ns = s + 100;
        setHighScore((h) => Math.max(h, ns));
        return ns;
      });

      return prev.map((t) => (t.id === hit.id ? { ...t, exploding: true } : t));
    });
    setInput('');
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      tryShoot(input);
    }
  };

  if (!started) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0c1445 100%)' }}
      >
        <button
          onClick={onExit}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-semibold transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <X size={15} /> Exit
        </button>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="text-6xl mb-4">🐔</div>
          <h1 className="text-white text-3xl font-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Typing Shooter
          </h1>
          <p className="text-slate-400 text-sm mb-2 font-medium">
            Chickens fall from above showing Vietnamese meanings.
          </p>
          <p className="text-slate-400 text-sm mb-8 font-medium">
            Type the English word and press <kbd className="bg-slate-700 text-white px-1.5 py-0.5 rounded text-xs">Enter</kbd> to shoot!
          </p>
          <div className="flex justify-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl mb-1">❤️</div>
              <p className="text-xs text-slate-400 font-semibold">3 Lives</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">⬆️</div>
              <p className="text-xs text-slate-400 font-semibold">Gets harder</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">💥</div>
              <p className="text-xs text-slate-400 font-semibold">+100 pts/hit</p>
            </div>
          </div>
          <button
            onClick={startGame}
            className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-2xl shadow-indigo-900 hover:bg-indigo-500 active:scale-95 transition-all"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Start Game
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden select-none relative"
      style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0c1445 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() > 0.85 ? 2 : 1,
              height: Math.random() > 0.85 ? 2 : 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 85}%`,
              opacity: 0.1 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <X size={13} /> Exit
        </button>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Best</div>
            <div className="text-white text-sm font-black" style={{ fontFamily: 'var(--font-display)' }}>
              {highScore}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-indigo-400 uppercase tracking-widest font-bold">Score</div>
            <div className="text-white text-xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
              {score}
            </div>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                size={18}
                fill={i < lives ? '#ef4444' : 'none'}
                className={i < lives ? 'text-red-400' : 'text-slate-700'}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="relative flex-1" style={{ minHeight: '60vh' }}>
        <div
          className="absolute left-0 right-0 h-px bg-red-900/60"
          style={{ top: `${BOUNDARY}%` }}
        />
        <div
          className="absolute left-0 right-0 text-center text-red-900/40 text-xs"
          style={{ top: `calc(${BOUNDARY}% + 2px)`, fontFamily: 'var(--font-display)', fontSize: '10px' }}
        >
          DANGER ZONE
        </div>

        <AnimatePresence>
          {targets.map((t) => (
            <motion.div
              key={t.id}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={t.exploding ? { scale: 1.6, opacity: 0 } : { scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: t.exploding ? 0.35 : 0.25 }}
              className="absolute flex flex-col items-center pointer-events-none"
              style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translateX(-50%)' }}
            >
              <span className="text-3xl leading-none">{t.exploding ? '💥' : '🐔'}</span>
              {!t.exploding && (
                <span
                  className="mt-1 px-2 py-0.5 rounded-lg bg-indigo-900/80 text-indigo-200 text-xs font-bold whitespace-nowrap border border-indigo-700/50 backdrop-blur-sm"
                  style={{ fontFamily: 'var(--font-display)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {t.vietnamese}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {projectiles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute pointer-events-none"
              style={{ left: `${p.x}%`, bottom: '12%', transform: 'translateX(-50%)' }}
              initial={{ opacity: 1, scaleY: 0, top: `${p.fromY}%` }}
              animate={{ opacity: 0, scaleY: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-0.5 h-12 bg-gradient-to-t from-cyan-400 to-transparent rounded-full" />
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {explosions.map((e) => (
            <motion.div
              key={e.id}
              className="absolute pointer-events-none font-black text-yellow-300 text-sm"
              style={{
                left: `${e.x}%`,
                top: `${e.y}%`,
                fontFamily: 'var(--font-display)',
                textShadow: '0 0 8px rgba(251,191,36,0.8)',
              }}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -30, scale: 1.2 }}
              transition={{ duration: 0.8 }}
            >
              +{e.pts}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex flex-col items-center pb-6 pt-3 px-4">
        <div className="relative flex justify-center mb-3">
          <div className="w-16 h-8 bg-gradient-to-b from-slate-400 to-slate-600 rounded-t-full flex items-center justify-center border-2 border-slate-500 shadow-lg shadow-black/50">
            <Zap size={14} className="text-cyan-300" />
          </div>
        </div>

        <div className="w-full max-w-sm flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type English word…"
            className="flex-1 px-5 py-3 rounded-2xl bg-slate-800/80 border-2 border-indigo-700/60 text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors font-semibold text-sm"
            style={{ fontFamily: 'var(--font-display)' }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            onClick={() => tryShoot(input)}
            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/50 active:scale-95"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Fire!
          </button>
        </div>
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center max-w-xs w-full mx-4 shadow-2xl"
            >
              <div className="text-5xl mb-4">💀</div>
              <h2 className="text-white text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Game Over
              </h2>
              <p className="text-slate-400 text-sm mb-6 font-medium">The chickens got away...</p>

              <div className="flex justify-center gap-8 mb-6">
                <div>
                  <div className="text-white text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
                    {score}
                  </div>
                  <div className="text-slate-500 text-xs uppercase tracking-wide font-bold">Score</div>
                </div>
                <div>
                  <div className="text-indigo-400 text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
                    {highScore}
                  </div>
                  <div className="text-slate-500 text-xs uppercase tracking-wide font-bold">Best</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onExit}
                  className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800 transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Exit
                </button>
                <button
                  onClick={startGame}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/50 active:scale-95"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <RotateCcw size={13} /> Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
