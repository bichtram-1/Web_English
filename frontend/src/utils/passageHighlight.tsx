import React from 'react';

/**
 * Escapes regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if a vocabulary word or phrase actually appears in the passage (including plurals, inflections)
 */
export function wordExistsInPassage(text: string, word: string): boolean {
  if (!text || !word) return false;

  const cleanWord = word
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/[/\\].*?[/\\]/g, '')
    .trim();

  if (!cleanWord || cleanWord.length < 2) return false;

  try {
    const escaped = escapeRegex(cleanWord);
    const isPhrase = cleanWord.includes(' ');
    const regex = isPhrase
      ? new RegExp(`(${escaped})`, 'i')
      : new RegExp(`\\b${escaped}(?:'s|s|es|ed|ing|d|er|est)?\\b`, 'i');
    return regex.test(text);
  } catch {
    return false;
  }
}

/**
 * Highlight a word (including inflections like plurals, past tense, possessives) inside English text using <mark>
 */
export function renderMarkedPassage(text: string, word: string): React.ReactNode {
  if (!text || !word) return text || '';

  // Clean word: remove annotations like (v), [adj], IPA phonetics etc.
  const cleanWord = word
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/[/\\].*?[/\\]/g, '')
    .trim();

  if (!cleanWord || cleanWord.length < 2) return text;

  try {
    const escaped = escapeRegex(cleanWord);
    const isPhrase = cleanWord.includes(' ');
    // Match the phrase or word with common variations (e.g. member -> members, work -> works/worked/working)
    const splitRegex = isPhrase
      ? new RegExp(`(${escaped})`, 'gi')
      : new RegExp(`(\\b${escaped}(?:'s|s|es|ed|ing|d|er|est)?\\b)`, 'gi');
    const testRegex = isPhrase
      ? new RegExp(`^${escaped}$`, 'i')
      : new RegExp(`^${escaped}(?:'s|s|es|ed|ing|d|er|est)?$`, 'i');

    const parts = text.split(splitRegex);

    return parts.map((part, index) => {
      if (testRegex.test(part)) {
        return (
          <mark
            key={index}
            className="bg-amber-300 dark:bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded shadow-2xs mx-0.5 selection:bg-amber-400"
          >
            {part}
          </mark>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  } catch {
    return text;
  }
}

/**
 * Extracts intelligent search candidate phrases from a Vietnamese definition string
 */
function getVietnameseCandidates(meaning: string): string[] {
  if (!meaning) return [];

  // 1. Remove parenthesized/bracketed annotations: (v), [adj], (noun), etc.
  const cleaned = meaning
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/[/\\].*?[/\\]/g, '')
    .replace(/^\s*\d+[\.\)]\s*/gm, '')
    .trim();

  // 2. Split into segments by comma, semicolon, slash, newline, or pipe
  const segments = cleaned
    .split(/[,;\n/|]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  const candidates = new Set<string>();
  const prefixes =
    /^(?:sự|cuộc|niềm|nỗi|tính|việc|làm cho|trở nên|thuộc về|thuộc|mang tính|có tính|một cách|quả|trái|củ|con|cây|loài|loại|được|bị)\s+/i;

  segments.forEach((seg) => {
    candidates.add(seg);

    // Strip common Vietnamese dictionary prefixes (e.g. "sự phát triển" -> "phát triển")
    const stripped = seg.replace(prefixes, '').trim();
    if (stripped.length >= 2) {
      candidates.add(stripped);
    }

    // Extract core parts before conjunctions like "mang tính", "đáng", "trong"
    const subParts = seg.split(/\s+(?:mang tính|đáng|cho|trong|với)\s+/i);
    if (subParts.length > 1 && subParts[0].trim().length >= 2) {
      candidates.add(subParts[0].trim());
    }

    // For longer phrases (>= 3 words, e.g. "hoàn thành mục tiêu"), also add the 2-word head
    const words = seg.split(/\s+/);
    if (words.length >= 3) {
      const head = words.slice(0, 2).join(' ');
      if (head.length >= 2 && !head.match(prefixes)) {
        candidates.add(head);
      }
    }
    if (stripped !== seg) {
      const strippedWords = stripped.split(/\s+/);
      if (strippedWords.length >= 3) {
        candidates.add(strippedWords.slice(0, 2).join(' '));
      }
    }
  });

  // Sort longest candidates first so larger exact phrases match before sub-words
  return Array.from(candidates).sort((a, b) => b.length - a.length);
}

/**
 * Highlight the translated meaning inside Vietnamese text using <mark>
 */
export function renderMarkedTranslation(text: string, meaning: string): React.ReactNode {
  if (!text || !meaning) return text || '';

  const candidates = getVietnameseCandidates(meaning);
  if (candidates.length === 0) return text;

  // Find candidate terms that actually exist in the Vietnamese text
  const matchedTerms = candidates.filter((term) => {
    try {
      const escaped = escapeRegex(term);
      return new RegExp(escaped, 'i').test(text);
    } catch {
      return false;
    }
  });

  if (matchedTerms.length === 0) return text;

  try {
    // Escape all matching terms and construct regex matching the longest first
    const escapedTerms = matchedTerms.map(escapeRegex).join('|');
    const splitRegex = new RegExp(`(${escapedTerms})`, 'gi');
    const testRegex = new RegExp(`^(?:${escapedTerms})$`, 'i');

    const parts = text.split(splitRegex);

    return parts.map((part, index) => {
      if (testRegex.test(part)) {
        return (
          <mark
            key={index}
            className="bg-amber-200 dark:bg-amber-300 text-slate-900 font-bold px-1.5 py-0.5 rounded shadow-2xs mx-0.5"
          >
            {part}
          </mark>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  } catch {
    return text;
  }
}
