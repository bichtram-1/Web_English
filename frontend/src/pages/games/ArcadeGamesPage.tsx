import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Sparkles,
  Crown,
  Leaf,
  PenLine,
  Target,
  Play,
  Layers,
  CheckCircle2,
  ArrowRight,
  Flame,
  X,
  BookOpen,
} from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import ChickenMascot from '../../components/general/ChickenMascot';
import {
  getMatchRoute,
  getMinigameRoute,
  getZenRoute,
  getWrittenRoute,
  getTreasureRoute,
  ROUTES,
} from '../../constants/routers';
import type { Deck } from '../../types/DeckType';

interface GameItem {
  id: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  badge: string;
  icon: React.ReactNode;
  gradient: string;
  borderGlow: string;
  getRoute: (deckId: string) => string;
}

export default function ArcadeGamesPage() {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const navigate = useNavigate();
  const { decks } = useDecks();

  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [isDeckSelectOpen, setIsDeckSelectOpen] = useState(false);

  const publicDecks = decks.filter((d) => d.isPublic !== false);
  const defaultDeckId = publicDecks[0]?.id || 'all';

  const games: GameItem[] = [
    {
      id: 'treasure',
      titleVi: '🏴‍☠️ Truy Tìm Kho Báu',
      titleEn: '🏴‍☠️ Treasure Hunt Quest',
      descVi: 'Giải mã mật mã từ vựng bị xáo trộn, chọn nghĩa chuẩn xác và sắp xếp chữ cái để mở rương báu hoàng gia.',
      descEn: 'Decode anagram passwords, choose correct definitions, and assemble letters to unlock golden royal chests.',
      badge: isVi ? 'Thám hiểm 🏴‍☠️' : 'Adventure 🏴‍☠️',
      icon: <Crown size={28} className="text-amber-300" />,
      gradient: 'from-amber-600 via-orange-600 to-yellow-600',
      borderGlow: 'hover:border-amber-400 hover:shadow-amber-500/20',
      getRoute: (deckId) => getTreasureRoute(deckId),
    },
    {
      id: 'match',
      titleVi: '🃏 Lật Thẻ Ghép Đôi',
      titleEn: '🃏 Memory Card Match',
      descVi: 'Ghi nhớ vị trí thẻ trong 3-5 giây đầu, sau đó lật các cặp thẻ Tiếng Anh & Tiếng Việt tương ứng nghĩa.',
      descEn: 'Memorize card positions during preview countdown, then flip matching English and Vietnamese pairs.',
      badge: isVi ? 'Trí nhớ 🧠' : 'Memory 🧠',
      icon: <Sparkles size={28} className="text-violet-300" />,
      gradient: 'from-indigo-600 via-violet-600 to-purple-600',
      borderGlow: 'hover:border-indigo-400 hover:shadow-indigo-500/20',
      getRoute: (deckId) => getMatchRoute(deckId),
    },
    {
      id: 'shooter',
      titleVi: '🎯 Typing Shooter (Bắn Chữ)',
      titleEn: '🎯 Typing Shooter',
      descVi: 'Gõ nhanh chính xác từ vựng tiếng Anh để bắn hạ các mục tiêu đang rơi từ trên cao xuống.',
      descEn: 'Type English words fast and accurately to shoot falling target chickens before they hit the ground.',
      badge: isVi ? 'Tốc độ ⚡' : 'Speed ⚡',
      icon: <Target size={28} className="text-rose-300" />,
      gradient: 'from-rose-600 via-pink-600 to-red-600',
      borderGlow: 'hover:border-rose-400 hover:shadow-rose-500/20',
      getRoute: (deckId) => getMinigameRoute(deckId),
    },
    {
      id: 'zen',
      titleVi: '🌿 Xây Dựng Thế Giới Zen',
      titleEn: '🌿 Zen World Builder',
      descVi: 'Không gian học bình yên không áp lực. Mỗi từ vựng ôn tập đúng sẽ nuôi dưỡng một ốc đảo thiên nhiên.',
      descEn: 'Peaceful learning without pressure. Each correct review nurtures plants and creatures in your sanctuary.',
      badge: isVi ? 'Thư giãn 🍃' : 'Relax 🍃',
      icon: <Leaf size={28} className="text-emerald-300" />,
      gradient: 'from-emerald-600 via-teal-600 to-green-600',
      borderGlow: 'hover:border-emerald-400 hover:shadow-emerald-500/20',
      getRoute: (deckId) => getZenRoute(deckId),
    },
    {
      id: 'written',
      titleVi: '✍️ Luyện Gõ Từ Vựng',
      titleEn: '✍️ Written Practice',
      descVi: 'Luyện phản xạ nhập từ vựng 2 chiều EN ↔ VI với kiểm tra ký tự tức thì và gợi ý phát âm.',
      descEn: 'Dual-way EN ↔ VI typing practice with instant character feedback and native pronunciation.',
      badge: isVi ? 'Phản xạ 💡' : 'Reflex 💡',
      icon: <PenLine size={28} className="text-cyan-300" />,
      gradient: 'from-cyan-600 via-blue-600 to-indigo-600',
      borderGlow: 'hover:border-cyan-400 hover:shadow-cyan-500/20',
      getRoute: (deckId) => getWrittenRoute(deckId),
    },
  ];

  const handlePlayDirect = (game: GameItem) => {
    navigate(game.getRoute(defaultDeckId));
  };

  const handleOpenDeckSelect = (game: GameItem) => {
    setSelectedGame(game);
    setIsDeckSelectOpen(true);
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-[1700px] w-full mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border border-indigo-500/30 p-6 sm:p-10 mb-8 shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-extrabold text-xs mb-3">
              <Gamepad2 size={15} />
              <span>{isVi ? 'Đấu Trường Trò Chơi Học Tập' : 'Interactive Learning Arcade'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
              {isVi ? 'Vừa Chơi Vừa Lên Trình' : 'Play & Master'}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">
                Tiếng Anh
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
              {isVi
                ? 'Tổng hợp 5 trò chơi phản xạ, ghi nhớ và săn kho báu giúp bạn nạp từ vựng tự nhiên không gò bó!'
                : 'Enjoy 5 gamified learning modes to master vocabulary naturally without pressure!'}
            </p>
          </div>

          {/* Transparent Floating Mascot */}
          <div className="shrink-0 flex flex-col items-center">
            <ChickenMascot size="xl" animate interactive />
            <span className="text-xs font-bold text-amber-300 mt-2">Học Giả Gà Đồng Hành 🐔</span>
          </div>
        </div>
      </div>

      {/* Game Cards Grid (5 columns on desktop/wide screen) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 mb-12">
        {games.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`group rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-lg transition-all duration-300 hover:-translate-y-1.5 ${game.borderGlow}`}
          >
            <div>
              {/* Header with Icon and Badge */}
              <div className="flex items-center justify-between mb-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${game.gradient} text-white flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-105 transition-transform`}
                >
                  {game.icon}
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-700">
                  {game.badge}
                </span>
              </div>

              {/* Title & Desc */}
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white mb-1.5 leading-snug">
                {isVi ? game.titleVi : game.titleEn}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5 line-clamp-3">
                {isVi ? game.descVi : game.descEn}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handlePlayDirect(game)}
                className={`w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r ${game.gradient} hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98`}
              >
                <Play size={15} fill="currentColor" />
                <span>{isVi ? 'Chơi Ngay' : 'Play Instant'}</span>
              </button>

              <button
                onClick={() => handleOpenDeckSelect(game)}
                className="w-full py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BookOpen size={12} />
                <span>{isVi ? 'Chọn bộ thẻ' : 'Select Deck'}</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Select Deck Modal */}
      <AnimatePresence>
        {isDeckSelectOpen && selectedGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎮</span>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    {isVi ? 'Chọn Bộ Thẻ Luyện Tập' : 'Select Deck'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsDeckSelectOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                {isVi ? 'Chọn bộ từ vựng bạn muốn chơi:' : 'Pick a vocabulary deck to play with:'}
              </p>

              <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1">
                {publicDecks.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setIsDeckSelectOpen(false);
                      navigate(selectedGame.getRoute(d.id));
                    }}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{d.title}</h4>
                      <span className="text-[11px] text-slate-400">{d.cards.length} từ vựng · {d.category}</span>
                    </div>
                    <ArrowRight size={16} className="text-indigo-500" />
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsDeckSelectOpen(false);
                  navigate(selectedGame.getRoute('all'));
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
              >
                {isVi ? 'Chơi ngẫu nhiên toàn bộ từ vựng' : 'Play with all cards'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
