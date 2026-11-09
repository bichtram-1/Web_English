/**
 * Utilities for extracting plain text from DOCX and PDF documents in the browser.
 * Leverages dynamic imports so mammoth and pdfjs-dist are only downloaded on-demand.
 */

/**
 * Robust HTML to lines parser that keeps table rows intact as tab-separated lines.
 * Internal paragraphs or <br> inside a cell are collapsed to spaces instead of breaking the row.
 */
function parseMammothHtmlToLines(html: string): string {
  // If in browser, use native DOMParser for 100% robust HTML structure traversal
  if (typeof window !== 'undefined' && window.DOMParser) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const lines: string[] = [];

      // 1. Process all tables: each <tr> becomes exactly one tab-delimited line
      const tables = doc.querySelectorAll('table');
      tables.forEach((table) => {
        const rows = table.querySelectorAll('tr');
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll('th, td'));
          if (cells.length > 0) {
            const rowText = cells
              .map((cell) => cell.textContent?.trim().replace(/\s+/g, ' ') || '')
              .join('\t');
            if (rowText.replace(/\t/g, '').trim().length > 0) {
              lines.push(rowText);
            }
          }
        });
        table.remove(); // Remove table from DOM so cell contents don't duplicate into paragraphs
      });

      // 2. Process remaining paragraphs, headings, list items outside tables
      const elements = doc.querySelectorAll('p, h1, h2, h3, h4, li');
      elements.forEach((el) => {
        const text = el.textContent?.trim().replace(/\s+/g, ' ') || '';
        if (text.length > 0) {
          lines.push(text);
        }
      });

      if (lines.length > 0) {
        return lines.join('\n');
      }
    } catch {
      // Fallback to regex
    }
  }

  // Regex fallback: parses table rows and ensures cells don't split rows with newlines
  const lines: string[] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  let hasTables = false;

  while ((trMatch = trRegex.exec(html)) !== null) {
    hasTables = true;
    const rowHtml = trMatch[1];
    const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    let cellMatch;
    const cells: string[] = [];

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      let cellText = cellMatch[1];
      cellText = cellText.replace(/<br\s*\/?>/gi, ' ');
      cellText = cellText.replace(/<\/p>\s*<p[^>]*>/gi, ' - ');
      cellText = cellText.replace(/<[^>]+>/g, '');
      cellText = cellText
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellText);
    }

    if (cells.length > 0 && cells.some((c) => c.length > 0)) {
      lines.push(cells.join('\t'));
    }
  }

  // Extract paragraphs outside tables
  const cleanHtml = hasTables ? html.replace(/<table[\s\S]*?<\/table>/gi, '') : html;
  const pRegex = /<(?:p|h\d|li)[^>]*>([\s\S]*?)<\/(?:p|h\d|li)>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(cleanHtml)) !== null) {
    const text = pMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text.length > 0) {
      lines.push(text);
    }
  }

  return lines.join('\n');
}

export async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Check if file is legacy binary .doc (OLE2 magic bytes: 0xD0, 0xCF, 0x11, 0xE0)
  const header = new Uint8Array(arrayBuffer.slice(0, 4));
  if (header[0] === 0xd0 && header[1] === 0xcf && header[2] === 0x11 && header[3] === 0xe0) {
    throw new Error(
      'Định dạng .doc (Word 97-2003 cũ) không được hỗ trợ trực tiếp. Vui lòng mở tài liệu và "Save As" sang file .docx hoặc .pdf để nhập chuẩn xác nhất!'
    );
  }

  try {
    const mammoth = await import('mammoth');
    // Convert docx to HTML so table structure is preserved
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value || '';

    // Convert HTML to lines with intact table rows
    return parseMammothHtmlToLines(html);
  } catch (err: any) {
    if (err.message && err.message.includes('Word 97-2003')) {
      throw err;
    }
    throw new Error(`Lỗi khi đọc file Word (.docx): ${err.message || 'Tài liệu bị lỗi hoặc có mật khẩu'}`);
  }
}

export async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    const pdfWorkerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      let lastY: number | null = null;
      let pageText = '';

      for (const item of textContent.items as any[]) {
        if (!item.str) continue;
        const currentY = item.transform ? Math.round(item.transform[5]) : null;
        // If vertical position changed significantly (> 4px), it's a new line
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
          pageText += '\n';
        } else if (
          pageText.length > 0 &&
          !pageText.endsWith('\n') &&
          !pageText.endsWith(' ') &&
          !pageText.endsWith('\t')
        ) {
          // Horizontally separated text items on the same line -> separated by tab
          pageText += '\t';
        }
        pageText += item.str;
        lastY = currentY;
      }

      fullText += pageText + '\n';
    }

    return fullText;
  } catch (err: any) {
    throw new Error(`Lỗi khi đọc file PDF: ${err.message || 'File PDF bị khóa mật khẩu hoặc không chứa văn bản có thể trích xuất'}`);
  }
}
