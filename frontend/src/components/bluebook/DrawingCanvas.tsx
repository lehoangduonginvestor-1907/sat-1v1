'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, Trash2, X } from 'lucide-react';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  color: string;
  width: number;
  points: StrokePoint[];
}

const COLORS = [
  { id: 'yellow', hex: '#ffe600', label: 'Yellow' },
  { id: 'green', hex: '#22c55e', label: 'Green' },
  { id: 'blue', hex: '#3b82f6', label: 'Blue' },
  { id: 'pink', hex: '#ec4899', label: 'Pink' },
];

interface Props {
  active: boolean;
  questionId: string;
  strokes: Stroke[];
  onChangeStrokes: (strokes: Stroke[]) => void;
  onClose: () => void;
}

export default function DrawingCanvas({ active, questionId, strokes, onChangeStrokes, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [color, setColor] = useState(COLORS[0].hex);
  const [lineWidth, setLineWidth] = useState(2.5);
  const isDrawing = useRef(false);
  const currentPoints = useRef<StrokePoint[]>([]);

  // Vẽ lại canvas khi strokes hoặc kích thước thay đổi
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (!stroke.points.length) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  // Đồng bộ kích thước canvas với viewport câu hỏi
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      redraw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [redraw, active]);

  useEffect(() => {
    redraw();
  }, [redraw, questionId]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!active) return;
    const pt = getPos(e);
    if (!pt) return;
    isDrawing.current = true;
    currentPoints.current = [pt];

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(pt.x, pt.y);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !active) return;
    const pt = getPos(e);
    if (!pt) return;
    currentPoints.current.push(pt);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
  };

  const handleEnd = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentPoints.current.length > 1) {
      const newStroke: Stroke = {
        color,
        width: lineWidth,
        points: currentPoints.current,
      };
      onChangeStrokes([...strokes, newStroke]);
    }
    currentPoints.current = [];
  };

  const handleUndo = () => {
    if (!strokes.length) return;
    onChangeStrokes(strokes.slice(0, -1));
  };

  const handleClear = () => {
    onChangeStrokes([]);
  };

  if (!active && !strokes.length) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none z-20 ${active ? '!pointer-events-auto' : ''}`}
      style={{ touchAction: active ? 'none' : 'auto' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {active && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 bg-[#1e1e1e] text-white rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 sm:gap-4 select-none">
          {/* Chọn màu */}
          <div className="flex items-center gap-2 border-r border-white/20 pr-3">
            {COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.hex)}
                className={`w-6 h-6 rounded-full transition-transform ${color === c.hex ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
          </div>

          {/* Chọn độ dày nét */}
          <div className="flex items-center gap-1.5 border-r border-white/20 pr-3">
            <button
              type="button"
              onClick={() => setLineWidth(2)}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${lineWidth === 2 ? 'bg-white/20 text-white' : 'text-white/60'}`}
              title="Fine line"
            >
              1x
            </button>
            <button
              type="button"
              onClick={() => setLineWidth(4)}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${lineWidth === 4 ? 'bg-white/20 text-white' : 'text-white/60'}`}
              title="Thick line"
            >
              2x
            </button>
          </div>

          {/* Hoàn tác (Undo) */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!strokes.length}
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Undo last stroke"
          >
            <RotateCcw size={14} /> Undo
          </button>

          {/* Xóa sạch (Clear) */}
          <button
            type="button"
            onClick={handleClear}
            disabled={!strokes.length}
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-red-300"
            title="Clear all drawings"
          >
            <Trash2 size={14} /> Clear
          </button>

          {/* Đóng / Xong */}
          <button
            type="button"
            onClick={onClose}
            className="bb-primary !py-1 !px-3 !text-xs !rounded-full flex items-center gap-1"
            title="Done drawing"
          >
            <Check size={13} /> Done
          </button>
        </div>
      )}
    </div>
  );
}
