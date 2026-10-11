// Bộ đọc Markdown rút gọn cho bài học /learn (chạy lúc build, phía server).
//
//   ## Tiêu đề / ### Tiêu đề nhỏ        đoạn văn cách nhau bằng dòng trống
//   - mục / 1. mục                      | bảng | kiểu | GitHub |
//   :::rule Tiêu đề  …  :::             hộp (rule, tip, trap, note, steps)
//   :::examples                          ✓ câu đúng // ghi chú   ✗ câu sai // ghi chú
//   :::check                             câu hỏi nhanh: đề, "- [x] đúng", "- [ ] sai", "> giải thích"
//
// Định dạng trong dòng (**đậm**, *nghiêng*, [[gạch chân]], ~~gạch bỏ~~, ____ ô trống) do LessonView hiển thị.
// Công thức: $x^2$ trong dòng, $$...$$ trên một dòng riêng; đổi sang MathML ngay lúc build (temml), \$ = dấu đô la.

import temml from 'temml';

export type BoxKind = 'rule' | 'tip' | 'trap' | 'note' | 'steps';

export type Block =
  | { t: 'h2' | 'h3'; text: string; id: string }
  | { t: 'p'; text: string }
  | { t: 'math'; html: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'box'; kind: BoxKind; title: string; blocks: Block[] }
  | { t: 'examples'; items: { ok: boolean; text: string; note: string }[] }
  | { t: 'check'; n: number; prompt: string; options: string[]; answer: number; explanation: string };

// Công thức trong dòng được bọc giữa hai ký tự điều khiển U+0001 … U+0002 để Inline chèn MathML nguyên vẹn
export const MATH_OPEN = '\u0001';
export const MATH_CLOSE = '\u0002';

function tex(source: string, displayMode: boolean) {
  return temml.renderToString(source, { displayMode, throwOnError: true });
}

function math(text: string): string {
  return text
    .replace(/(?<!\\)\$((?:[^$\\]|\\.)+?)\$/g, (_, src: string) => MATH_OPEN + tex(src, false) + MATH_CLOSE)
    .replace(/\\\$/g, '$');
}

const BOXES = new Set<BoxKind>(['rule', 'tip', 'trap', 'note', 'steps']);

const slugify = (s: string) => s.toLowerCase().replace(/[*[\]~]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const splitRow = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());

function parseCheck(lines: string[], n: number): Block {
  const prompt: string[] = [];
  const options: string[] = [];
  const explanation: string[] = [];
  let answer = -1;
  for (const line of lines) {
    const opt = line.match(/^- \[( |x)\] (.*)$/);
    if (opt) {
      if (opt[1] === 'x') answer = options.length;
      options.push(opt[2]);
    } else if (line.startsWith('>')) {
      explanation.push(line.replace(/^>\s?/, ''));
    } else if (line.trim()) {
      (options.length ? explanation : prompt).push(line.trim());
    }
  }
  if (answer < 0 || options.length < 2) throw new Error(`Quick check ${n} needs options and one "- [x]" answer: ${prompt.join(' ')}`);
  return { t: 'check', n, prompt: math(prompt.join(' ')), options: options.map(math), answer, explanation: math(explanation.join(' ')) };
}

function parseExamples(lines: string[]): Block {
  const items = lines
    .filter(l => l.trim())
    .map(l => {
      const m = l.trim().match(/^([✓✗])\s*(.*?)(?:\s+\/\/\s+(.*))?$/);
      if (!m) throw new Error(`Example lines start with ✓ or ✗: ${l}`);
      return { ok: m[1] === '✓', text: math(m[2]), note: math(m[3] || '') };
    });
  return { t: 'examples', items };
}

export function parseLesson(source: string): Block[] {
  let checks = 0;

  function parse(lines: string[]): Block[] {
    const blocks: Block[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) { i++; continue; }

      const fence = trimmed.match(/^:::(\w+)\s*(.*)$/);
      if (fence) {
        const inner: string[] = [];
        let depth = 1;
        i++;
        while (i < lines.length) {
          const l = lines[i].trim();
          if (/^:::\w+/.test(l)) depth++;
          else if (l === ':::' && --depth === 0) break;
          inner.push(lines[i]);
          i++;
        }
        i++; // dòng ":::"
        const kind = fence[1];
        if (kind === 'check') blocks.push(parseCheck(inner, ++checks));
        else if (kind === 'examples') blocks.push(parseExamples(inner));
        else if (BOXES.has(kind as BoxKind)) blocks.push({ t: 'box', kind: kind as BoxKind, title: fence[2], blocks: parse(inner) });
        else throw new Error(`Unknown block :::${kind}`);
        continue;
      }

      const display = trimmed.match(/^\$\$(.+)\$\$$/);
      if (display) {
        blocks.push({ t: 'math', html: tex(display[1], true) });
        i++;
        continue;
      }

      const heading = trimmed.match(/^(##|###) (.*)$/);
      if (heading) {
        blocks.push({ t: heading[1] === '##' ? 'h2' : 'h3', text: math(heading[2]), id: slugify(heading[2]) });
        i++;
        continue;
      }

      if (trimmed.startsWith('|')) {
        const rows: string[][] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          if (!/^\|?\s*:?-{2,}/.test(lines[i].trim())) rows.push(splitRow(lines[i]).map(math));
          i++;
        }
        blocks.push({ t: 'table', head: rows[0], rows: rows.slice(1) });
        continue;
      }

      const bullet = /^(- |\d+\. )/;
      if (bullet.test(trimmed)) {
        const ordered = /^\d+\. /.test(trimmed);
        const items: string[] = [];
        while (i < lines.length && lines[i].trim()) {
          const l = lines[i].trim();
          if (bullet.test(l)) items.push(l.replace(bullet, ''));
          else items[items.length - 1] += ` ${l}`; // dòng nối tiếp của mục trước
          i++;
        }
        blocks.push({ t: ordered ? 'ol' : 'ul', items: items.map(math) });
        continue;
      }

      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(:::|##|\||- |\d+\. |\$\$)/.test(lines[i].trim())) {
        para.push(lines[i].trim());
        i++;
      }
      blocks.push({ t: 'p', text: math(para.join(' ')) });
    }
    return blocks;
  }

  return parse(source.replace(/\r\n/g, '\n').split('\n'));
}
