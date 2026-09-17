import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface UseDoubleEscExitOptions {
  onExit: () => void;
  // When true (e.g. game over / completion screen), single Esc exits immediately
  isCompleted?: boolean;
  // If any modal/dialog is currently open, Escape will close that modal first
  hasActiveModal?: boolean;
  onCloseModal?: () => void;
  // Time window for double press in ms (default 2000ms)
  thresholdMs?: number;
  // Disable hook when not applicable
  disabled?: boolean;
}

export function useDoubleEscExit({
  onExit,
  isCompleted = false,
  hasActiveModal = false,
  onCloseModal,
  thresholdMs = 2000,
  disabled = false,
}: UseDoubleEscExitOptions) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [showToast, setShowToast] = useState(false);
  const lastPressTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest callbacks in refs so the keydown listener doesn't need to re-bind constantly
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const onCloseModalRef = useRef(onCloseModal);
  onCloseModalRef.current = onCloseModal;
  const hasActiveModalRef = useRef(hasActiveModal);
  hasActiveModalRef.current = hasActiveModal;
  const isCompletedRef = useRef(isCompleted);
  isCompletedRef.current = isCompleted;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabledRef.current) return;
      if (e.key !== 'Escape') return;

      // 1. If any modal is active, close the modal first and reset double-press timer
      if (hasActiveModalRef.current) {
        e.preventDefault();
        e.stopPropagation();
        lastPressTimeRef.current = 0;
        setShowToast(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        onCloseModalRef.current?.();
        return;
      }

      // 2. If already completed (results / completion screen), single Esc exits immediately!
      if (isCompletedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onExitRef.current();
        return;
      }

      // 3. Normal active state: double-tap Esc logic
      const now = Date.now();
      const elapsed = now - lastPressTimeRef.current;

      if (elapsed > 0 && elapsed <= thresholdMs) {
        // Second press within threshold -> EXIT
        e.preventDefault();
        e.stopPropagation();
        if (timerRef.current) clearTimeout(timerRef.current);
        lastPressTimeRef.current = 0;
        setShowToast(false);
        onExitRef.current();
      } else {
        // First press -> show toast & start timer
        e.preventDefault();
        e.stopPropagation();
        lastPressTimeRef.current = now;
        setShowToast(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShowToast(false);
          lastPressTimeRef.current = 0;
        }, thresholdMs);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [thresholdMs]);

  // Portal Toast Element
  const toastElement =
    typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 25, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none"
              >
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md shadow-2xl border border-slate-700/70 dark:border-slate-600/70 text-xs sm:text-sm font-semibold select-none"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <LogOut size={15} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>{isVi ? 'Nhấn' : 'Press'}</span>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-slate-800 dark:bg-slate-700 border border-slate-600 dark:border-slate-500 font-mono text-xs font-black text-amber-300 shadow-inner">
                      Esc
                    </kbd>
                    <span>{isVi ? 'lần nữa để thoát' : 'again to exit'}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  return {
    showToast,
    toastElement,
  };
}
