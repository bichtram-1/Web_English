import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Brain, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import type { SrsStudyMode } from './SrsModeSwitchMenu';

interface SrsModeKickoffModalProps {
  isOpen: boolean;
  dueCount: number;
  onSelectMode: (mode: SrsStudyMode, rememberChoice: boolean) => void;
  defaultMode?: SrsStudyMode;
}

export default function SrsModeKickoffModal({
  isOpen,
  dueCount,
  onSelectMode,
  defaultMode = 'flashcard',
}: SrsModeKickoffModalProps) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [selectedMode, setSelectedMode] = useState<SrsStudyMode>(defaultMode);
  const [rememberChoice, setRememberChoice] = useState(true);

  if (!isOpen) return null;

  const modeCards: {
    id: SrsStudyMode;
    title: string;
    desc: string;
    icon: string;
    badge: string;
    color: string;
  }[] = [
    {
      id: 'flashcard',
      title: isVi ? 'Lật Thẻ Flashcard' : 'Flashcard Flip',
      desc: isVi
        ? 'Duyệt nhanh từng thẻ, tự đánh giá mức độ nhớ theo 4 phím số 1, 2, 3, 4.'
        : 'Review cards one by one and grade your recall with keys 1 to 4.',
      icon: '🎴',
      badge: isVi ? 'Cổ điển · Nhanh' : 'Classic · Fast',
      color: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100',
    },
    {
      id: 'match',
      title: isVi ? 'Ghép Nghĩa Duolingo' : 'Duolingo Matching',
      desc: isVi
        ? 'Mở ngửa 2 cột Anh – Việt (5-6 cặp/lượt). Chạm cặp đúng để ăn điểm phản xạ.'
        : 'Open 2-column English-Vietnamese tiles. Tap matching pairs quickly.',
      icon: '🧩',
      badge: isVi ? 'Vui vẻ · Phản xạ' : 'Fun · Reflex',
      color: 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-100',
    },
    {
      id: 'written',
      title: isVi ? 'Luyện Gõ Chính Tả' : 'Spelling Practice',
      desc: isVi
        ? 'Nhìn nghĩa tiếng Việt và gõ lại từ tiếng Anh. Mức độ khắc sâu trí nhớ cao nhất.'
        : 'Type the English word from Vietnamese meaning. Highest memory retention.',
      icon: '✍️',
      badge: isVi ? 'Khắc sâu · Thử thách' : 'Deep · Mastery',
      color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Brain size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {isVi ? `Đợt Ôn Tập SRS (${dueCount} từ đến hạn)` : `SRS Review Batch (${dueCount} due cards)`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isVi ? 'Chọn phương thức bạn muốn ôn hôm nay:' : 'Choose your study mode for today:'}
              </p>
            </div>
          </div>

          {/* 3 Mode Cards */}
          <div className="space-y-3 mb-5">
            {modeCards.map((mode) => {
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 relative ${
                    isSelected
                      ? `${mode.color} ring-2 ring-indigo-500/30 shadow-md`
                      : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-2xl mt-0.5">{mode.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                        {mode.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {mode.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Remember Choice Checkbox */}
          <label className="flex items-center gap-2.5 px-2 mb-5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400 select-none">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
            />
            <span>{isVi ? 'Ghi nhớ lựa chọn này cho các lần sau (vào thẳng không hỏi lại)' : 'Remember this choice for next times (launch directly)'}</span>
          </label>

          {/* Action button */}
          <button
            type="button"
            onClick={() => onSelectMode(selectedMode, rememberChoice)}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>{isVi ? 'Bắt Đầu Ôn Tập Ngay' : 'Start Review Now'}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
