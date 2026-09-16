/**
 * Utilities for matching user answers flexibly against flashcard text.
 * Handles parenthesized annotations, e.g. "access (n)", "(to) take for granted",
 * "chạy (bộ)", multiple definitions separated by commas/slashes, and casing/spacing.
 */

/**
 * Strips parenthesized content from text.
 * E.g. "access (n)" -> "access"
 * E.g. "(to) take for granted" -> "take for granted"
 * E.g. "chạy (bộ)" -> "chạy"
 * Handles (), （）, [], and {}
 */
export function stripParentheses(text: string): string {
  if (!text) return '';
  const stripped = text
    .replace(/\([^)]*\)/g, ' ')
    .replace(/（[^）]*）/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .trim();

  // If stripping left nothing (e.g. text was literally only "(n)"), fallback to removing only the bracket chars
  if (!stripped) {
    return text.replace(/[()（）[\]{}]/g, ' ').trim();
  }
  return stripped;
}

/**
 * Strips bracket characters while leaving the inside text intact.
 * E.g. "(to) abandon" -> "to abandon"
 * E.g. "chạy (bộ)" -> "chạy bộ"
 */
export function stripBracketChars(text: string): string {
  if (!text) return '';
  return text.replace(/[()（）[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes text for comparison: lowercase, strip edge punctuation, collapse spaces.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/^[\s.,!?;:"'~`]+|[\s.,!?;:"'~`]+$/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Extracts all acceptable target forms from the correct answer string.
 * Supports:
 * - Full string (normalized)
 * - String without parenthesized notes: "access (n)" -> "access"
 * - String with bracket symbols stripped: "(to) abandon" -> "to abandon"
 * - Multi-definition splits by '/', ';', or ','
 */
export function getAcceptableAnswers(correctAnswer: string): string[] {
  if (!correctAnswer) return [];

  const candidates = new Set<string>();

  const addVariants = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const norm = normalizeText(trimmed);
    if (norm) candidates.add(norm);

    const stripped = normalizeText(stripParentheses(trimmed));
    if (stripped) candidates.add(stripped);

    const withoutBrackets = normalizeText(stripBracketChars(trimmed));
    if (withoutBrackets) candidates.add(withoutBrackets);
  };

  // 1. Add variants of the entire string
  addVariants(correctAnswer);

  // 2. Split by common delimiters like ';' or '/'
  const slashSemiParts = correctAnswer.split(/[/;]/);
  if (slashSemiParts.length > 1) {
    slashSemiParts.forEach((part) => addVariants(part));
  }

  // 3. Split by comma ',' if parts look like distinct alternative definitions (< 60 chars each)
  const commaParts = correctAnswer.split(',');
  if (commaParts.length > 1 && commaParts.every((p) => p.trim().length <= 60)) {
    commaParts.forEach((part) => addVariants(part));
  }

  return Array.from(candidates);
}

/**
 * Checks whether user input matches the correct answer.
 * Lenient with parentheses, brackets, alternative synonyms, punctuation, and casing.
 */
export function isAnswerMatching(userInput: string, correctAnswer: string): boolean {
  if (!userInput || !correctAnswer) return false;

  const userVariants = new Set<string>();
  const userNorm = normalizeText(userInput);
  if (userNorm) userVariants.add(userNorm);

  const userStripped = normalizeText(stripParentheses(userInput));
  if (userStripped) userVariants.add(userStripped);

  const userNoBrackets = normalizeText(stripBracketChars(userInput));
  if (userNoBrackets) userVariants.add(userNoBrackets);

  const acceptable = getAcceptableAnswers(correctAnswer);

  for (const u of userVariants) {
    if (acceptable.includes(u)) return true;
  }

  return false;
}
