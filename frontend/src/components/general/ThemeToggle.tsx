import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative flex items-center gap-2 p-2 rounded-xl transition-all duration-200 cursor-pointer select-none
        ${
          isDark
            ? 'bg-slate-800/90 text-amber-400 hover:bg-slate-700/90 border border-slate-700'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
        } ${className}`}
      title={isDark ? 'Chuyển sang chế độ Sáng (Light Mode)' : 'Chuyển sang chế độ Tối (Dark Mode)'}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="dark-icon"
              initial={{ rotate: -45, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 45, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={16} className="text-indigo-400" />
            </motion.div>
          ) : (
            <motion.div
              key="light-icon"
              initial={{ rotate: 45, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -45, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={16} className="text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {isDark ? 'Tối' : 'Sáng'}
        </span>
      )}
    </button>
  );
}
