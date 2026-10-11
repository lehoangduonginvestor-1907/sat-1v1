'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Answers, Question } from '@/lib/types';
import type { Highlight, HighlightColor } from '@/lib/highlights';
import BluebookHeader from './BluebookHeader';
import BluebookFooter from './BluebookFooter';
import QuestionView, { QuestionResult } from './QuestionView';
import ReviewPage from './ReviewPage';
import CalculatorPanel from './CalculatorPanel';
import ReferenceSheet from './ReferenceSheet';
import LineReader from './LineReader';
import Modal from './Modal';
import { AnnotationEditor, SelectionMenu } from './Annotations';
import type { TextSelection } from './RichContent';

export interface TestShellProps {
  title: string;
  questions: Question[];
  answers: Answers;
  onAnswer?: (index: number, value: string) => void; // không có = chế độ xem lại
  endsAt?: number | null; // mốc hết giờ (giờ máy); null = không tính giờ
  onTimeUp?: () => void;
  onSubmit?: () => void; // "Next" ở trang Check Your Work
  submitConfirm?: string; // hỏi lại trước khi nộp
  onExit?: () => void;
  exitLabel?: string;
  exitConfirm?: string;
  studentName: string;
  results?: (QuestionResult | undefined)[]; // đáp án + đúng/sai theo từng câu (xem lại / kiểm tra từng câu)
  onCheck?: (index: number) => void;
  checkingIndex?: number | null;
  topBar?: React.ReactNode;
  reviewNote?: React.ReactNode;
  shareLinks?: boolean; // menu "Copy Question Link"
  onNavigate?: (index: number | null) => void; // câu đang xem (null = trang Check Your Work), để đo thời gian từng câu
}

type Pending = { key: string; selection: TextSelection };
type Editing = { key: string; id: string; isNew: boolean; text: string };

const newId = () => Math.random().toString(36).slice(2, 10);

export default function TestShell(p: TestShellProps) {
  const total = p.questions.length;
  const [index, setIndex] = useState(0);
  const [onReviewPage, setOnReviewPage] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [marked, setMarked] = useState<Record<number, boolean>>({});
  const [crossed, setCrossed] = useState<Record<number, string[]>>({});
  const [eliminatorOn, setEliminatorOn] = useState(false);
  const [leftPct, setLeftPct] = useState(50);
  const [calcOpen, setCalcOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [lineReader, setLineReader] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, Highlight[]>>({});
  const [pending, setPending] = useState<Pending | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [annotateHint, setAnnotateHint] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'submit' | 'exit' | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const timeUpFired = useRef(false);

  const question = p.questions[index];
  const isMath = (onReviewPage ? p.questions[total - 1] : question)?.section === 'Math';
  const hasMath = p.questions.some(q => q.section === 'Math');
  const reviewMode = !p.onAnswer;
  const correct = reviewMode && p.results?.length === total ? p.results.map(r => Boolean(r?.correct)) : undefined;

  // Tải trước hình và sprite công thức của cả module để chuyển câu không bị trống
  useEffect(() => {
    const urls = new Set<string>();
    for (const q of p.questions) {
      const html = q.stimulus + q.stem + q.options.join('');
      for (const m of html.matchAll(/(?:src="|url\()(\/media\/[^")]+)/g)) urls.add(m[1]);
    }
    urls.forEach(url => { new Image().src = url; });
  }, [p.questions]);

  // Đồng hồ
  useEffect(() => {
    if (!p.endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [p.endsAt]);
  const secondsLeft = p.endsAt ? Math.max(0, Math.ceil((p.endsAt - now) / 1000)) : null;
  const { onTimeUp } = p;
  useEffect(() => {
    if (secondsLeft === 0 && !timeUpFired.current) {
      timeUpFired.current = true;
      onTimeUp?.();
    }
  }, [secondsLeft, onTimeUp]);

  const { onNavigate } = p;
  useEffect(() => {
    onNavigate?.(onReviewPage ? null : index);
  }, [index, onReviewPage, onNavigate]);

  // Bỏ vùng chọn khi bấm ra ngoài
  useEffect(() => {
    if (!pending) return;
    const clear = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.bb-selection-menu, .bb-tool')) setPending(null);
    };
    window.addEventListener('mousedown', clear);
    return () => window.removeEventListener('mousedown', clear);
  }, [pending]);

  const goTo = useCallback((i: number) => {
    setOnReviewPage(false);
    setPending(null);
    setIndex(Math.min(Math.max(i, 0), total - 1));
  }, [total]);

  const next = () => {
    if (onReviewPage) {
      if (p.submitConfirm) setConfirm('submit');
      else p.onSubmit?.();
    } else if (index === total - 1) {
      setOnReviewPage(true);
    } else {
      goTo(index + 1);
    }
  };
  const back = () => (onReviewPage ? goTo(total - 1) : goTo(index - 1));

  const toggleCross = (letter: string) => {
    const list = crossed[index] || [];
    const isCrossed = list.includes(letter);
    setCrossed({ ...crossed, [index]: isCrossed ? list.filter(l => l !== letter) : [...list, letter] });
    // Loại đáp án đang chọn thì bỏ chọn
    if (!isCrossed && p.answers[index] === letter) p.onAnswer?.(index, '');
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

  const onAnnotateTool = () => {
    if (pending) return addHighlight('yellow', false, true);
    setAnnotateHint('Select the text you want to highlight or annotate first.');
    setTimeout(() => setAnnotateHint(null), 3000);
  };

  const editingHighlight = editing && (highlights[editing.key] || []).find(h => h.id === editing.id);
  const result = p.results?.[index];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/practice?ids=${question.id}`);
      setAnnotateHint('Link to this question copied.');
    } catch {
      setAnnotateHint(`Question ID: ${question.id}`);
    }
    setTimeout(() => setAnnotateHint(null), 3000);
  };

  const menu = [
    { label: 'Line Reader', checked: lineReader, onClick: () => setLineReader(v => !v) },
    { label: 'Clear Highlights', onClick: () => setHighlights({}) },
    ...(p.shareLinks && !onReviewPage ? [{ label: 'Copy Question Link', onClick: copyLink }] : []),
    ...(p.onExit ? [{ label: p.exitLabel || 'Exit', onClick: () => (p.exitConfirm ? setConfirm('exit') : p.onExit!()) }] : []),
  ];

  if (!question) return null;

  return (
    <div className="bb-shell">
      {p.topBar}
      <BluebookHeader
        title={p.title}
        isMath={isMath}
        secondsLeft={reviewMode ? null : secondsLeft}
        untimedLabel={reviewMode ? 'Answer Review' : 'Untimed'}
        tools={{
          annotate: { active: Boolean(pending || editing), onClick: onAnnotateTool, hint: annotateHint },
          calculator: { active: calcOpen, onClick: () => setCalcOpen(o => !o) },
          reference: { active: refOpen, onClick: () => setRefOpen(o => !o) },
        }}
        menu={menu}
      />

      <div className="relative flex-1 flex min-h-0 min-w-0">
        {onReviewPage ? (
          <ReviewPage title={p.title} total={total} answers={p.answers} marked={marked} correct={correct} note={p.reviewNote} onGoTo={goTo} />
        ) : (
          <QuestionView
            key={question.id}
            question={question}
            index={index}
            answer={p.answers[index]}
            onAnswer={p.onAnswer && !result ? v => p.onAnswer!(index, v) : undefined}
            marked={Boolean(marked[index])}
            onToggleMark={() => setMarked(m => ({ ...m, [index]: !m[index] }))}
            eliminatorOn={eliminatorOn}
            onToggleEliminator={() => setEliminatorOn(v => !v)}
            crossed={crossed[index] || []}
            onToggleCross={toggleCross}
            leftPct={leftPct}
            onLeftPctChange={setLeftPct}
            highlights={highlights}
            onSelectText={(key, selection) => setPending(selection ? { key, selection } : null)}
            onHighlightClick={(key, id) => {
              const h = (highlights[key] || []).find(x => x.id === id);
              const el = document.querySelector(`mark[data-hid="${id}"]`);
              if (h) setEditing({ key, id, isNew: false, text: el?.textContent || '' });
            }}
            result={result}
            onCheck={p.onCheck ? () => p.onCheck!(index) : undefined}
            checking={p.checkingIndex === index}
          />
        )}
        {lineReader && !onReviewPage && <LineReader />}
      </div>

      <BluebookFooter
        studentName={p.studentName}
        title={p.title}
        index={index}
        total={total}
        onReviewPage={onReviewPage}
        answers={p.answers}
        marked={marked}
        correct={correct}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        onGoTo={goTo}
        onGoToReview={() => setOnReviewPage(true)}
        onBack={back}
        onNext={next}
        nextDisabled={onReviewPage && !p.onSubmit}
      />

      {hasMath && <CalculatorPanel open={calcOpen} onClose={() => setCalcOpen(false)} />}
      <ReferenceSheet open={refOpen} onClose={() => setRefOpen(false)} />

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

      {confirm === 'submit' && (
        <Modal title="Submit your answers?" confirmLabel="Submit" onConfirm={() => { setConfirm(null); p.onSubmit?.(); }} onCancel={() => setConfirm(null)}>
          {p.submitConfirm}
        </Modal>
      )}
      {confirm === 'exit' && (
        <Modal title={p.exitLabel || 'Exit'} confirmLabel={p.exitLabel || 'Exit'} onConfirm={() => { setConfirm(null); p.onExit?.(); }} onCancel={() => setConfirm(null)}>
          {p.exitConfirm}
        </Modal>
      )}
    </div>
  );
}
