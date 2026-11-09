import type { Deck } from '../types/DeckType';
import { extractDocxText, extractPdfText } from './documentParser';

export interface ParsedCard {
  front: string;
  back: string;
  type: 'flashcard' | 'drag_drop';
  phonetic?: string;
  exampleEn?: string;
  exampleVi?: string;
  imageUrl?: string;
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
 * Export Deck to Microsoft Word document (.docx)
 * Formats a clean, professional vocabulary study sheet with table styling
 */
export async function exportDeckToDocx(deck: Deck): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
    AlignmentType,
    HeadingLevel,
    ShadingType,
  } = await import('docx');

  const nowStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const tableRows = [
    // Header Row
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { fill: '4F46E5', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'STT', bold: true, color: 'FFFFFF', font: 'Segoe UI' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: '4F46E5', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Thuật ngữ (English)', bold: true, color: 'FFFFFF', font: 'Segoe UI' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: '4F46E5', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Phiên âm (IPA)', bold: true, color: 'FFFFFF', font: 'Segoe UI' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: '4F46E5', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Nghĩa tiếng Việt', bold: true, color: 'FFFFFF', font: 'Segoe UI' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: '4F46E5', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Ví dụ / Ngữ pháp', bold: true, color: 'FFFFFF', font: 'Segoe UI' })],
            }),
          ],
        }),
      ],
    }),
  ];

  deck.cards.forEach((card, index) => {
    const isOdd = index % 2 === 1;
    const bgShading = isOdd ? { fill: 'F8FAFC', type: ShadingType.CLEAR } : undefined;

    let frontText = '';
    let backText = '';
    let phoneticText = '';
    let exampleText = '';

    if (card.type === 'flashcard') {
      frontText = card.front || '';
      backText = card.back || '';
      phoneticText = card.phonetic || '';
      exampleText = [card.exampleEn, card.exampleVi].filter(Boolean).join(' - ');
    } else {
      frontText = card.shuffled?.map((w) => w.word).join(' ') || '';
      backText = card.meaning || '';
      exampleText = [card.grammarRule, card.grammarExplanation].filter(Boolean).join(' - ');
    }

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            shading: bgShading,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(index + 1), font: 'Segoe UI' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: bgShading,
            children: [
              new Paragraph({
                children: [new TextRun({ text: frontText, bold: true, color: '1E293B', font: 'Segoe UI' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: bgShading,
            children: [
              new Paragraph({
                children: [new TextRun({ text: phoneticText, italics: true, color: '64748B', font: 'Segoe UI' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: bgShading,
            children: [
              new Paragraph({
                children: [new TextRun({ text: backText, color: '334155', font: 'Segoe UI' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: bgShading,
            children: [
              new Paragraph({
                children: [new TextRun({ text: exampleText, color: '64748B', size: 18, font: 'Segoe UI' })],
              }),
            ],
          }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'LinguaLeap - Bảng Từ Vựng Tiếng Anh',
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Bộ thẻ: ', bold: true, font: 'Segoe UI' }),
              new TextRun({ text: `${deck.title}  |  `, font: 'Segoe UI' }),
              new TextRun({ text: 'Chủ đề: ', bold: true, font: 'Segoe UI' }),
              new TextRun({ text: `${deck.category || 'Vocabulary'}  |  `, font: 'Segoe UI' }),
              new TextRun({ text: 'Số lượng: ', bold: true, font: 'Segoe UI' }),
              new TextRun({ text: `${deck.cards.length} từ vựng  |  `, font: 'Segoe UI' }),
              new TextRun({ text: 'Ngày xuất: ', bold: true, font: 'Segoe UI' }),
              new TextRun({ text: `${nowStr}`, font: 'Segoe UI' }),
            ],
            spacing: { after: 300 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deck.title.replace(/[^a-z0-9_-]/gi, '_')}_vocab.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Deck to standard CSV (Anki / Quizlet / Excel compatible)
 */
export function exportDeckToCsv(deck: Deck): void {
  const headers = ['Front / English', 'Back / Vietnamese', 'Phonetic IPA', 'Type', 'Grammar Rule'];
  const rows = deck.cards.map((c) => {
    if (c.type === 'flashcard') {
      return [
        `"${c.front.replace(/"/g, '""')}"`,
        `"${c.back.replace(/"/g, '""')}"`,
        `"${(c.phonetic || '').replace(/"/g, '""')}"`,
        '"Flashcard"',
        '""',
      ];
    } else {
      return [
        `"${c.shuffled.map((w) => w.word).join(' ').replace(/"/g, '""')}"`,
        `"${c.meaning.replace(/"/g, '""')}"`,
        '""',
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

function isHeaderCell(text: string): boolean {
  const t = text.toLowerCase().trim();
  return [
    'stt', 'no', 'no.', '#', 'index',
    'thuật ngữ', 'từ vựng', 'tiếng anh', 'english', 'term', 'word', 'vocabulary', 'front',
    'ipa', 'phiên âm', 'phonetic', 'pronunciation',
    'nghĩa', 'nghĩa tiếng việt', 'tiếng việt', 'vietnamese', 'definition', 'meaning', 'back',
    'ví dụ', 'ví dụ minh họa', 'câu ví dụ', 'example', 'examples', 'sentence', 'usage',
    'loại từ', 'từ loại', 'pos', 'part of speech',
    'ngữ pháp', 'công thức', 'grammar', 'rule',
  ].some((h) => t === h || t.startsWith(h + ' ') || t.endsWith(' ' + h) || t.includes(h));
}

function looksLikeIpa(str: string): boolean {
  if (!str) return false;
  const s = str.trim();
  return (
    (s.startsWith('/') && s.endsWith('/')) ||
    (s.startsWith('[') && s.endsWith(']')) ||
    /[əæɪʊʌɔɒɛɜθðʃʒŋˈˌː]/.test(s)
  );
}

/**
 * Layer 1: Sanity & Anti-Garbage Filter
 * Checks if the text has excessive binary/corrupted control characters or is completely empty.
 */
export function isBinaryOrCorrupted(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  // Count unprintable control characters (excluding standard whitespace \t, \n, \r)
  const controlChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFD]/g);
  if (controlChars && controlChars.length / text.length > 0.02) {
    return true;
  }
  return false;
}

/**
 * Layer 1: Source Code / Technical Configuration Detector
 * Checks whether the text is HTML/JS/TS/Python/SQL/C/Java code or server configuration.
 */
export function isTechnicalOrSourceCode(text: string): boolean {
  const sample = text.slice(0, 3000);

  // HTML / XML document structure
  if (
    /<!DOCTYPE\s+html/i.test(sample) ||
    /<html[\s>]/i.test(sample) ||
    /<script[\s>]/i.test(sample) ||
    /<style[\s>]/i.test(sample) ||
    /<body[\s>]/i.test(sample)
  ) {
    return true;
  }

  // Common programming constructs
  const codePatterns = [
    /\bimport\s+[\w*\s{},]+from\s+['"][^'"]+['"]/i,
    /\bexport\s+(default|const|let|var|function|class|interface|type)\b/,
    /\bconst\s+[a-zA-Z0-9_$]+\s*=\s*(require|\(|function|{)/,
    /\bfunction\s+[a-zA-Z0-9_$]+\s*\([^)]*\)\s*\{/,
    /\bdef\s+[a-zA-Z0-9_]+\s*\([^)]*\):/,
    /\bpublic\s+(static\s+)?(void|class|int|String|boolean)\b/,
    /\b(SELECT|INSERT INTO|UPDATE|DELETE FROM)\s+.*?\bFROM\b/i,
    /#include\s+<[\w\.]+>/,
    /\bpackage\s+[a-zA-Z0-9_\.]+;/,
    /\bconsole\.(log|error|warn)\s*\(/,
    /\bSystem\.out\.println\s*\(/,
    /\bvar\s+[a-zA-Z0-9_$]+\s*=\s*/,
  ];

  let matches = 0;
  for (const pattern of codePatterns) {
    if (pattern.test(sample)) {
      matches++;
      if (matches >= 2) return true;
    }
  }

  if (/^<\?php/i.test(sample) || /^#!\/(bin|usr)/i.test(sample.trim())) {
    return true;
  }

  return false;
}

/**
 * Layer 2: Blacklist Domain Tables (Administrative, HR/Payroll, Grade sheets, Invoices, Accounting)
 */
export function hasIrrelevantDomainTable(text: string): boolean {
  const sample = text.slice(0, 4000).toLowerCase();

  const domainSignatures = [
    // HR & Payroll
    ['bảng lương', 'lương cơ bản', 'phụ cấp', 'chấm công', 'hệ số lương', 'thực lĩnh', 'bảo hiểm xã hội', 'bhxh'],
    ['payroll', 'payslip', 'basic salary', 'allowance', 'net pay', 'gross pay', 'overtime'],
    // Transcripts / Grade reports
    ['bảng điểm', 'điểm thi', 'học kỳ', 'mã số sinh viên', 'mssv', 'mã học sinh', 'điểm rèn luyện', 'gpa', 'tín chỉ'],
    ['transcript', 'grade report', 'student id', 'credit hours', 'semester gpa', 'cumulative gpa'],
    // Invoices / Billing
    ['hóa đơn giá trị gia tăng', 'đơn giá', 'thành tiền', 'thuế gtgt', 'tiền thuế', 'tổng tiền thanh toán'],
    ['invoice', 'subtotal', 'unit price', 'vat amount', 'total amount due', 'bill to', 'ship to'],
    // Financial & Accounting
    ['báo cáo tài chính', 'bảng cân đối kế toán', 'lưu chuyển tiền tệ', 'doanh thu thuần', 'lợi nhuận sau thuế', 'tài sản ngắn hạn'],
    ['balance sheet', 'cash flow statement', 'retained earnings', 'operating expenses', 'net income'],
  ];

  for (const group of domainSignatures) {
    let hits = 0;
    for (const kw of group) {
      if (sample.includes(kw)) hits++;
    }
    if (hits >= 2) return true;
  }

  return false;
}

/**
 * Layer 4: Narrative / Reading Passage / Essay Detector
 * Detects whether the uploaded text is a continuous essay, reading comprehension passage, or news article.
 */
export function isNarrativeOrReadingPassage(text: string): boolean {
  const clean = text.trim();
  if (clean.length < 150) return false;

  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return false;

  let totalWords = 0;
  let longLinesCount = 0;
  let tabOrDelimiterLines = 0;

  for (const line of lines) {
    const words = line.split(/\s+/).length;
    totalWords += words;
    if (words > 12) longLinesCount++;
    if (
      line.includes('\t') ||
      line.includes(' - ') ||
      line.includes(' : ') ||
      /\s{3,}/.test(line)
    ) {
      tabOrDelimiterLines++;
    }
  }

  const avgWordsPerLine = totalWords / lines.length;
  const longLineRatio = longLinesCount / lines.length;
  const delimiterRatio = tabOrDelimiterLines / lines.length;

  // If text is lengthy and consists predominantly of narrative sentences (>12 words/line or >40% long lines)
  // while structured 2-column vocabulary delimiters are sparse (<25% lines)
  if (totalWords > 50 && (longLineRatio > 0.4 || avgWordsPerLine > 12) && delimiterRatio < 0.25) {
    return true;
  }

  return false;
}

/**
 * Layer 3: Card-Level Structural Validation
 * Ensures that an extracted pair represents a valid vocabulary headword and definition.
 */
export function isValidVocabularyCard(front: string, back: string): boolean {
  if (!front || !back) return false;
  const f = front.trim();
  const b = back.trim();

  // Basic length constraints
  if (f.length < 1 || b.length < 1) return false;
  if (f.length > 120) return false; // Term should not be an entire paragraph
  if (b.length > 600) return false; // Definition should not be an essay

  // Headword term should not have excessive word count (>12 words is likely a narrative sentence)
  const frontWords = f.split(/\s+/).length;
  if (frontWords > 12) return false;

  // Must contain at least one letter character in both front and back (Unicode compliant)
  if (!/\p{L}/u.test(f) || !/\p{L}/u.test(b)) return false;

  // Reject URLs and email addresses
  if (/^https?:\/\//i.test(f) || /^https?:\/\//i.test(b)) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b)) return false;

  // Reject pure dates or purely symbolic lines
  if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(f)) return false;
  if (/^[-=_*#~`|\\/]+$/.test(f) || /^[-=_*#~`|\\/]+$/.test(b)) return false;

  // Reject table header rows that escaped earlier header filters
  const lowerF = f.toLowerCase();
  const headerWords = [
    'stt', 'no', 'no.', 'index', 'số thứ tự',
    'thuật ngữ', 'từ vựng', 'english', 'term', 'word', 'vocabulary', 'front', 'tiếng anh',
    'nghĩa', 'tiếng việt', 'vietnamese', 'definition', 'meaning', 'back',
    'loại từ', 'từ loại', 'pos', 'part of speech',
  ];
  if (headerWords.includes(lowerF)) return false;

  return true;
}

// Common line-by-line parsing for TXT, CSV, TSV, DOCX, and PDF text
export function parseVocabularyTextLines(text: string): ParsedCard[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const cards: ParsedCard[] = [];

  // Track dynamic column mapping if table headers are detected (e.g. STT | Thuật ngữ | IPA | Nghĩa | Ví dụ)
  const colMapping = {
    stt: -1,
    term: -1,
    ipa: -1,
    meaning: -1,
    example: -1,
    detected: false,
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]!;

    // Split by tab, dash, colon, multiple spaces (2+), semicolon, or comma
    let parts: string[] = [];
    if (line.includes('\t')) {
      // 1. Tab separated (TSV / Anki / Word tables)
      parts = line.split('\t').map((p) => p.trim());
    } else if (line.includes(' - ')) {
      // 2. Dash separated: "Từ - Nghĩa"
      parts = line.split(/\s+-\s+/).map((p) => p.trim());
    } else if (line.includes(' : ') || /:\s+/.test(line)) {
      // 3. Colon separated: "Từ : Nghĩa" or "Từ: Nghĩa"
      parts = line.split(/\s*:\s+/).map((p) => p.trim());
    } else if (/\s{2,}/.test(line)) {
      // 4. Multiple whitespace (2 or more spaces/tabs) separating columns
      parts = line.split(/\s{2,}/).map((p) => p.trim());
    } else if (line.includes(';')) {
      // 5. Semicolon separated
      parts = line.split(';').map((p) => p.trim());
    } else if (line.includes(',')) {
      // 6. CSV comma separated (handles quoted values)
      if (line.includes('"')) {
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (matches && matches.length >= 2) {
          parts = matches.map((m) => m.replace(/^"|"$/g, '').trim());
        } else {
          parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        }
      } else {
        parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
      }
    } else if (line.split(/\s+/).length === 2) {
      // 7. Fallback: Exactly 2 single words separated by a single space (e.g. "dog chó")
      parts = line.split(/\s+/).map((p) => p.trim());
    }

    if (parts.length < 2) continue;

    // Detect header row if not detected yet
    if (!colMapping.detected) {
      const headerMatches = parts.filter((p) => isHeaderCell(p));
      if (headerMatches.length >= 2 || (parts.length >= 2 && isHeaderCell(parts[0]))) {
        parts.forEach((p, idx) => {
          const lower = p.toLowerCase();
          if (['stt', 'no', 'no.', '#', 'index'].some((k) => lower === k || lower.startsWith(k + ' '))) {
            colMapping.stt = idx;
          } else if (['thuật ngữ', 'từ vựng', 'tiếng anh', 'english', 'term', 'word', 'front', 'vocabulary'].some((k) => lower.includes(k))) {
            colMapping.term = idx;
          } else if (['ipa', 'phiên âm', 'phonetic', 'pronunciation'].some((k) => lower.includes(k))) {
            colMapping.ipa = idx;
          } else if (['nghĩa', 'tiếng việt', 'vietnamese', 'definition', 'meaning', 'back'].some((k) => lower.includes(k))) {
            colMapping.meaning = idx;
          } else if (['ví dụ', 'câu ví dụ', 'example', 'sentence', 'usage'].some((k) => lower.includes(k))) {
            colMapping.example = idx;
          }
        });

        if (colMapping.term !== -1 || colMapping.meaning !== -1) {
          colMapping.detected = true;
          continue; // Skip the table header row
        }
      }
    }

    // Skip any repeated table headers (e.g. in multi-page tables)
    if (parts.filter((p) => isHeaderCell(p)).length >= 2) {
      continue;
    }

    let front = '';
    let back = '';
    let phonetic: string | undefined = undefined;
    let exampleEn: string | undefined = undefined;

    if (colMapping.detected && colMapping.term !== -1 && colMapping.meaning !== -1) {
      // Use mapped column positions from detected header
      front = parts[colMapping.term]?.replace(/^"|"$/g, '').trim() || '';
      back = parts[colMapping.meaning]?.replace(/^"|"$/g, '').trim() || '';
      if (colMapping.ipa !== -1 && parts[colMapping.ipa]) {
        phonetic = parts[colMapping.ipa].replace(/^"|"$/g, '').trim() || undefined;
      }
      if (colMapping.example !== -1 && parts[colMapping.example]) {
        exampleEn = parts[colMapping.example].replace(/^"|"$/g, '').trim() || undefined;
      }
    } else {
      // Fallback heuristics when no header row is present
      const activeParts = [...parts];

      // Strip leading list numbers: "1. ", "1) ", "01. "
      if (activeParts[0]) {
        activeParts[0] = activeParts[0].replace(/^\d+[\.\)\:\-]\s+/, '').trim();
      }

      // If first column is purely an index/number like "1    hello    xin chào"
      if (activeParts.length >= 3 && /^\d+$/.test(activeParts[0]?.trim() || '')) {
        activeParts.shift();
      }

      if (activeParts.length >= 2) {
        const p0 = activeParts[0]?.replace(/^"|"$/g, '').trim() || '';
        const p1 = activeParts[1]?.replace(/^"|"$/g, '').trim() || '';
        const p2 = activeParts[2]?.replace(/^"|"$/g, '').trim() || '';
        const p3 = activeParts[3]?.replace(/^"|"$/g, '').trim() || '';

        front = p0;

        if (looksLikeIpa(p1) && p2) {
          // Front | Phonetic | Back | Example
          phonetic = p1;
          back = p2;
          if (p3) exampleEn = p3;
        } else if (looksLikeIpa(p2)) {
          // Front | Back | Phonetic | Example
          back = p1;
          phonetic = p2;
          if (p3) exampleEn = p3;
        } else {
          // Front | Back | Example
          back = p1;
          if (p2) exampleEn = p2;
        }
      }
    }

    if (front && back && isValidVocabularyCard(front, back)) {
      cards.push({
        front,
        back,
        type: 'flashcard',
        phonetic: phonetic || undefined,
        exampleEn: exampleEn || undefined,
      });
    }
  }

  return cards;
}

/**
 * Parse uploaded file (JSON, CSV, Word DOCX, PDF, or TXT)
 * Validates file structure using 5-layer intelligence engine.
 */
export async function parseVocabularyFile(file: File): Promise<{ title?: string; cards: ParsedCard[] }> {
  const fileName = file.name.toLowerCase();
  let text = '';

  // 1. JSON parsing
  if (fileName.endsWith('.json')) {
    text = await file.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        const validCards = data
          .map((item, idx) => ({
            front: (item.front || item.term || item.word || item.english || '').trim(),
            back: (item.back || item.definition || item.meaning || item.vietnamese || '').trim(),
            type: item.type === 'drag_drop' ? ('drag_drop' as const) : ('flashcard' as const),
            phonetic: item.phonetic || undefined,
            exampleEn: item.exampleEn || undefined,
            exampleVi: item.exampleVi || undefined,
            imageUrl: item.imageUrl || undefined,
            grammarRule: item.grammarRule || '',
            grammarExplanation: item.grammarExplanation || '',
          }))
          .filter((c) => isValidVocabularyCard(c.front, c.back));

        if (validCards.length === 0) {
          throw new Error('Tệp JSON không chứa danh sách thẻ từ vựng hợp lệ (mỗi thẻ cần có thuật ngữ và nghĩa tiếng Việt).');
        }

        return { cards: validCards };
      } else if (data && typeof data === 'object') {
        const rawCards = Array.isArray(data.cards) ? data.cards : Array.isArray(data.items) ? data.items : [];
        const validCards = rawCards
          .map((item: any) => ({
            front: (item.front || item.term || item.word || item.english || '').trim(),
            back: (item.back || item.definition || item.meaning || item.vietnamese || '').trim(),
            type: item.type === 'drag_drop' ? ('drag_drop' as const) : ('flashcard' as const),
            phonetic: item.phonetic || undefined,
            exampleEn: item.exampleEn || undefined,
            exampleVi: item.exampleVi || undefined,
            imageUrl: item.imageUrl || undefined,
            grammarRule: item.grammarRule || '',
            grammarExplanation: item.grammarExplanation || '',
          }))
          .filter((c: any) => isValidVocabularyCard(c.front, c.back));

        if (validCards.length === 0) {
          throw new Error('Tệp JSON không chứa danh sách thẻ từ vựng hợp lệ (mỗi thẻ cần có thuật ngữ và nghĩa tiếng Việt).');
        }

        return {
          title: data.title || data.name,
          cards: validCards,
        };
      } else {
        throw new Error('Tệp JSON không đúng cấu trúc bộ thẻ từ vựng.');
      }
    } catch (e: any) {
      if (e.message && e.message.includes('Tệp JSON')) {
        throw e;
      }
      throw new Error('Định dạng JSON không hợp lệ hoặc bị lỗi cú pháp.');
    }
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    // 2. Word document (.docx / .doc)
    text = await extractDocxText(file);
  } else if (fileName.endsWith('.pdf')) {
    // 3. PDF document (.pdf)
    text = await extractPdfText(file);
  } else {
    // 4. TXT / CSV / TSV text parsing
    text = await file.text();
  }

  // TẦNG 1: Kiểm tra tính nguyên vẹn & Bộ lọc rác kỹ thuật (Sanity & Anti-Garbage Filter)
  if (isBinaryOrCorrupted(text)) {
    throw new Error('Tệp rỗng hoặc nội dung tệp bị lỗi/chứa ký tự nhị phân không đọc được.');
  }

  if (isTechnicalOrSourceCode(text)) {
    throw new Error(
      'Tệp tải lên có vẻ là mã nguồn lập trình hoặc tệp cấu hình hệ thống (HTML, JavaScript, Python, CSS, SQL...), không phải tài liệu từ vựng.'
    );
  }

  // TẦNG 2: Rào bảng biểu trái ngành (Blacklist Domain Tables)
  if (hasIrrelevantDomainTable(text)) {
    throw new Error(
      'Tệp tải lên có vẻ là bảng biểu hành chính, tài chính, bảng lương hoặc bảng điểm học tập (chứa điểm thi, học kỳ, lương, đơn giá hóa đơn...), không phải danh sách từ vựng.'
    );
  }

  // Parse lines into cards (Filtered through TẦNG 3: Card-Level Structural Validation)
  const cards = parseVocabularyTextLines(text);
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // TẦNG 4 & 5: Đánh giá mật độ từ vựng & Nhận diện bài đọc/tiểu luận & Thông báo thông minh
  if (cards.length === 0) {
    if (isNarrativeOrReadingPassage(text)) {
      throw new Error(
        'Tệp tải lên là bài văn, bài đọc hoặc tiểu luận tiếng Anh (không phải danh sách từ vựng theo cặp Thuật ngữ - Nghĩa).\n\n💡 Gợi ý: Hãy sao chép bài đọc này vào công cụ "Dịch Đoạn Văn & Trích Từ Vựng" trên thanh menu để hệ thống tự động nhận diện và trích lọc các từ vựng hay!'
      );
    }
    throw new Error(
      'Không tìm thấy từ vựng hợp lệ. Vui lòng đảm bảo tệp chứa danh sách từ vựng theo định dạng: Bảng Word/PDF (Thuật ngữ, Phiên âm, Nghĩa), hoặc các dòng "Từ - Nghĩa", "Từ : Nghĩa", hoặc 2 cột cách nhau bằng Tab/khoảng trắng.'
    );
  }

  // If narrative text/essay yielded accidental cards from commas or sentence colons/dashes
  if (isNarrativeOrReadingPassage(text)) {
    throw new Error(
      'Tệp tải lên là bài văn hoặc bài đọc tiếng Anh (không phải danh sách từ vựng theo mẫu thẻ).\n\n💡 Gợi ý: Hãy sao chép văn bản này vào công cụ "Dịch Đoạn Văn & Trích Từ Vựng" trên thanh menu để hệ thống tự động phân tích và trích xuất từ vựng phù hợp!'
    );
  }

  // Low vocabulary density guard
  if (rawLines.length >= 8 && cards.length / rawLines.length < 0.2 && cards.length <= 2) {
    throw new Error(
      `Mật độ từ vựng trong tệp quá thấp (chỉ nhận diện được ${cards.length} mục trên tổng số ${rawLines.length} dòng). Vui lòng kiểm tra lại nội dung tài liệu.`
    );
  }

  const suggestedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  return { title: suggestedTitle, cards };
}
