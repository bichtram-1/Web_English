import type { Deck, CardItem, FlashcardItem } from '../types/DeckType';

export interface ParsedCard {
  front: string;
  back: string;
  type: 'flashcard' | 'drag_drop';
  grammarRule?: string;
  grammarExplanation?: string;
}

/**
 * Export Deck to formatted JSON
 */
export function exportDeckToJson(deck: Deck): void {
  const dataStr = JSON.stringify(deck, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deck.title.replace(/[^a-z0-9_-]/gi, '_')}_cards.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Deck to standard CSV (Anki / Quizlet / Excel compatible)
 */
export function exportDeckToCsv(deck: Deck): void {
  const headers = ['Front / English', 'Back / Vietnamese', 'Type', 'Grammar Rule'];
  const rows = deck.cards.map((c) => {
    if (c.type === 'flashcard') {
      return [
        `"${c.front.replace(/"/g, '""')}"`,
        `"${c.back.replace(/"/g, '""')}"`,
        '"Flashcard"',
        '""',
      ];
    } else {
      return [
        `"${c.shuffled.map((w) => w.word).join(' ').replace(/"/g, '""')}"`,
        `"${c.meaning.replace(/"/g, '""')}"`,
        '"Drag & Drop"',
        `"${(c.grammarRule || '').replace(/"/g, '""')}"`,
      ];
    }
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deck.title.replace(/[^a-z0-9_-]/gi, '_')}_vocab.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse uploaded file (JSON, CSV, or Tab/Comma/Newline-separated text)
 */
export async function parseVocabularyFile(file: File): Promise<{ title?: string; cards: ParsedCard[] }> {
  const text = await file.text();
  const fileName = file.name.toLowerCase();

  // 1. JSON parsing
  if (fileName.endsWith('.json')) {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return {
          cards: data.map((item, idx) => ({
            front: item.front || item.term || item.word || item.english || `Word ${idx + 1}`,
            back: item.back || item.definition || item.meaning || item.vietnamese || '',
            type: item.type === 'drag_drop' ? 'drag_drop' : 'flashcard',
            grammarRule: item.grammarRule || '',
            grammarExplanation: item.grammarExplanation || '',
          })),
        };
      } else if (data && typeof data === 'object') {
        const rawCards = data.cards || data.items || [];
        return {
          title: data.title || data.name,
          cards: rawCards.map((item: any, idx: number) => ({
            front: item.front || item.term || item.word || item.english || `Word ${idx + 1}`,
            back: item.back || item.definition || item.meaning || item.vietnamese || '',
            type: item.type === 'drag_drop' ? 'drag_drop' : 'flashcard',
            grammarRule: item.grammarRule || '',
            grammarExplanation: item.grammarExplanation || '',
          })),
        };
      }
    } catch (e) {
      throw new Error('Định dạng JSON không hợp lệ hoặc bị lỗi cú pháp.');
    }
  }

  // 2. CSV / TXT / TSV Line-by-line parsing
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const cards: ParsedCard[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Skip header line if it looks like column headers
    if (i === 0 && (line.toLowerCase().includes('front') || line.toLowerCase().includes('english') || line.toLowerCase().includes('từ vựng'))) {
      continue;
    }

    // Split by tab, comma, semicolon or colon/dash
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(' - ')) {
      parts = line.split(' - ');
    } else if (line.includes(' : ')) {
      parts = line.split(' : ');
    } else if (line.includes(';')) {
      parts = line.split(';');
    } else if (line.includes(',')) {
      // Basic CSV splitter
      parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
    }

    if (parts.length >= 2) {
      const front = parts[0]?.trim().replace(/^"|"$/g, '') || '';
      const back = parts[1]?.trim().replace(/^"|"$/g, '') || '';
      if (front && back) {
        cards.push({
          front,
          back,
          type: 'flashcard',
        });
      }
    }
  }

  if (cards.length === 0) {
    throw new Error('Không tìm thấy từ vựng hợp lệ. Vui lòng kiểm tra định dạng dòng: "Từ tiếng Anh - Nghĩa tiếng Việt" hoặc file CSV/JSON.');
  }

  const suggestedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  return { title: suggestedTitle, cards };
}
