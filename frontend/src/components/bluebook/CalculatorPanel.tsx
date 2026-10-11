'use client';

import React, { useEffect, useRef, useState } from 'react';
import DraggablePanel from './DraggablePanel';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Desmos?: any;
  }
}

// Desmos Graphing Calculator, giữ nguyên biểu thức khi đóng/mở lại
export default function CalculatorPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calcRef = useRef<any>(null);
  const [expanded, setExpanded] = useState(false);
  const unavailable = open && typeof window !== 'undefined' && !window.Desmos;

  useEffect(() => {
    if (!open || calcRef.current || !hostRef.current || !window.Desmos) return;
    calcRef.current = window.Desmos.GraphingCalculator(hostRef.current, {
      keypad: true,
      expressions: true,
      settingsMenu: true,
      zoomButtons: true,
      expressionsTopbar: true,
      border: false,
    });
  }, [open]);

  useEffect(() => {
    calcRef.current?.resize();
  }, [expanded, open]);

  useEffect(() => () => calcRef.current?.destroy(), []);

  return (
    <DraggablePanel
      title="Calculator"
      hidden={!open}
      initial={{ x: 24, y: 96 }}
      size={expanded ? { width: 860, height: 600 } : { width: 360, height: 540 }}
      expanded={expanded}
      onToggleExpand={() => setExpanded(e => !e)}
      expandLabels={['Expand', 'Collapse']}
      onClose={onClose}
    >
      {unavailable && <p className="p-4 text-sm">The calculator could not be loaded. Check your internet connection.</p>}
      <div ref={hostRef} className="w-full h-full" />
    </DraggablePanel>
  );
}
