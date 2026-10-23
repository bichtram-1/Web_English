import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Check, Sparkles } from 'lucide-react';

export type SrsStudyMode = 'flashcard' | 'match' | 'written';

interface SrsModeSwitchMenuProps {
  currentMode: SrsStudyMode;
  onSelectMode: (mode: SrsStudyMode) => void;
}

export default function SrsModeSwitchMenu({
  currentMode,
  onSelectMode,
}: SrsModeSwitchMenuProps) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const modeOptions: { id: SrsStudyMode; title: string; subtitle: string; icon: string }[] = [
    {
      id: 'flashcard',
      title: isVi ? 'Lật Thẻ Flashcard' : 'Flashcard Flip',
      subtitle: isVi ? 'Tự chấm điểm 1, 2, 3, 4' : 'Self-rate 1, 2, 3, 4',
      icon: '🎴',
    },
    {
      id: 'match',
      title: isVi ? 'Ghép Nghĩa Duolingo' : 'Duolingo Match',
      subtitle: isVi ? '2 cột mở ngửa, phản xạ nhanh' : '2-column open matching',
      icon: '🧩',
    },
    {
      id: 'written',
      title: isVi ? 'Luyện Gõ Chính Tả' : 'Spelling Practice',
      subtitle: isVi ? 'Nhìn nghĩa gõ từ tiếng Anh' : 'Type English word from meaning',
      icon: '✍️',
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
        title={isVi ? 'Đổi phương thức ôn tập' : 'Change review mode'}
      >
        <RotateCcw size={13} className="text-indigo-500" />
        <span className="hidden sm:inline">{isVi ? 'Đổi cách học' : 'Switch Mode'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 flex flex-col gap-1 text-left"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isVi ? 'Đổi phương thức ôn' : 'Select Mode'}
              </span>
              <Sparkles size={12} className="text-amber-500" />
            </div>

            {modeOptions.map((opt) => {
              const isSelected = currentMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectMode(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/80 shadow-2xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{opt.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-tight">{opt.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {opt.subtitle}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
