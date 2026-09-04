import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Volume1, Check, Settings2, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isSoundEnabled, toggleSound } from '../../utils/soundEffects';

interface GameAudioMenuProps {
  autoPronounce: boolean;
  onTogglePronounce: (val: boolean) => void;
  className?: string;
}

export default function GameAudioMenu({
  autoPronounce,
  onTogglePronounce,
  className = '',
}: GameAudioMenuProps) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const [isOpen, setIsOpen] = useState(false);
  const [soundEffectsOn, setSoundEffectsOn] = useState(() => isSoundEnabled());
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggleSoundEffects = () => {
    const next = toggleSound();
    setSoundEffectsOn(next);
  };

  const isAnyAudioActive = soundEffectsOn || autoPronounce;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Single Unified Audio Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isVi ? 'Cài đặt âm thanh & phát âm' : 'Audio & Pronunciation Settings'}
        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
            : isAnyAudioActive
            ? 'bg-slate-800/80 border-slate-700 text-amber-300 hover:text-white hover:bg-slate-700'
            : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-400'
        }`}
      >
        {isAnyAudioActive ? <Volume2 size={17} /> : <VolumeX size={17} />}
      </button>

      {/* Floating Audio Settings Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-72 p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl z-50 text-slate-200 select-none"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800 text-xs font-bold text-slate-400">
              <span>{isVi ? 'TÙY CHỈNH ÂM THANH' : 'AUDIO SETTINGS'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {isAnyAudioActive ? (isVi ? 'Đang bật' : 'Active') : (isVi ? 'Đã tắt hết' : 'Muted')}
              </span>
            </div>

            {/* Option 1: Game Sound Effects */}
            <div
              onClick={handleToggleSoundEffects}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/70 transition-colors cursor-pointer mb-1.5"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    soundEffectsOn
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Volume2 size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isVi ? 'Hiệu ứng âm thanh' : 'Game Sound Effects'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isVi ? 'Lật thẻ, đúng/sai, combo, rương báu' : 'Flips, matches, fanfare, combo'}
                  </div>
                </div>
              </div>

              {/* iOS-style toggle switch */}
              <div
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  soundEffectsOn ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <motion.div
                  layout
                  className={`w-4 h-4 rounded-full bg-white shadow-md ${
                    soundEffectsOn ? 'ml-auto' : ''
                  }`}
                />
              </div>
            </div>

            {/* Option 2: Auto Pronunciation TTS */}
            <div
              onClick={() => onTogglePronounce(!autoPronounce)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    autoPronounce
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Volume1 size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isVi ? 'Đọc phát âm tiếng Anh' : 'Auto Pronunciation'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isVi ? 'Tự động phát âm từ khi ghép đúng' : 'Speak English words on match'}
                  </div>
                </div>
              </div>

              {/* iOS-style toggle switch */}
              <div
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  autoPronounce ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <motion.div
                  layout
                  className={`w-4 h-4 rounded-full bg-white shadow-md ${
                    autoPronounce ? 'ml-auto' : ''
                  }`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
