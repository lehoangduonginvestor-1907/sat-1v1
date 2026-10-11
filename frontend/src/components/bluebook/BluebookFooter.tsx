'use client';

import React, { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { Answers } from '@/lib/types';
import QuestionGrid, { Legend } from './QuestionGrid';

interface Props {
  studentName: string;
  title: string;
  index: number;
  total: number;
  onReviewPage: boolean;
  answers: Answers;
  marked: Record<number, boolean>;
  correct?: boolean[];
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  onGoTo: (index: number) => void;
  onGoToReview: () => void;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export default function BluebookFooter(p: Props) {
  const popRef = useRef<HTMLDivElement>(null);
  const { navOpen, setNavOpen } = p;

  useEffect(() => {
    if (!navOpen) return;
    const close = (e: MouseEvent) => !popRef.current?.contains(e.target as Node) && setNavOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false);
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [navOpen, setNavOpen]);

  const showBack = p.onReviewPage || p.index > 0;

  return (
    <div className="relative z-20 bg-white">
      <div className="bb-dash" />
      <footer className="bb-footer">
        <div className="font-semibold text-[15px] truncate">{p.studentName}</div>

        <div className="relative" ref={popRef}>
          {!p.onReviewPage && (
            <button className="bb-qbutton" onClick={() => p.setNavOpen(!p.navOpen)} aria-expanded={p.navOpen}>
              Question {p.index + 1} of {p.total} {p.navOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          )}
          {p.navOpen && (
            <div className="bb-popover" role="dialog" aria-label="Question navigation">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="flex-1 text-center text-[19px] font-bold leading-snug">{p.title} Questions</h2>
                <button onClick={() => p.setNavOpen(false)} aria-label="Close"><X size={22} /></button>
              </div>
              <Legend review={Boolean(p.correct)} />
              <QuestionGrid count={p.total} current={p.index} answers={p.answers} marked={p.marked} correct={p.correct}
                onSelect={i => { p.onGoTo(i); p.setNavOpen(false); }} />
              <div className="flex justify-center">
                <button className="bb-secondary" onClick={() => { p.onGoToReview(); p.setNavOpen(false); }}>Go to Review Page</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          {showBack && <button className="bb-primary" onClick={p.onBack}>Back</button>}
          <button className="bb-primary" onClick={p.onNext} disabled={p.nextDisabled}>{p.nextLabel || 'Next'}</button>
        </div>
      </footer>
    </div>
  );
}
