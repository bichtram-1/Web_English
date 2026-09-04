import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ChickenMascotProps {
  src?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  animate?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-24 h-24',
  xl: 'w-36 h-36',
  hero: 'w-48 h-48 sm:w-60 sm:h-60 lg:w-72 lg:h-72',
};

/**
 * High-performance transparent Mascot component
 * Automatically cuts out solid white/light background from JPEG/PNG images
 * using canvas chroma-keying with smooth alpha edge anti-aliasing.
 */
export default function ChickenMascot({
  src = '/chicken_scholar.png',
  className = '',
  size = 'md',
  animate = true,
  interactive = true,
  onClick,
}: ChickenMascotProps) {
  const [transparentSrc, setTransparentSrc] = useState<string>(src);
  const [loaded, setLoaded] = useState(false);
  const [isWaving, setIsWaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          if (isMounted) {
            setTransparentSrc(src);
            setLoaded(true);
          }
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Auto background transparent cut-out algorithm
        // Replaces white and near-white pixels with transparent alpha & feathered edges
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]!;
          const g = data[i + 1]!;
          const b = data[i + 2]!;

          // If pixel is near-white (background)
          if (r > 228 && g > 228 && b > 228) {
            // Feathered transparency for smooth edges
            const brightness = (r + g + b) / 3;
            if (brightness > 245) {
              data[i + 3] = 0; // Fully transparent
            } else {
              // Smooth gradient falloff
              const alpha = Math.max(0, Math.min(255, (245 - brightness) * 15));
              data[i + 3] = alpha;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        if (isMounted) {
          setTransparentSrc(dataUrl);
          setLoaded(true);
        }
      } catch (e) {
        console.warn('Transparent cut-out fallback:', e);
        if (isMounted) {
          setTransparentSrc(src);
          setLoaded(true);
        }
      }
    };

    img.onerror = () => {
      if (isMounted) {
        setTransparentSrc('/iconChicken.png');
        setLoaded(true);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [src]);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  const handleClick = () => {
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 700);
    onClick?.();
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${interactive ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
    >
      {/* Dynamic Floor Shadow that shrinks/expands with float height */}
      {animate && (
        <motion.div
          animate={{
            scale: [1, 0.82, 1],
            opacity: [0.35, 0.18, 0.35],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-2 w-3/4 h-3 bg-slate-950/40 rounded-full blur-xs pointer-events-none"
        />
      )}

      {/* Floating Animated Mascot Character */}
      <motion.div
        animate={
          animate
            ? {
                y: isWaving ? [-10, 2, -6, 0] : [-5, 5, -5],
                rotate: isWaving ? [-6, 6, -3, 3, 0] : [-1, 1.5, -1],
                scale: isWaving ? [1, 1.08, 1] : [1, 1.015, 1],
              }
            : {}
        }
        transition={
          isWaving
            ? { duration: 0.7, ease: 'easeOut' }
            : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
        }
        whileHover={interactive ? { scale: 1.08, rotate: 2 } : {}}
        whileTap={interactive ? { scale: 0.95 } : {}}
        className={`relative z-10 ${sizeClass} flex items-center justify-center`}
      >
        <img
          src={transparentSrc}
          alt="Học Giả Gà"
          className={`w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)] transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
        />
      </motion.div>
    </div>
  );
}
