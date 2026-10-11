// Tô sáng / ghi chú trên đoạn văn: lưu theo vị trí ký tự trong text của vùng nội dung,
// để áp lại được sau mỗi lần render HTML.

export type HighlightColor = 'yellow' | 'blue' | 'pink';

export interface Highlight {
  id: string;
  start: number;
  end: number;
  color: HighlightColor;
  underline: boolean;
  note: string;
}

// Bỏ qua chữ trong công thức và chữ chỉ dành cho trình đọc màn hình
function isSkipped(node: Node, root: Node): boolean {
  for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
    if (el.tagName.toLowerCase() === 'math' || el.classList.contains('sr-only')) return true;
  }
  return false;
}

function textNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => (isSkipped(node, root) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  return nodes;
}

export function rangeToOffsets(root: Node, range: Range): { start: number; end: number } | null {
  let pos = 0;
  let start = -1;
  let end = -1;
  for (const node of textNodes(root)) {
    const len = node.data.length;
    if (range.intersectsNode(node)) {
      const s = node === range.startContainer ? range.startOffset : 0;
      const e = node === range.endContainer ? range.endOffset : len;
      if (e > s) {
        if (start < 0) start = pos + s;
        end = pos + e;
      }
    }
    pos += len;
  }
  return start >= 0 && end > start ? { start, end } : null;
}

export function applyHighlights(root: HTMLElement, highlights: Highlight[]) {
  for (const h of [...highlights].sort((a, b) => a.start - b.start)) {
    let pos = 0;
    for (const node of textNodes(root)) {
      const len = node.data.length;
      const from = Math.max(h.start - pos, 0);
      const to = Math.min(h.end - pos, len);
      pos += len;
      if (to <= from || !node.data.slice(from, to).trim()) continue;

      let target = node;
      if (from > 0) target = target.splitText(from);
      if (to - from < target.data.length) target.splitText(to - from);
      const mark = document.createElement('mark');
      mark.className = `bb-hl bb-hl-${h.color}${h.underline ? ' bb-hl-underline' : ''}${h.note ? ' bb-hl-note' : ''}`;
      mark.dataset.hid = h.id;
      target.parentNode!.insertBefore(mark, target);
      mark.appendChild(target);
    }
  }
}

export function textOf(root: Node, start: number, end: number): string {
  return textNodes(root).map(n => n.data).join('').slice(start, end);
}
