import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { languagesSupport, LANGUAGESUPPORT } from '../../constants/languages';
import { STORAGE_KEYS } from '../../constants/storage';

interface LanguageSelectProps {
  className?: string;
  mini?: boolean;
}

export default function LanguageSelect({ className = '', mini = false }: LanguageSelectProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = (i18n.language === 'en' ? LANGUAGESUPPORT.en : LANGUAGESUPPORT.vi) as LANGUAGESUPPORT;
  const currentOption = languagesSupport.find((l) => l.key === currentLang) || languagesSupport[0];

  const handleSelect = (lang: LANGUAGESUPPORT) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (e) {
      console.error('Error saving language:', e);
    }
    setIsOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer border
          ${
            isOpen
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
              : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200 border-slate-200/80 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700/90 dark:border-slate-700'
          }`}
        title={t('language_select_title')}
        aria-label="Select Language"
      >
        <span className="text-sm">{currentOption.flag}</span>
        {!mini && <span className="font-bold tracking-tight">{currentOption.shortLabel}</span>}
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1.5 w-38 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 py-1.5 z-50 overflow-hidden"
          >
            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
              <Globe size={11} className="inline mr-1 -mt-0.5" />
              {t('language_select_title')}
            </div>

            <div className="p-1 space-y-0.5">
              {languagesSupport.map((option) => {
                const isSelected = option.key === currentLang;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleSelect(option.key)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer
                      ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{option.flag}</span>
                      <span>{option.label}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
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
