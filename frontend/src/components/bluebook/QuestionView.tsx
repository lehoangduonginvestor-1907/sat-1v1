'use client';

import React, { useRef, useState } from 'react';
import type { AnswerKey, Question } from '@/lib/types';
import { correctAnswerText } from '@/lib/types';
import type { Highlight } from '@/lib/highlights';
import RichContent, { TextSelection } from './RichContent';
import { SprDirections } from './Directions';
import { BookmarkIcon, ExpandIcon, StrikeAbcIcon } from './icons';

export interface QuestionResult {
  key: AnswerKey;
  correct: boolean;
}

interface Props {
  question: Question;
  index: number;
  answer?: string;
  onAnswer?: (value: string) => void; // không có = chỉ xem (đã nộp / đã kiểm tra)
  marked: boolean;
  onToggleMark: () => void;
  eliminatorOn: boolean;
  onToggleEliminator: () => void;
  crossed: string[];
  onToggleCross: (letter: string) => void;
  leftPct: number;
  onLeftPctChange: (pct: number) => void;
  highlights: Record<string, Highlight[]>;
  onSelectText: (key: string, selection: TextSelection | null) => void;
  onHighlightClick: (key: string, id: string) => void;
  result?: QuestionResult;
  onCheck?: () => void; // luyện tập: kiểm tra từng câu
  checking?: boolean;
}

// Giống Bluebook: tối đa 5 ký tự (6 nếu là số âm), chỉ gồm số, dấu chấm, dấu gạch phân số và dấu trừ
export function isValidSprInput(value: string) {
  return /^-?[0-9./]*$/.test(value) && value.length <= (value.startsWith('-') ? 6 : 5);
}

function AnswerPreview({ value }: { value: string }) {
  const [num, den] = value.split('/');
  return (
    <div className="mt-4 flex items-center gap-3 text-[15px]">
      <span className="font-semibold">Answer Preview:</span>
      {den !== undefined ? (
        <span className="inline-flex flex-col items-center leading-tight font-serif text-lg">
          <span className="border-b border-[var(--bb-ink)] px-1">{num}</span>
          <span className="px-1">{den}</span>
        </span>
      ) : (
        <span className="font-serif text-lg">{value}</span>
      )}
    </div>
  );
}

function Explanation({ result, answer }: { result: QuestionResult; answer?: string }) {
  return (
    <div className="mt-8 border-t border-[var(--bb-line)] pt-5">
      <div className="flex flex-wrap gap-x-8 gap-y-1 text-[15px] mb-4">
        <span>
          <span className="font-bold">Correct Answer: </span>
          <span className="text-[var(--bb-correct)] font-bold">{correctAnswerText(result.key)}</span>
        </span>
        <span>
          <span className="font-bold">Your Answer: </span>
          <span className={result.correct ? 'text-[var(--bb-correct)] font-bold' : 'text-[var(--bb-wrong)] font-bold'}>
            {answer || 'Omitted'}
          </span>
        </span>
      </div>
      <h3 className="font-bold mb-2">Explanation</h3>
      <RichContent html={result.key.rationale} className="text-[15px]" />
    </div>
  );
}

export default function QuestionView(props: Props) {
  const { question, index, answer, onAnswer, marked, eliminatorOn, crossed, result, leftPct } = props;
  const mainRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const isMath = question.section === 'Math';
  const isSpr = question.type === 'spr';
  const twoPane = !isMath || isSpr;
  const locked = !onAnswer;

  const highlightable = (part: 'stimulus' | 'stem', html: string, className = '') => {
    const key = `${question.id}:${part}`;
    return (
      <RichContent html={html} className={className} highlights={props.highlights[key]}
        onSelectText={sel => props.onSelectText(key, sel)} onHighlightClick={id => props.onHighlightClick(key, id)} />
    );
  };

  const onDividerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDividerMove = (e: React.PointerEvent) => {
    if (!dragging || !mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    props.onLeftPctChange(Math.min(Math.max(pct, 25), 75));
  };

  const choice = (html: string, i: number) => {
    const letter = 'ABCD'[i];
    const selected = answer === letter;
    const isCrossed = crossed.includes(letter);
    const state = result
      ? i === result.key.correctAnswer ? 'is-correct' : selected ? 'is-wrong' : ''
      : selected ? 'is-selected' : isCrossed ? 'is-crossed' : '';
    return (
      <div key={letter} className="bb-choice-row">
        <button
          className={`bb-choice ${state}`}
          disabled={locked}
          aria-pressed={selected}
          onClick={() => {
            if (isCrossed) props.onToggleCross(letter);
            onAnswer?.(letter);
          }}
        >
          <span className="bb-letter">{letter}</span>
          <RichContent html={html} inline className="flex-1" />
        </button>
        {eliminatorOn && !locked && (
          isCrossed
            ? <button className="bb-undo" onClick={() => props.onToggleCross(letter)}>Undo</button>
            : <button className="bb-strike-btn" onClick={() => props.onToggleCross(letter)} aria-label={`Cross out answer choice ${letter}`}>{letter}</button>
        )}
      </div>
    );
  };

  const questionPane = (
    <div className={twoPane ? 'bb-pane-inner' : 'bb-pane-inner mx-auto w-full max-w-[720px]'}>
      <div className="bb-qbar">
        <span className="bb-qnum">{index + 1}</span>
        <button className={`bb-mark ${marked ? 'is-marked' : ''}`} onClick={props.onToggleMark} aria-pressed={marked}>
          <BookmarkIcon filled={marked} /> Mark for Review
        </button>
        {!isSpr && !locked && (
          <button className={`bb-abc ${eliminatorOn ? 'is-on' : ''}`} onClick={props.onToggleEliminator}
            aria-pressed={eliminatorOn} title="Cross out answer choices you think are wrong.">
            <StrikeAbcIcon />
          </button>
        )}
      </div>
      <div className="bb-dash mb-5" />

      {(isMath && question.stimulus) && <div className="mb-4">{highlightable('stimulus', question.stimulus)}</div>}
      <div className="mb-6">{highlightable('stem', question.stem)}</div>

      {isSpr ? (
        <div>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            aria-label="Your answer"
            value={answer || ''}
            disabled={locked}
            onChange={e => isValidSprInput(e.target.value) && onAnswer?.(e.target.value)}
            className={`w-48 h-12 px-3 text-xl font-serif rounded-lg outline-none border-[1.5px] bg-white
              ${result ? (result.correct ? 'border-[var(--bb-correct)] bg-[var(--bb-correct-soft)]' : 'border-[var(--bb-wrong)] bg-[var(--bb-wrong-soft)]')
                : 'border-[#5f5f5f] focus:border-[var(--bb-blue)] focus:shadow-[0_0_0_1px_var(--bb-blue)]'}`}
          />
          <AnswerPreview value={answer || ''} />
        </div>
      ) : (
        <div className="space-y-4">{question.options.map(choice)}</div>
      )}

      {props.onCheck && !result && (
        <div className="mt-6">
          <button className="bb-secondary" onClick={props.onCheck} disabled={!answer || props.checking}>
            {props.checking ? 'Checking…' : 'Check Answer'}
          </button>
        </div>
      )}
      {result && <Explanation result={result} answer={answer} />}
    </div>
  );

  if (!twoPane) {
    return <div className="bb-main"><div className="bb-pane flex-1">{questionPane}</div></div>;
  }

  const expandLeft = () => props.onLeftPctChange(leftPct > 55 ? 50 : 68);
  const expandRight = () => props.onLeftPctChange(leftPct < 45 ? 50 : 32);

  return (
    <div className="bb-main bb-split" ref={mainRef}>
      {/* Nút mở rộng nằm ngoài vùng cuộn để luôn ở trên cùng như Bluebook */}
      <div className="bb-split-left relative min-w-0 flex" style={{ width: `${leftPct}%` }}>
        <button className="bb-expand" style={{ right: 12 }} onClick={expandLeft} aria-label="Expand passage pane"><ExpandIcon /></button>
        <div className="bb-pane flex-1">
          <div className="bb-pane-inner pt-14">
            {isSpr ? <SprDirections /> : highlightable('stimulus', question.stimulus)}
          </div>
        </div>
      </div>
      <div className={`bb-divider ${dragging ? 'is-dragging' : ''}`} onPointerDown={onDividerDown} onPointerMove={onDividerMove}
        onPointerUp={() => setDragging(false)} role="separator" aria-orientation="vertical" />
      <div className="bb-split-right relative min-w-0 flex flex-1">
        <button className="bb-expand" style={{ left: 12 }} onClick={expandRight} aria-label="Expand question pane"><ExpandIcon flip /></button>
        <div className="bb-pane flex-1">
          <div className="pt-6">{questionPane}</div>
        </div>
      </div>
    </div>
  );
}
