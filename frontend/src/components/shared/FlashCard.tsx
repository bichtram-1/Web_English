import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import type { FlashcardItem } from '../../types/DeckType';

interface FlashCardProps {
  card: FlashcardItem;
  onFlipped: () => void;
}

export default function FlashCard({ card, onFlipped }: FlashCardProps) {
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

  const handleFlip = () => {
    if (!flipped) {
      setFlipped(true);
      if (!hasFlipped) {
        setHasFlipped(true);
        onFlipped();
      }
    } else {
      setFlipped(false);
    }
  };

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ perspective: '1200px', width: '100%', maxWidth: '480px', height: '280px' }}
      onClick={handleFlip}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 20px 60px rgba(79,70,229,0.35)',
          }}
        >
          <span className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-4">
            English
          </span>
          <h2
            className="text-white text-center leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800 }}
          >
            {card.front}
          </h2>

          {/* Speaker button */}
          <button
            onClick={(e) => { e.stopPropagation(); speakWord(card.front); }}
            className="mt-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all"
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
            <span className="text-white/80 text-xs font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {speaking ? 'Playing…' : 'Listen'}
            </span>
          </button>

          <span className="text-indigo-300 text-sm mt-3 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            Tap to reveal
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)',
            boxShadow: '0 20px 60px rgba(79,70,229,0.18)',
            border: '2px solid #e0e7ff',
          }}
        >
          <span className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Vietnamese
          </span>
          <h2
            className="text-indigo-900 text-center leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)', fontWeight: 800 }}
          >
            {card.back}
          </h2>
          <span className="text-indigo-300 text-sm mt-6 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            Tap to flip back
          </span>
        </div>
      </motion.div>
    </div>
  );
}
