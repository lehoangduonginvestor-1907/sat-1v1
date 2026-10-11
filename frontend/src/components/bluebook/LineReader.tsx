'use client';

import React, { useEffect, useRef, useState } from 'react';

const BAND = 76; // khoảng 3 dòng chữ

// Line Reader: làm mờ toàn bộ nội dung trừ một dải ngang đi theo con trỏ (hoặc phím mũi tên lên/xuống)
export default function LineReader() {
  const ref = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(160);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const onMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      setY(Math.min(Math.max(e.clientY - rect.top, BAND / 2), rect.height - BAND / 2));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setY(v => v + (e.key === 'ArrowDown' ? 26 : -26));
      }
    };
    parent.addEventListener('pointermove', onMove);
    window.addEventListener('keydown', onKey);
    return () => {
      parent.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const top = y - BAND / 2;
  return (
    <div ref={ref} className="bb-line-reader" aria-hidden="true">
      <div className="absolute left-0 right-0 top-0 bg-black/60" style={{ height: Math.max(top, 0) }} />
      <div className="absolute left-0 right-0 border-y-2 border-[var(--bb-ink)]" style={{ top, height: BAND }} />
      <div className="absolute left-0 right-0 bottom-0 bg-black/60" style={{ top: top + BAND }} />
    </div>
  );
}
