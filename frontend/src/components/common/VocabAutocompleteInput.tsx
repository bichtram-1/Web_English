import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Layers, Check, X, ArrowRight } from 'lucide-react';
import { getVocabSuggestions, type VocabSuggestion } from '../../data/vocabDictionary';
import { translateSingleWord } from '../../utils/textExtractor';

interface VocabAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: VocabSuggestion) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  isDefinition?: boolean;
}

export default function VocabAutocompleteInput({
  value,
  onChange,
  onSelectSuggestion,
  placeholder,
  className,
  style,
  isDefinition = false,
}: VocabAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<VocabSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoadingOnline, setIsLoadingOnline] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute local and online suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const localMatches = getVocabSuggestions(query, 6);
    setSuggestions(localMatches);
    setIsOpen(localMatches.length > 0);
    setHighlightedIndex(-1);

    // If typing English and local matches are few, fetch online suggestions
    if (!isDefinition && localMatches.length < 5 && query.trim().length >= 2) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          setIsLoadingOnline(true);
          const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query.trim())}&max=4`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const onlineWords: string[] = data.map((d: any) => d.word);

              const resolvedItems: VocabSuggestion[] = await Promise.all(
                onlineWords
                  .filter((w) => !localMatches.some((m) => m.term.toLowerCase() === w.toLowerCase()))
                  .slice(0, 4)
                  .map(async (word) => {
                    const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
                    const viMeaning = await translateSingleWord(word);
                    return {
                      term: capitalized,
                      definition: viMeaning || '',
                      category: 'Gợi ý từ điển',
                    };
                  })
              );

              if (resolvedItems.length > 0) {
                setSuggestions((prev) => {
                  const existingTerms = new Set(prev.map((p) => p.term.toLowerCase()));
                  const filtered = resolvedItems.filter((item) => !existingTerms.has(item.term.toLowerCase()));
                  return [...prev, ...filtered].slice(0, 6);
                });
                setIsOpen(true);
              }
            }
          }
        } catch (e) {
          // Ignore network errors
        } finally {
          setIsLoadingOnline(false);
        }
      }, 300);
    }
  }, [isDefinition]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    fetchSuggestions(val);
  };

  const handleSelect = async (sug: VocabSuggestion) => {
    let finalSug = { ...sug };
    // If definition is missing or generic, fetch real translation
    if (!finalSug.definition || finalSug.definition === 'Gợi ý từ vựng trực tuyến') {
      const translated = await translateSingleWord(finalSug.term);
      if (translated) {
        finalSug.definition = translated;
      }
    }
    if (onSelectSuggestion) {
      onSelectSuggestion(finalSug);
    } else {
      onChange(isDefinition ? finalSug.definition : finalSug.term);
    }
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value.trim().length > 0 && suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        style={style}
        autoComplete="off"
        spellCheck="false"
      />

      {/* Autocomplete Suggestions Popover */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl"
            style={{ maxHeight: '280px' }}
          >
            {/* Header hint */}
            <div className="px-3.5 py-1.5 bg-indigo-50/80 dark:bg-slate-800/80 border-b border-indigo-100/60 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500 animate-pulse" />
                <span>Gợi ý từ vựng thông minh ({suggestions.length})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Nhấn ↑↓ để chọn, Enter để điền</span>
            </div>

            {/* Suggestions list */}
            <div className="overflow-y-auto max-h-[230px] p-1 divide-y divide-slate-100 dark:divide-slate-800/60">
              {suggestions.map((sug, idx) => {
                const isSelected = idx === highlightedIndex;
                const isGrammar = sug.type === 'drag_drop' || !!sug.grammarRule;

                return (
                  <div
                    key={`${sug.term}-${idx}`}
                    onClick={() => handleSelect(sug)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {sug.term}
                        </span>

                        {sug.phonetic && (
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            {sug.phonetic}
                          </span>
                        )}

                        {sug.pos && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {sug.pos}
                          </span>
                        )}

                        {isGrammar && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <span>✍️ Ngữ pháp</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5 truncate">
                        {sug.definition || (
                          <span className="italic text-slate-400 dark:text-slate-500">
                            Nhấn để chọn và tự động dịch nghĩa
                          </span>
                        )}
                      </p>

                      {sug.grammarRule && (
                        <p className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 mt-0.5 truncate">
                          📐 {sug.grammarRule}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 opacity-0 group-hover:opacity-100 sm:opacity-100">
                      <span className="hidden sm:inline">Chọn</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
