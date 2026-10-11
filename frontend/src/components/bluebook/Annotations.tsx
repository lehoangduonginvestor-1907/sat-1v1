'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquarePlus, Trash2, Underline, X } from 'lucide-react';
import type { Highlight, HighlightColor } from '@/lib/highlights';
import type { TextSelection } from './RichContent';

export const COLORS: { id: HighlightColor; label: string; swatch: string }[] = [
  { id: 'yellow', label: 'Yellow', swatch: '#ffe066' },
  { id: 'blue', label: 'Blue', swatch: '#b9dcff' },
  { id: 'pink', label: 'Pink', swatch: '#ffc8dd' },
];

// Thanh nổi khi bôi chọn văn bản
export function SelectionMenu({ selection, onHighlight, onNote }: {
  selection: TextSelection;
  onHighlight: (color: HighlightColor, underline?: boolean) => void;
  onNote: () => void;
}) {
  const left = selection.rect.left + selection.rect.width / 2;
  // Sát mép trên (gần header) thì hiện bên dưới vùng chọn
  const below = selection.rect.top < 130;
  const style = below
    ? { left, top: selection.rect.bottom, transform: 'translate(-50%, 10px)' }
    : { left, top: selection.rect.top };
  return (
    <div className="bb-selection-menu" style={style} onMouseDown={e => e.preventDefault()}>
      {COLORS.map(c => (
        <button key={c.id} className="bb-swatch" style={{ background: c.swatch, borderColor: '#fff' }}
          onClick={() => onHighlight(c.id)} aria-label={`Highlight ${c.label}`} title={`Highlight ${c.label}`} />
      ))}
      <span className="w-px h-5 bg-white/30 mx-1" />
      <button onClick={() => onHighlight('yellow', true)} aria-label="Underline" title="Underline" className="p-0.5 hover:opacity-80"><Underline size={18} /></button>
      <button onClick={onNote} aria-label="Add note" title="Add note" className="p-0.5 hover:opacity-80"><MessageSquarePlus size={18} /></button>
    </div>
  );
}

// Bảng ghi chú trượt lên từ dưới (New Annotation)
export function AnnotationEditor({ highlight, text, isNew, onSave, onDelete, onClose }: {
  highlight: Highlight;
  text: string;
  isNew: boolean;
  onSave: (patch: Partial<Highlight>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [color, setColor] = useState(highlight.color);
  const [underline, setUnderline] = useState(highlight.underline);
  const [note, setNote] = useState(highlight.note);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[45] bg-white shadow-[0_-4px_16px_rgb(0_0_0/0.22)]" role="dialog" aria-label="Annotation">
      <div className="bb-annotate-bar">
        <span className="font-bold whitespace-nowrap">{isNew ? 'New Annotation:' : 'Edit Annotation:'}</span>
        <span className="truncate flex-1">&ldquo;{text}&rdquo;</span>
        <button onClick={onClose} className="flex items-center gap-1 font-bold text-sm tracking-wide">CLOSE <X size={18} /></button>
      </div>
      <div className="px-6 py-4 max-w-4xl">
        <div className="flex items-center gap-8 mb-3 text-[15px]">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Highlight Color:</span>
            {COLORS.map(c => (
              <button key={c.id} className={`bb-swatch ${color === c.id ? 'is-active' : ''}`} style={{ background: c.swatch }}
                onClick={() => setColor(c.id)} aria-label={c.label} aria-pressed={color === c.id} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">Underline style:</span>
            <button onClick={() => setUnderline(u => !u)} aria-pressed={underline}
              className={`w-7 h-7 flex items-center justify-center border-[1.5px] border-[var(--bb-ink)] rounded ${underline ? 'bg-[var(--bb-ink)] text-white' : ''}`}>
              <Underline size={16} />
            </button>
          </div>
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)} autoFocus maxLength={500}
          placeholder="Type your note here"
          className="w-full h-24 border-[1.5px] border-[#5f5f5f] rounded p-3 text-[15px] outline-none focus:border-[var(--bb-blue)] resize-none" />
        <div className="flex items-center gap-4 mt-3">
          <button className="bb-primary" onClick={() => onSave({ color, underline, note: note.trim() })}>Save</button>
          <button className="font-bold text-[15px] px-3 hover:underline" onClick={onClose}>Cancel</button>
          <button className="ml-auto flex items-center gap-1.5 text-[15px] font-semibold text-[var(--bb-wrong)] hover:underline" onClick={onDelete}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
