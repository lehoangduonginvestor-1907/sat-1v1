'use client';

import React from 'react';
import type { Answers } from '@/lib/types';
import { FlagIcon, PinIcon } from './icons';

interface Props {
  count: number;
  current?: number;
  answers: Answers;
  marked: Record<number, boolean>;
  correct?: boolean[]; // chế độ xem lại: tô xanh/đỏ
  onSelect: (index: number) => void;
}

export function Legend({ review, showCurrent = true }: { review?: boolean; showCurrent?: boolean }) {
  return (
    <div className="bb-legend">
      {showCurrent && <span className="flex items-center gap-2"><PinIcon size={16} /> Current</span>}
      {review ? (
        <>
          <span className="flex items-center gap-2"><span className="inline-block w-4 h-4 bg-[var(--bb-correct)]" /> Correct</span>
          <span className="flex items-center gap-2"><span className="inline-block w-4 h-4 bg-[var(--bb-wrong)]" /> Incorrect</span>
        </>
      ) : (
        <span className="flex items-center gap-2"><span className="inline-block w-4 h-4 border-[1.5px] border-dashed border-[#3a3a3a]" /> Unanswered</span>
      )}
      <span className="flex items-center gap-2"><FlagIcon size={15} className="text-[var(--bb-red)]" /> For Review</span>
    </div>
  );
}

export default function QuestionGrid({ count, current, answers, marked, correct, onSelect }: Props) {
  return (
    <div className="bb-grid">
      {Array.from({ length: count }, (_, i) => {
        const state = correct ? (correct[i] ? 'is-correct' : 'is-wrong') : answers[i] ? 'is-answered' : '';
        return (
          <button key={i} className={`bb-cell ${state}`} onClick={() => onSelect(i)}
            aria-label={`Question ${i + 1}${answers[i] ? ', answered' : ', unanswered'}${marked[i] ? ', marked for review' : ''}`}>
            {current === i && <PinIcon size={18} className="bb-cell-pin" />}
            {i + 1}
            {marked[i] && <FlagIcon size={14} className="bb-cell-flag" />}
          </button>
        );
      })}
    </div>
  );
}
