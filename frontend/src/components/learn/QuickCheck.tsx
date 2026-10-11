'use client';

import React, { useState } from 'react';
import { Check, X as XIcon } from 'lucide-react';
import { Inline } from './Inline';

// Câu hỏi nhanh trong bài (ví dụ tự soạn): chọn → Check → hiện đúng/sai + giải thích
export default function QuickCheck({ n, prompt, options, answer, explanation, onResult }: {
  n: number; prompt: string; options: string[]; answer: number; explanation: string;
  onResult: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = picked === answer;

  const check = () => {
    if (picked === null) return;
    setChecked(true);
    onResult(picked === answer);
  };

  return (
    <div className="lr-check">
      <div className="text-xs font-bold uppercase tracking-wider text-[var(--bb-blue)] mb-2">Quick check {n}</div>
      <p className="lr-serif mb-4"><Inline text={prompt} /></p>
      <div className="space-y-2.5" role="radiogroup" aria-label={`Quick check ${n}`}>
        {options.map((option, i) => {
          const state = checked
            ? i === answer ? 'is-correct' : i === picked ? 'is-wrong' : ''
            : i === picked ? 'is-selected' : '';
          return (
            <button key={i} type="button" role="radio" aria-checked={picked === i} disabled={checked}
              className={`bb-choice w-full ${state}`} onClick={() => setPicked(i)}>
              <span className="bb-letter">{'ABCDEF'[i]}</span>
              <span className="flex-1"><Inline text={option} /></span>
            </button>
          );
        })}
      </div>
      {!checked ? (
        <div className="flex justify-end mt-4">
          <button type="button" className="bb-primary" disabled={picked === null} onClick={check}>Check</button>
        </div>
      ) : (
        <div className={`mt-4 rounded-lg px-4 py-3 text-[15px] leading-relaxed ${correct ? 'bg-[var(--bb-correct-soft)]' : 'bg-[var(--bb-wrong-soft)]'}`} role="status">
          <div className={`flex items-center gap-2 font-bold mb-1 ${correct ? 'text-[var(--bb-correct)]' : 'text-[var(--bb-wrong)]'}`}>
            {correct ? <Check size={18} /> : <XIcon size={18} />}
            {correct ? 'Correct' : `Not quite. The answer is ${'ABCDEF'[answer]}.`}
          </div>
          <Inline text={explanation} />
          <div className="mt-2">
            <button type="button" className="text-sm font-semibold text-[var(--bb-blue)] hover:underline"
              onClick={() => { setChecked(false); setPicked(null); }}>
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
