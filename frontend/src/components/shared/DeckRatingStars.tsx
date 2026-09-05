import { useState } from 'react';
import { Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface DeckRatingStarsProps {
  rating?: number;
  ratingCount?: number;
  userRating?: number;
  interactive?: boolean;
  onRate?: (score: number) => void | Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const STAR_LABELS_VI = ['', 'Rất tệ', 'Tạm được', 'Hữu ích', 'Rất tốt', 'Tuyệt vời & Xuất sắc!'];
const STAR_LABELS_EN = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

export default function DeckRatingStars({
  rating,
  ratingCount,
  userRating,
  interactive = false,
  onRate,
  size = 'sm',
  showCount = true,
}: DeckRatingStarsProps) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const starLabels = isVi ? STAR_LABELS_VI : STAR_LABELS_EN;

  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [currentUserRating, setCurrentUserRating] = useState<number | undefined>(userRating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justRated, setJustRated] = useState(false);

  const starSizes = {
    sm: 12,
    md: 16,
    lg: 22,
  };

  const hasRatings = (ratingCount !== undefined && ratingCount > 0) || (rating !== undefined && rating > 0 && ratingCount !== 0);
  const displayRating = rating !== undefined && rating > 0 ? rating : 5.0;
  const currentScore = hoveredStar || currentUserRating || (hasRatings ? Math.round(displayRating) : 0);

  const handleStarClick = async (score: number) => {
    if (!interactive || isSubmitting) return;
    setIsSubmitting(true);
    setCurrentUserRating(score);
    try {
      if (onRate) {
        await onRate(score);
      }
      setJustRated(true);
      setTimeout(() => setJustRated(false), 2500);
    } catch (e) {
      console.error('Failed to submit rating:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compact non-interactive view (Used on Deck cards in Home page)
  if (!interactive) {
    if (!hasRatings) {
      return (
        <div
          className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500 select-none"
          title={isVi ? 'Bộ thẻ mới · Chưa có lượt đánh giá nào' : 'New deck · No reviews yet'}
        >
          <div className="flex items-center gap-0.5 text-slate-300 dark:text-slate-700">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={starSizes[size]} className="text-slate-300 dark:text-slate-700" />
            ))}
          </div>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
            {isVi ? 'Mới' : 'New'}
          </span>
        </div>
      );
    }

    return (
      <div
        className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 select-none"
        title={`${displayRating.toFixed(1)} / 5.0 (${ratingCount || 0} ${isVi ? 'lượt đánh giá' : 'reviews'})`}
      >
        <div className="flex items-center gap-0.5 text-amber-400">
          {[1, 2, 3, 4, 5].map((s) => {
            const isFilled = displayRating >= s;
            const isHalf = !isFilled && displayRating >= s - 0.5;
            return (
              <Star
                key={s}
                size={starSizes[size]}
                className={
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : isHalf
                    ? 'text-amber-400 fill-amber-400/50'
                    : 'text-slate-300 dark:text-slate-700'
                }
              />
            );
          })}
        </div>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 ml-0.5">
          {displayRating.toFixed(1)}
        </span>
        {showCount && ratingCount !== undefined && ratingCount > 0 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            ({ratingCount})
          </span>
        )}
      </div>
    );
  }

  // Interactive view (Used on DeckDetailPage or modal)
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500" />
          <span>{isVi ? 'Đánh giá từ cộng đồng' : 'Community Rating'}</span>
        </span>

        {hasRatings ? (
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {displayRating.toFixed(1)} / 5.0{' '}
            <span className="text-slate-400 font-normal">
              ({ratingCount} {isVi ? 'đánh giá' : 'reviews'})
            </span>
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-800/50">
            {isVi ? 'Bộ thẻ mới · Hãy là người đầu tiên đánh giá!' : 'New deck · Be the first to rate!'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Interactive Star Buttons */}
        <div
          className="flex items-center gap-1.5 cursor-pointer"
          onMouseLeave={() => setHoveredStar(null)}
        >
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const isFilled = currentScore >= starIndex;
            return (
              <motion.button
                key={starIndex}
                type="button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHoveredStar(starIndex)}
                onClick={() => handleStarClick(starIndex)}
                disabled={isSubmitting}
                className="p-1 rounded-lg focus:outline-none transition-colors"
                title={`${starIndex} sao - ${starLabels[starIndex]}`}
                aria-label={`Rate ${starIndex} stars`}
              >
                <Star
                  size={starSizes[size]}
                  className={`transition-all duration-150 ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                      : 'text-slate-300 dark:text-slate-700 hover:text-amber-300'
                  }`}
                />
              </motion.button>
            );
          })}
        </div>

        {/* Dynamic Label */}
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 min-w-[100px]">
          {hoveredStar ? starLabels[hoveredStar] : currentUserRating ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              {isVi ? `Bạn đã cho ${currentUserRating} ⭐` : `You rated ${currentUserRating} ⭐`}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              {isVi ? 'Nhấp sao để đánh giá' : 'Click to rate'}
            </span>
          )}
        </span>
      </div>

      <AnimatePresence>
        {justRated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1"
          >
            <CheckCircle2 size={12} />
            <span>{isVi ? 'Cảm ơn bạn đã gửi đánh giá!' : 'Thank you for your rating!'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
