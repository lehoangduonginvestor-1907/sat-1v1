'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { AnnotateIcon, CalculatorIcon, MoreIcon, PenIcon, ReferenceIcon } from './icons';
import { SectionDirections } from './Directions';

interface Props {
  title: string;
  isMath: boolean;
  secondsLeft: number | null; // null = không tính giờ
  untimedLabel?: string;
  tools: {
    annotate?: { active: boolean; onClick: () => void; hint?: string | null };
    draw?: { active: boolean; onClick: () => void };
    calculator?: { active: boolean; onClick: () => void };
    reference?: { active: boolean; onClick: () => void };
  };
  menu: { label: string; onClick: () => void; checked?: boolean }[];
}

export function formatClock(seconds: number) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

export default function BluebookHeader({ title, isMath, secondsLeft, untimedLabel = 'Untimed', tools, menu }: Props) {
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [timerHidden, setTimerHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [alert, setAlert] = useState(false);
  const alerted = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Còn 5 phút: hiện lại đồng hồ (không ẩn được nữa) và báo một lần.
  // Bài ngắn hơn 5 phút ngay từ đầu (vd. trận 1v1 ngắn) thì không báo.
  const [initialSeconds] = useState(secondsLeft);
  const finalMinutes = secondsLeft !== null && secondsLeft <= 300 && (initialSeconds ?? 0) > 300;
  useEffect(() => {
    if (finalMinutes && secondsLeft! > 0 && !alerted.current) {
      alerted.current = true;
      setAlert(true);
      const t = setTimeout(() => setAlert(false), 6000);
      return () => clearTimeout(t);
    }
  }, [finalMinutes, secondsLeft]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const showTimer = secondsLeft !== null && (!timerHidden || finalMinutes);

  return (
    <div className="relative z-30 bg-white">
      <header className="bb-header">
        <div className="min-w-0">
          <h1 className="bb-title truncate">{title}</h1>
          <button className="bb-link-button" onClick={() => setDirectionsOpen(o => !o)} aria-expanded={directionsOpen}>
            Directions {directionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className="relative flex flex-col items-center gap-1 px-4">
          {secondsLeft === null ? (
            <span className="text-sm font-semibold text-[var(--bb-muted)]">{untimedLabel}</span>
          ) : showTimer ? (
            <>
              <span className={`bb-timer ${finalMinutes ? 'bb-timer-warning' : ''}`} role="timer" aria-live={finalMinutes ? 'polite' : 'off'}>
                {formatClock(secondsLeft)}
              </span>
              {!finalMinutes && <button className="bb-pill" onClick={() => setTimerHidden(true)}>Hide</button>}
            </>
          ) : (
            <button className="bb-pill mt-1" onClick={() => setTimerHidden(false)} aria-label="Show timer">
              <Clock size={13} /> Show
            </button>
          )}
          {alert && <div className="bb-toast" role="status">5 minutes remaining in this module</div>}
        </div>

        <div className="bb-tools">
          {tools.annotate && (
            <div className="relative">
              <button className="bb-tool" aria-pressed={tools.annotate.active} onClick={tools.annotate.onClick}>
                <AnnotateIcon /> Highlights &amp; Notes
              </button>
              {tools.annotate.hint && <div className="bb-toast" style={{ left: 'auto', right: 0, transform: 'none' }}>{tools.annotate.hint}</div>}
            </div>
          )}
          {tools.draw && (
            <button className="bb-tool" aria-pressed={tools.draw.active} onClick={tools.draw.onClick} title="Vẽ ghi chú / Freehand Drawing">
              <PenIcon /> Draw
            </button>
          )}
          {isMath && tools.calculator && (
            <button className="bb-tool" aria-pressed={tools.calculator.active} onClick={tools.calculator.onClick}>
              <CalculatorIcon /> Calculator
            </button>
          )}
          {isMath && tools.reference && (
            <button className="bb-tool" aria-pressed={tools.reference.active} onClick={tools.reference.onClick}>
              <ReferenceIcon /> Reference
            </button>
          )}
          <div className="relative" ref={menuRef}>
            <button className="bb-tool" aria-pressed={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen(o => !o)}>
              <MoreIcon /> More
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 top-[calc(100%+6px)] w-56 bg-white rounded-lg shadow-[0_4px_20px_rgb(0_0_0/0.25)] py-2 z-40">
                {menu.map(item => (
                  <button key={item.label} role="menuitem" className="w-full flex items-center justify-between px-4 py-2.5 text-[15px] text-left hover:bg-[var(--bb-bar)]"
                    onClick={() => { setMenuOpen(false); item.onClick(); }}>
                    {item.label}
                    {item.checked !== undefined && <span className={`text-xs font-bold ${item.checked ? 'text-[var(--bb-blue)]' : 'text-[var(--bb-muted)]'}`}>{item.checked ? 'ON' : 'OFF'}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="bb-dash" />

      {directionsOpen && (
        <div className="absolute left-0 right-0 top-full z-30 bg-white shadow-[0_8px_16px_rgb(0_0_0/0.18)] max-h-[70vh] overflow-y-auto">
          <div className="max-w-4xl mx-auto px-10 py-8 text-[16px] leading-relaxed" style={{ fontFamily: 'var(--bb-serif)' }}>
            <SectionDirections math={isMath} />
            <div className="flex justify-end mt-6" style={{ fontFamily: 'var(--bb-sans)' }}>
              <button className="bb-primary" onClick={() => setDirectionsOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
