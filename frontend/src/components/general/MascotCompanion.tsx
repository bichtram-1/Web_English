import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  X,
  Image,
  ChevronRight,
  Gamepad2,
  GripHorizontal,
} from 'lucide-react';
import useSpeech from '../../hooks/useSpeech';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { playCorrectSound } from '../../utils/soundEffects';
import { ROUTES } from '../../constants/routers';
import ChickenMascot from './ChickenMascot';

const MASCOT_QUOTES_VI = [
  {
    text: 'Chào bạn! Mình là Học Giả Gà 🐔. Hôm nay bạn muốn chinh phục bao nhiêu từ mới nào?',
    badge: 'Đồng hành',
  },
  {
    text: 'Mẹo nhỏ nè: Hãy ôn lại từ vựng ngắt quãng đều đặn mỗi ngày trước khi não bộ kịp quên nhé! 🧠',
    badge: 'Mẹo học',
  },
  {
    text: 'Hãy thử ngay Đấu Trường Trò Chơi: Săn Kho Báu và Lật Thẻ để vừa giải trí vừa nhớ từ siêu lâu! 🎮',
    badge: 'Trò chơi',
  },
  {
    text: 'Bạn có thể tự đổi hình nền không gian học tập ở nút tùy chỉnh nền phía góc dưới đấy! 🎨',
    badge: 'Hình nền',
  },
  {
    text: 'Mỗi ngày tích lũy một chút kiến thức, sau một năm bạn sẽ bất ngờ với vốn tiếng Anh của mình! 🚀',
    badge: 'Động lực',
  },
  {
    text: 'Đừng ngại phát âm to rõ từng từ. Tai nghe và miệng nói sẽ kích hoạt tối đa phản xạ ngôn ngữ! 🗣️',
    badge: 'Kỹ năng',
  },
];

const MASCOT_QUOTES_EN = [
  {
    text: 'Hello! I am Chicken Scholar 🐔. Ready to master new vocabulary today?',
    badge: 'Companion',
  },
  {
    text: 'Pro-tip: Use the SM-2 Spaced Repetition System to review cards right before memory fades! 🧠',
    badge: 'SM-2 Tip',
  },
  {
    text: 'Try the Treasure Hunt & Memory Card Match games in the Arcade! 🎮',
    badge: 'Minigame',
  },
  {
    text: 'Customize your study wallpaper like Google home page to stay inspired! 🎨',
    badge: 'Wallpaper',
  },
  {
    text: 'Small daily steps create massive English fluency over time! Keep going! 🚀',
    badge: 'Motivation',
  },
  {
    text: 'Always speak out loud when flipping flashcards to boost active recall! 🗣️',
    badge: 'Speaking',
  },
];

export default function MascotCompanion() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isVi = i18n.language === 'vi';
  const quotes = isVi ? MASCOT_QUOTES_VI : MASCOT_QUOTES_EN;

  const { speak, stop, isSpeaking } = useSpeech();
  const { setIsModalOpen: setWallpaperModalOpen } = useWallpaper();

  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [isBubbleOpen, setIsBubbleOpen] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const currentQuote = quotes[quoteIndex] || quotes[0]!;

  // Auto cycle quotes periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 18000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
      return;
    }
    speak(currentQuote.text, isVi ? 'vi-VN' : 'en-US');
  };

  const handleMascotClick = () => {
    playCorrectSound();
    setHasInteracted(true);
    setQuoteIndex((prev) => (prev + 1) % quotes.length);
    setIsBubbleOpen(true);
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.08}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setTimeout(() => setIsDragging(false), 80);
      }}
      whileDrag={{ scale: 1.03 }}
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end pointer-events-none select-none touch-none"
    >
      {/* Speech Bubble Card */}
      <AnimatePresence>
        {isBubbleOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto mb-3 max-w-[280px] sm:max-w-xs p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-slate-200/90 dark:border-slate-700/90 shadow-2xl shadow-slate-900/20 text-slate-800 dark:text-slate-100 relative"
          >
            {/* Triangular Tail */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white dark:bg-slate-900 border-r border-b border-slate-200/90 dark:border-slate-700/90 transform rotate-45 pointer-events-none" />

            {/* Bubble Header - Acts as Drag Handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between gap-2 mb-2 cursor-grab active:cursor-grabbing select-none"
              title={isVi ? 'Kéo để di chuyển vị trí' : 'Drag to move'}
            >
              <div className="flex items-center gap-1.5">
                <GripHorizontal size={13} className="text-slate-400 hover:text-amber-500 transition-colors" />
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider border border-amber-200/60 dark:border-amber-800/60">
                  {currentQuote.badge}
                </span>
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                  {isVi ? 'Học Giả Gà' : 'Scholar Chicken'}
                </span>
              </div>

              <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                {/* Audio TTS button */}
                <button
                  onClick={handleSpeak}
                  title={isSpeaking ? (isVi ? 'Dừng đọc' : 'Stop speaking') : (isVi ? 'Nghe Học Giả Gà đọc' : 'Listen to Scholar Chicken')}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    isSpeaking
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800 animate-pulse'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Volume2 size={14} />
                </button>

                {/* Close bubble button */}
                <button
                  onClick={() => setIsBubbleOpen(false)}
                  title={isVi ? 'Ẩn bóng thoại' : 'Close bubble'}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Bubble Content */}
            <p className="text-xs leading-relaxed font-medium mb-3">
              {currentQuote.text}
            </p>

            {/* Quick Action Shortcuts inside mascot */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800"
            >
              <button
                onClick={() => navigate(ROUTES.GAMES)}
                className="flex-1 py-1 px-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Gamepad2 size={11} />
                <span>{isVi ? 'Trò Chơi' : 'Arcade'}</span>
              </button>

              <button
                onClick={() => setWallpaperModalOpen(true)}
                className="flex-1 py-1 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Image size={11} />
                <span>{isVi ? 'Hình Nền' : 'Wallpaper'}</span>
              </button>

              <button
                onClick={() => setQuoteIndex((prev) => (prev + 1) % quotes.length)}
                className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-[10px] flex items-center justify-center gap-0.5 transition-all cursor-pointer"
              >
                <span>{isVi ? 'Khác' : 'Next'}</span>
                <ChevronRight size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Single Avatar Container */}
      <div className="pointer-events-auto flex flex-col items-center">
        {/* Realistic Transparent Mascot with Animated Physics */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => {
            if (!isDragging) {
              handleMascotClick();
            }
          }}
          className="relative cursor-grab active:cursor-grabbing touch-manipulation flex flex-col items-center justify-center group"
          title={isVi ? 'Kéo để di chuyển • Nhấn để trò chuyện cùng Học Giả Gà' : 'Drag to move • Click to chat'}
        >
          {/* Subtle glowing halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 blur-xl opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none" />

          {/* Chicken Mascot Transparent Cutout Component */}
          <ChickenMascot size="lg" animate interactive />

          {/* Notification ping badge */}
          <span className="absolute top-1 right-2 z-20 flex h-3.5 w-3.5 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </span>

          {/* Draggable hint pill below mascot */}
          <div className="mt-1 px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <GripHorizontal size={11} className="text-amber-500" />
            <span>{isVi ? 'Kéo di chuyển' : 'Drag'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

