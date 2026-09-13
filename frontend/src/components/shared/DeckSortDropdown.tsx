import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, Clock, ArrowDownAz, ArrowUpZa, Check, ChevronDown } from 'lucide-react';
import type { DeckSortOption } from '../../utils/recentDecks';

interface DeckSortDropdownProps {
  value: DeckSortOption;
  onChange: (value: DeckSortOption) => void;
  className?: string;
  compact?: boolean;
}

export default function DeckSortDropdown({
  value,
  onChange,
  className = '',
  compact = false,
}: DeckSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const options: {
    id: DeckSortOption;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'recent',
      label: isVi ? 'Các mục gần đây' : 'Recent items',
      description: isVi ? 'Bộ thẻ vừa xem, học hoặc tạo gần đây' : 'Recently viewed, studied or created',
      icon: <Clock size={16} className="text-amber-500 shrink-0" />,
    },
    {
      id: 'title',
      label: isVi ? 'Tiêu đề (A-Z)' : 'Title (A-Z)',
      description: isVi ? 'Sắp xếp theo thứ tự bảng chữ cái' : 'Sort alphabetically from A to Z',
      icon: <ArrowDownAz size={16} className="text-indigo-500 shrink-0" />,
    },
    {
      id: 'title-desc',
      label: isVi ? 'Tiêu đề (Z-A)' : 'Title (Z-A)',
      description: isVi ? 'Sắp xếp theo thứ tự chữ cái ngược lại' : 'Sort alphabetically from Z to A',
      icon: <ArrowUpZa size={16} className="text-indigo-500 shrink-0" />,
    },
  ];

  const currentOption = options.find((opt) => opt.id === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button - Quizlet style */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-sm hover:shadow-md text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer select-none active:scale-95 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm'
        } ${isOpen ? 'ring-2 ring-indigo-500/30 border-indigo-500' : ''}`}
        style={{ fontFamily: 'var(--font-display)' }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <ArrowUpDown size={compact ? 14 : 15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 dark:text-slate-500 text-xs hidden sm:inline">
            {isVi ? 'Sắp xếp:' : 'Sort:'}
          </span>
          <span className="font-extrabold text-slate-800 dark:text-slate-100">
            {currentOption.label}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-500' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/90 shadow-2xl z-50 overflow-hidden py-1.5 ring-1 ring-black/5 dark:ring-white/10"
            role="listbox"
          >
            <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
              {isVi ? 'Tùy chọn sắp xếp (như Quizlet)' : 'Sort options (Quizlet style)'}
            </div>

            <div className="p-1 space-y-1">
              {options.map((option) => {
                const isSelected = option.id === value;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div className="mt-0.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                        {option.icon}
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-xs font-bold leading-snug ${
                            isSelected ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''
                          }`}
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {option.label}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5 truncate">
                          {option.description}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
