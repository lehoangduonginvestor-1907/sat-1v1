'use client';

import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { GripIcon } from './icons';

interface Props {
  title: string;
  hidden?: boolean;
  initial: { x: number; y: number };
  size: { width: number; height: number };
  expanded?: boolean;
  onToggleExpand?: () => void;
  expandLabels?: [string, string]; // [đang thu gọn, đang mở rộng]
  onClose: () => void;
  children: React.ReactNode;
}

// Bảng nổi kéo thả theo kiểu Calculator / Reference Sheet của Bluebook
export default function DraggablePanel({ title, hidden, initial, size, expanded, onToggleExpand, expandLabels = ['Expand', 'Collapse'], onClose, children }: Props) {
  const [pos, setPos] = useState(initial);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const clamp = (x: number, y: number) => ({
    x: Math.min(Math.max(x, 8 - size.width + 120), window.innerWidth - 120),
    y: Math.min(Math.max(y, 0), window.innerHeight - 48),
  });

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current) setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div className="bb-panel" style={{ left: pos.x, top: pos.y, width: size.width, height: size.height, display: hidden ? 'none' : undefined }}
      role="dialog" aria-label={title}>
      <div className="bb-panel-bar" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <span>{title}</span>
        <GripIcon />
        <div className="flex items-center justify-end gap-4">
          {onToggleExpand && (
            <button onClick={onToggleExpand} className="text-sm font-bold hover:underline">
              {expanded ? expandLabels[1] : expandLabels[0]}
            </button>
          )}
          <button onClick={onClose} aria-label={`Close ${title}`} className="hover:opacity-80"><X size={20} /></button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  );
}
