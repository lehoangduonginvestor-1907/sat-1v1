'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { Highlight, HighlightColor } from '@/lib/highlights';
import { AnnotationEditor, SelectionMenu } from './Annotations';
import type { TextSelection } from './RichContent';

type Pending = { key: string; selection: TextSelection };
type Editing = { key: string; id: string; isNew: boolean; text: string };

const newId = () => Math.random().toString(36).slice(2, 10);

// Công cụ Highlights & Notes dùng chung cho TestShell và Finish Line
export function useAnnotations() {
  const [highlights, setHighlights] = useState<Record<string, Highlight[]>>({});
  const [pending, setPending] = useState<Pending | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  // Bỏ vùng chọn khi bấm ra ngoài
  useEffect(() => {
    if (!pending) return;
    const clear = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.bb-selection-menu, .bb-tool')) setPending(null);
    };
    window.addEventListener('mousedown', clear);
    return () => window.removeEventListener('mousedown', clear);
  }, [pending]);

  const clearPending = useCallback(() => setPending(null), []);

  const flash = (msg: string) => {
    setHint(msg);
    setTimeout(() => setHint(null), 3000);
  };

  const addHighlight = (color: HighlightColor, underline = false, openNote = false) => {
    if (!pending) return;
    const h: Highlight = { id: newId(), start: pending.selection.start, end: pending.selection.end, color, underline, note: '' };
    setHighlights(prev => ({ ...prev, [pending.key]: [...(prev[pending.key] || []), h] }));
    if (openNote) setEditing({ key: pending.key, id: h.id, isNew: true, text: pending.selection.text });
    window.getSelection()?.removeAllRanges();
    setPending(null);
  };

  const updateHighlight = (key: string, id: string, patch: Partial<Highlight> | null) => {
    setHighlights(prev => ({
      ...prev,
      [key]: patch === null
        ? (prev[key] || []).filter(h => h.id !== id)
        : (prev[key] || []).map(h => (h.id === id ? { ...h, ...patch } : h)),
    }));
  };

  const editingHighlight = editing && (highlights[editing.key] || []).find(h => h.id === editing.id);

  return {
    highlights,
    clearHighlights: () => setHighlights({}),
    clearPending,
    flash,
    // Nút "Highlights & Notes" trên header
    tool: {
      active: Boolean(pending || editing),
      onClick: () => (pending ? addHighlight('yellow', false, true) : flash('Select the text you want to highlight or annotate first.')),
      hint,
    },
    // Props cho QuestionView
    viewProps: {
      highlights,
      onSelectText: (key: string, selection: TextSelection | null) => setPending(selection ? { key, selection } : null),
      onHighlightClick: (key: string, id: string) => {
        const h = (highlights[key] || []).find(x => x.id === id);
        const el = document.querySelector(`mark[data-hid="${id}"]`);
        if (h) setEditing({ key, id, isNew: false, text: el?.textContent || '' });
      },
    },
    overlays: (
      <>
        {pending && !editing && (
          <SelectionMenu selection={pending.selection} onHighlight={addHighlight} onNote={() => addHighlight('yellow', false, true)} />
        )}
        {editing && editingHighlight && (
          <AnnotationEditor
            highlight={editingHighlight}
            text={editing.text}
            isNew={editing.isNew}
            onSave={patch => { updateHighlight(editing.key, editing.id, patch); setEditing(null); }}
            onDelete={() => { updateHighlight(editing.key, editing.id, null); setEditing(null); }}
            onClose={() => setEditing(null)}
          />
        )}
      </>
    ),
  };
}
