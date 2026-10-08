import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface GeminiMarkdownRendererProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

/**
 * Gemini-styled Markdown Renderer for AI Tutor responses.
 * Parses headers, bold, italics, lists, tables, code blocks, blockquotes, and IPA pronunciation
 * while eliminating raw asterisks and unformatted markdown syntax.
 */
export const GeminiMarkdownRenderer: React.FC<GeminiMarkdownRendererProps> = ({
  content,
  isUser = false,
  className = '',
}) => {
  if (!content) return null;

  // Split content by code blocks first
  const blocks = parseBlocks(content);

  return (
    <div
      className={`gemini-markdown-content leading-relaxed select-text space-y-2 ${
        isUser
          ? 'text-white'
          : 'text-slate-800 dark:text-slate-100'
      } ${className}`}
    >
      {blocks.map((block, idx) => (
        <BlockRenderer key={idx} block={block} isUser={isUser} />
      ))}
    </div>
  );
};

// ==========================================
// BLOCK PARSER & DATA STRUCTURES
// ==========================================

type BlockType =
  | { type: 'code'; language: string; code: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'hr' }
  | { type: 'quote'; lines: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: { num: string; text: string }[] }
  | { type: 'paragraph'; lines: string[] };

function parseBlocks(content: string): BlockType[] {
  const blocks: BlockType[] = [];
  const rawLines = content.split(/\r?\n/);
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Fenced Code Block: ```language
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: 'code',
        language,
        code: codeLines.join('\n'),
      });
      continue;
    }

    // 2. Horizontal Rule (---, ***, ___)
    if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 3. Headings: #, ##, ###, ####
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 4. Blockquotes: > quote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({
        type: 'quote',
        lines: quoteLines,
      });
      continue;
    }

    // 5. Tables: lines containing | with |---|---| separator
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < rawLines.length) {
      const nextLineTrimmed = rawLines[i + 1].trim();
      if (/^\|[\s\-:|]+\|$/.test(nextLineTrimmed)) {
        // Parse table
        const headers = trimmed
          .slice(1, -1)
          .split('|')
          .map((h) => h.trim());
        i += 2; // skip header & separator
        const rows: string[][] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
          const cells = rawLines[i]
            .trim()
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          rows.push(cells);
          i++;
        }
        blocks.push({
          type: 'table',
          headers,
          rows,
        });
        continue;
      }
    }

    // 6. Bullet Lists: *, -, +, •
    const bulletMatch = trimmed.match(/^[-*+•]\s+(.*)$/);
    if (bulletMatch) {
      const items: string[] = [];
      while (i < rawLines.length) {
        const curTrim = rawLines[i].trim();
        const curMatch = curTrim.match(/^[-*+•]\s+(.*)$/);
        if (curMatch) {
          items.push(curMatch[1]);
          i++;
        } else if (curTrim === '') {
          // Check if next non-empty line is also bullet
          let nextIdx = i + 1;
          while (nextIdx < rawLines.length && rawLines[nextIdx].trim() === '') nextIdx++;
          if (nextIdx < rawLines.length && /^[-*+•]\s+/.test(rawLines[nextIdx].trim())) {
            i = nextIdx;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      blocks.push({
        type: 'bullet-list',
        items,
      });
      continue;
    }

    // 7. Numbered Lists: 1., 2., etc.
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (numMatch) {
      const items: { num: string; text: string }[] = [];
      while (i < rawLines.length) {
        const curTrim = rawLines[i].trim();
        const curMatch = curTrim.match(/^(\d+)[.)]\s+(.*)$/);
        if (curMatch) {
          items.push({ num: curMatch[1], text: curMatch[2] });
          i++;
        } else if (curTrim === '') {
          let nextIdx = i + 1;
          while (nextIdx < rawLines.length && rawLines[nextIdx].trim() === '') nextIdx++;
          if (nextIdx < rawLines.length && /^(\d+)[.)]\s+/.test(rawLines[nextIdx].trim())) {
            i = nextIdx;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      blocks.push({
        type: 'numbered-list',
        items,
      });
      continue;
    }

    // 8. Empty lines
    if (trimmed === '') {
      i++;
      continue;
    }

    // 9. Regular Paragraph
    const paraLines: string[] = [];
    while (i < rawLines.length) {
      const curTrim = rawLines[i].trim();
      if (
        curTrim === '' ||
        curTrim.startsWith('```') ||
        curTrim.startsWith('#') ||
        curTrim.startsWith('>') ||
        /^(?:---|\*\*\*|___)\s*$/.test(curTrim) ||
        /^[-*+•]\s+/.test(curTrim) ||
        /^(\d+)[.)]\s+/.test(curTrim) ||
        (curTrim.startsWith('|') && curTrim.endsWith('|'))
      ) {
        break;
      }
      paraLines.push(rawLines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        lines: paraLines,
      });
    }
  }

  return blocks;
}

// ==========================================
// BLOCK RENDERER
// ==========================================

const BlockRenderer: React.FC<{ block: BlockType; isUser: boolean }> = ({ block, isUser }) => {
  switch (block.type) {
    case 'code':
      return <CodeBlock code={block.code} language={block.language} />;

    case 'heading': {
      const content = renderInline(block.text, isUser);
      if (block.level === 1) {
        return (
          <h1 className="text-base sm:text-lg font-black tracking-tight mt-3 mb-1 text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5">
            <span className="w-1.5 h-4 rounded-full bg-indigo-600 shrink-0" />
            <span>{content}</span>
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight mt-2.5 mb-1 text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 rounded-full bg-violet-500 shrink-0" />
            <span>{content}</span>
          </h2>
        );
      }
      if (block.level === 3) {
        return (
          <h3 className="text-xs sm:text-sm font-bold mt-2 mb-0.5 text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>{content}</span>
          </h3>
        );
      }
      return (
        <h4 className="text-xs font-semibold mt-1.5 mb-0.5 text-slate-800 dark:text-slate-200">
          {content}
        </h4>
      );
    }

    case 'hr':
      return (
        <hr className="my-2 border-slate-200/80 dark:border-slate-700/80" />
      );

    case 'quote':
      return (
        <div className="border-l-3 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 px-3 py-1.5 my-1.5 rounded-r-xl text-slate-700 dark:text-slate-300 italic text-xs leading-relaxed">
          {block.lines.map((l, idx) => (
            <p key={idx}>{renderInline(l, isUser)}</p>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className="overflow-x-auto my-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <table className="min-w-full text-xs divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80">
              <tr>
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-2.5 py-1.5 text-left font-bold text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wider"
                  >
                    {renderInline(h, isUser)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
              {block.rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-2.5 py-1.5 text-slate-800 dark:text-slate-200">
                      {renderInline(cell, isUser)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'bullet-list':
      return (
        <ul className="space-y-1.5 my-1.5 pl-0.5">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  isUser ? 'bg-white/80' : 'bg-indigo-500 dark:bg-indigo-400'
                }`}
              />
              <span className="flex-1">{renderInline(item, isUser)}</span>
            </li>
          ))}
        </ul>
      );

    case 'numbered-list':
      return (
        <ol className="space-y-1.5 my-1.5 pl-0.5">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
              <span
                className={`text-[11px] font-bold min-w-4 text-right shrink-0 mt-0.5 ${
                  isUser ? 'text-white/90' : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {item.num}.
              </span>
              <span className="flex-1">{renderInline(item.text, isUser)}</span>
            </li>
          ))}
        </ol>
      );

    case 'paragraph':
      return (
        <div className="space-y-1">
          {block.lines.map((line, idx) => (
            <p key={idx} className="text-xs leading-relaxed">
              {renderInline(line, isUser)}
            </p>
          ))}
        </div>
      );

    default:
      return null;
  }
};

// ==========================================
// CODE BLOCK COMPONENT WITH COPY
// ==========================================

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-md">
      <div className="px-3 py-1.5 bg-slate-800 flex items-center justify-between text-[11px] text-slate-300 border-b border-slate-700 select-none">
        <span className="font-mono uppercase font-semibold text-[10px] tracking-wider text-slate-400">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-700 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold text-[10px]">Đã chép</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="text-[10px]">Chép mã</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono text-emerald-300 dark:text-emerald-300 leading-relaxed bg-slate-950/70 select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ==========================================
// INLINE PARSER & RENDERER
// ==========================================

/**
 * Parses markdown inline syntax:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Bold Italic: ***text*** or ___text___
 * - Inline Code: `code`
 * - Strikethrough: ~~text~~
 * - Links: [label](url)
 * - IPA Transcriptions: /.../
 * - Strips lone / stray asterisks so text is never cluttered
 */
function renderInline(text: string, isUser: boolean): React.ReactNode[] {
  if (!text) return [];

  // 1. Clean up stray asterisks that aren't pairs: e.g. " * " or leading orphan asterisk
  let sanitized = text
    // Replace leading lone asterisk if not part of bold/italic
    .replace(/^(\s*)\*(\s+)/, '$1•$2');

  // Match inline tokens
  // Order matters: match longest tokens first
  const TOKEN_REGEX = /(`[^`]+`|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^)]+\)|\/(?:[a-zA-Zˈˌːæɑɒɔəɛɜɪiʊuʌθðʃʒŋɡ./ -]{2,})\/)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(sanitized)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      const plainText = sanitized.slice(lastIndex, match.index);
      nodes.push(cleanPlainText(plainText));
    }

    const token = match[0];

    // Inline Code: `...`
    if (token.startsWith('`') && token.endsWith('`')) {
      const code = token.slice(1, -1);
      nodes.push(
        <code
          key={match.index}
          className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${
            isUser
              ? 'bg-white/20 text-white border-white/25'
              : 'bg-slate-200/80 dark:bg-slate-700/80 text-indigo-700 dark:text-indigo-300 border-slate-300/60 dark:border-slate-600/60'
          }`}
        >
          {code}
        </code>
      );
    }
    // Bold Italic: ***...*** or ___...___
    else if (
      (token.startsWith('***') && token.endsWith('***')) ||
      (token.startsWith('___') && token.endsWith('___'))
    ) {
      const inner = token.slice(3, -3);
      nodes.push(
        <strong
          key={match.index}
          className={`font-black italic ${isUser ? 'text-white' : 'text-slate-900 dark:text-white'}`}
        >
          {inner}
        </strong>
      );
    }
    // Bold: **...** or __...__
    else if (
      (token.startsWith('**') && token.endsWith('**')) ||
      (token.startsWith('__') && token.endsWith('__'))
    ) {
      const inner = token.slice(2, -2);
      nodes.push(
        <strong
          key={match.index}
          className={`font-bold ${
            isUser ? 'text-white font-extrabold' : 'text-slate-900 dark:text-slate-50'
          }`}
        >
          {inner}
        </strong>
      );
    }
    // Italic: *...* or _..._
    else if (
      (token.startsWith('*') && token.endsWith('*')) ||
      (token.startsWith('_') && token.endsWith('_'))
    ) {
      const inner = token.slice(1, -1);
      nodes.push(
        <em
          key={match.index}
          className={`italic font-medium ${
            isUser ? 'text-violet-100' : 'text-indigo-950 dark:text-indigo-200'
          }`}
        >
          {inner}
        </em>
      );
    }
    // Strikethrough: ~~...~~
    else if (token.startsWith('~~') && token.endsWith('~~')) {
      const inner = token.slice(2, -2);
      nodes.push(
        <del key={match.index} className="line-through opacity-70">
          {inner}
        </del>
      );
    }
    // Link: [label](url)
    else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        nodes.push(cleanPlainText(token));
      }
    }
    // IPA Pronunciation: /.../
    else if (token.startsWith('/') && token.endsWith('/')) {
      nodes.push(
        <span
          key={match.index}
          className={`inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded font-mono text-[11px] font-bold border select-text ${
            isUser
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-violet-100/90 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/80 shadow-2xs'
          }`}
          title="Phiên âm quốc tế IPA"
        >
          {token}
        </span>
      );
    } else {
      nodes.push(cleanPlainText(token));
    }

    lastIndex = match.index + token.length;
  }

  // Trailing text
  if (lastIndex < sanitized.length) {
    nodes.push(cleanPlainText(sanitized.slice(lastIndex)));
  }

  return nodes;
}

/**
 * Strips remaining orphan asterisks from plain text segment
 */
function cleanPlainText(text: string): string {
  // Replace lone asterisk surrounded by spaces or at boundaries
  return text
    .replace(/(^|\s)\*(\s|$)/g, '$1$2')
    .replace(/\*+/g, '');
}

export default GeminiMarkdownRenderer;
