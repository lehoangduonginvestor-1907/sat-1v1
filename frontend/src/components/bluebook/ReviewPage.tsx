'use client';

import React from 'react';
import type { Answers } from '@/lib/types';
import QuestionGrid, { Legend } from './QuestionGrid';

interface Props {
  title: string;
  total: number;
  answers: Answers;
  marked: Record<number, boolean>;
  correct?: boolean[];
  note?: React.ReactNode;
  onGoTo: (index: number) => void;
}

// Trang "Check Your Work" ở cuối module
export default function ReviewPage({ title, total, answers, marked, correct, note, onGoTo }: Props) {
  const unanswered = Array.from({ length: total }, (_, i) => i).filter(i => !answers[i]).length;
  return (
    <div className="bb-main overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-[32px] font-bold text-center mb-4">Check Your Work</h1>
        <div className="text-center text-[16px] leading-relaxed mb-8 text-[var(--bb-ink)]">
          {note ?? (
            <p>
              On test day, you won&apos;t be able to move on until time runs out. Here you can select <strong>Next</strong> when
              you&apos;re ready to submit.
              {unanswered > 0 && <> You have <strong>{unanswered}</strong> unanswered {unanswered === 1 ? 'question' : 'questions'}.</>}
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_16px_rgb(0_0_0/0.18)] px-8 pt-6 pb-4">
          <h2 className="text-[20px] font-bold mb-4">{title} Questions</h2>
          <Legend review={Boolean(correct)} showCurrent={false} />
          <QuestionGrid count={total} answers={answers} marked={marked} correct={correct} onSelect={onGoTo} />
        </div>
      </div>
    </div>
  );
}
