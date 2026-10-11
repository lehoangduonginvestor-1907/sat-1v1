'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { applyHighlights, Highlight, rangeToOffsets, textOf } from '@/lib/highlights';

export interface TextSelection {
  start: number;
  end: number;
  text: string;
  rect: DOMRect;
}

interface Props {
  html: string;
  className?: string;
  highlights?: Highlight[];
  // Bật khi vùng này cho phép tô sáng (đoạn văn, đề bài)
  onSelectText?: (selection: TextSelection | null) => void;
  onHighlightClick?: (id: string, rect: DOMRect) => void;
  inline?: boolean; // dùng <span> (vd. nội dung lựa chọn nằm trong <button>)
}

// HTML đã được làm sạch lúc dựng ngân hàng câu hỏi (tools/build_bank.py).
// Gán innerHTML thủ công thay vì dangerouslySetInnerHTML để chèn <mark> tô sáng
// mà React không ghi đè.
export default function RichContent({ html, className = '', highlights, onSelectText, onHighlightClick, inline }: Props) {
  const ref = useRef<HTMLDivElement & HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = html;
    if (highlights?.length) applyHighlights(el, highlights);
  }, [html, highlights]);

  const handleMouseUp = () => {
    const el = ref.current;
    if (!el || !onSelectText) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return onSelectText(null);
    const range = selection.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;
    const offsets = rangeToOffsets(el, range);
    if (!offsets) return onSelectText(null);
    onSelectText({ ...offsets, text: textOf(el, offsets.start, offsets.end), rect: range.getBoundingClientRect() });
  };

  const handleClick = (e: React.MouseEvent) => {
    const mark = (e.target as HTMLElement).closest('mark[data-hid]') as HTMLElement | null;
    if (mark && onHighlightClick && window.getSelection()?.isCollapsed) {
      onHighlightClick(mark.dataset.hid!, mark.getBoundingClientRect());
    }
  };

  const Tag = inline ? 'span' : 'div';
  return <Tag ref={ref} className={`bb-content ${inline ? 'block' : ''} ${className}`} onMouseUp={handleMouseUp} onClick={handleClick} />;
}
