import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakFlameIconProps {
  isLit: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showParticles?: boolean;
}

const sizeMap = {
  xs: { iconSize: 14, container: 'w-5 h-5' },
  sm: { iconSize: 18, container: 'w-7 h-7' },
  md: { iconSize: 24, container: 'w-10 h-10' },
  lg: { iconSize: 32, container: 'w-14 h-14' },
  xl: { iconSize: 44, container: 'w-20 h-20' },
};

export default function StreakFlameIcon({
  isLit,
  size = 'md',
  className = '',
  showParticles = true,
}: StreakFlameIconProps) {
  const { iconSize, container } = sizeMap[size];

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${container} ${className}`}>
      {/* Lit state: Fiery ambient glow background */}
      {isLit ? (
        <>
          {/* Outer Pulsing Aura */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0.65, 0.35],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 blur-md pointer-events-none"
          />

          {/* Drifting Ember Particles */}
          {showParticles && (size === 'md' || size === 'lg' || size === 'xl') && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              <motion.span
                animate={{
                  y: [0, -18, -26],
                  x: [0, -4, -8],
                  opacity: [0, 0.9, 0],
                  scale: [0.6, 1, 0.4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: 'easeOut',
                  delay: 0.2,
                }}
                className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-xs shadow-amber-400"
              />
              <motion.span
                animate={{
                  y: [0, -22, -32],
                  x: [0, 5, 8],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.1, 0.3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.1,
                  ease: 'easeOut',
                  delay: 0.8,
                }}
                className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-orange-400 shadow-xs shadow-orange-500"
              />
              <motion.span
                animate={{
                  y: [0, -14, -22],
                  x: [0, 2, 4],
                  opacity: [0, 0.8, 0],
                  scale: [0.4, 0.9, 0.2],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.6,
                  ease: 'easeOut',
                  delay: 1.2,
                }}
                className="absolute top-2 right-1/2 w-1 h-1 rounded-full bg-yellow-200"
              />
            </div>
          )}

          {/* Active Blazing Flame Icon */}
          <motion.div
            animate={{
              scale: [1, 1.08, 0.97, 1.05, 1],
              rotate: [0, -2.5, 2, -1.5, 0],
              y: [0, -1, 1, -1, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.4,
              ease: 'easeInOut',
            }}
            className="relative z-10 text-orange-500 filter drop-shadow-[0_2px_8px_rgba(249,115,22,0.7)]"
          >
            <Flame
              size={iconSize}
              className="fill-gradient stroke-orange-500"
              style={{
                fill: 'url(#flameGradient)',
              }}
            />
            {/* SVG Gradient Definition */}
            <svg width="0" height="0" className="absolute">
              <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="45%" stopColor="#f97316" />
                <stop offset="90%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#fef08a" />
              </linearGradient>
            </svg>
          </motion.div>
        </>
      ) : (
        /* Unlit state: Dimmed, cold, grayscale outline */
        <motion.div
          initial={{ opacity: 0.7 }}
          animate={{ opacity: [0.65, 0.8, 0.65] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="relative z-10 text-slate-400 dark:text-slate-500"
        >
          <Flame
            size={iconSize}
            className="stroke-slate-400 dark:stroke-slate-500 stroke-[1.8] fill-slate-200/50 dark:fill-slate-800/60"
          />
        </motion.div>
      )}
    </div>
  );
}
