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
  rating = 5.0,
  ratingCount = 0,
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

  const currentScore = hoveredStar || currentUserRating || Math.round(rating);

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
    const hasRatings = ratingCount > 0 || rating > 0;
    return (
      <div
        className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 select-none"
        title={hasRatings ? `${rating.toFixed(1)} / 5.0 (${ratingCount} lượt đánh giá)` : 'Chưa có đánh giá'}
      >
        <div className="flex items-center gap-0.5 text-amber-400">
          {[1, 2, 3, 4, 5].map((s) => {
            const isFilled = rating >= s;
            const isHalf = !isFilled && rating >= s - 0.5;
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
          {rating > 0 ? rating.toFixed(1) : '5.0'}
        </span>
        {showCount && ratingCount > 0 && (
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

        {ratingCount > 0 && (
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {rating.toFixed(1)} / 5.0 <span className="text-slate-400 font-normal">({ratingCount} {isVi ? 'đánh giá' : 'reviews'})</span>
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
