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
 * Highlight the translated meaning inside Vietnamese text using <mark>
 */
export function renderMarkedTranslation(text: string, meaning: string): React.ReactNode {
  if (!text || !meaning) return text || '';

  // Get primary meaning keyword before comma or slash
  const cleanMeaning = meaning.split(/[,;/]/)[0].trim();
  if (!cleanMeaning || cleanMeaning.length < 2) return text;

  try {
    const escaped = escapeRegex(cleanMeaning);
    const splitRegex = new RegExp(`(${escaped})`, 'gi');
    const testRegex = new RegExp(`^${escaped}$`, 'i');
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
