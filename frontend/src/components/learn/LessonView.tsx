'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookMarked, Check, CheckCircle2, Circle, Clock, Lightbulb, ListOrdered, TriangleAlert, X as XIcon } from 'lucide-react';
import type { Block, BoxKind } from '@/lib/learnParse';
import { allLessons, findLesson, lessonKey, LessonMeta } from '@/lib/learn';
import { LessonProgress, updateLesson, useLearnProgress } from '@/lib/storage';
import { Inline } from './Inline';
import QuickCheck from './QuickCheck';

const BOX: Record<BoxKind, { label: string; icon: React.ReactNode }> = {
  rule: { label: 'Rule', icon: <BookMarked size={17} /> },
  tip: { label: 'Tip', icon: <Lightbulb size={17} /> },
  trap: { label: 'Watch out', icon: <TriangleAlert size={17} /> },
  note: { label: 'Note', icon: <BookMarked size={17} /> },
  steps: { label: 'Method', icon: <ListOrdered size={17} /> },
};

function Blocks({ blocks, onCheck }: { blocks: Block[]; onCheck: (n: number, correct: boolean) => void }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'h2': return <h2 key={i} id={b.id} className="lr-h2"><Inline text={b.text} /></h2>;
          case 'h3': return <h3 key={i} id={b.id} className="lr-h3"><Inline text={b.text} /></h3>;
          case 'p': return <p key={i} className="lr-p"><Inline text={b.text} /></p>;
          case 'math': return <div key={i} className="lr-display-math" dangerouslySetInnerHTML={{ __html: b.html }} />;
          case 'ul': return <ul key={i} className="lr-list list-disc">{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ul>;
          case 'ol': return <ol key={i} className="lr-list list-decimal">{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ol>;
          case 'table':
            return (
              <div key={i} className="lr-table-wrap">
                <table className="lr-table">
                  <thead><tr>{b.head.map((h, j) => <th key={j}><Inline text={h} /></th>)}</tr></thead>
                  <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}><Inline text={c} /></td>)}</tr>)}</tbody>
                </table>
              </div>
            );
          case 'box':
            return (
              <aside key={i} className={`lr-box lr-box-${b.kind}`}>
                <div className="lr-box-title">{BOX[b.kind].icon}<span>{b.title || BOX[b.kind].label}</span></div>
                <Blocks blocks={b.blocks} onCheck={onCheck} />
              </aside>
            );
          case 'examples':
            return (
              <ul key={i} className="lr-examples">
                {b.items.map((ex, j) => (
                  <li key={j} className={ex.ok ? 'is-ok' : 'is-bad'}>
                    <span className="lr-ex-icon" aria-label={ex.ok ? 'Correct' : 'Incorrect'}>{ex.ok ? <Check size={15} strokeWidth={3} /> : <XIcon size={15} strokeWidth={3} />}</span>
                    <div>
                      <div className="lr-serif"><Inline text={ex.text} /></div>
                      {ex.note && <div className="lr-ex-note"><Inline text={ex.note} /></div>}
                    </div>
                  </li>
                ))}
              </ul>
            );
          case 'check':
            return <QuickCheck key={i} n={b.n} prompt={b.prompt} options={b.options} answer={b.answer} explanation={b.explanation} onResult={c => onCheck(b.n, c)} />;
        }
      })}
    </>
  );
}

export function StatusIcon({ progress, size = 18 }: { progress?: LessonProgress; size?: number }) {
  if (progress?.done) return <CheckCircle2 size={size} className="text-[var(--bb-correct)] shrink-0" aria-label="Completed" />;
  const started = progress && (Object.keys(progress.checks || {}).length || progress.practice?.length);
  return <Circle size={size} className={`shrink-0 ${started ? 'text-[var(--bb-blue)]' : 'text-[#b8b8b8]'}`} aria-label={started ? 'In progress' : 'Not started'} />;
}

function PracticeCard({ courseSlug, lesson, progress }: { courseSlug: string; lesson: LessonMeta; progress?: LessonProgress }) {
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [bluebook, setBluebook] = useState(false);
  const practice = lesson.practice;
  if (!practice) return null;
  const last = progress?.practice?.[progress.practice.length - 1];
  const start = () => {
    const q = new URLSearchParams({ lesson: lessonKey(courseSlug, lesson.slug), count: String(count) });
    if (bluebook) q.set('bluebook', '1');
    router.push(`/practice?${q}`);
  };
  return (
    <section className="lr-practice" aria-labelledby="practice-title">
      <h2 id="practice-title" className="text-xl font-bold mb-1">Practice with official questions</h2>
      <p className="text-[15px] text-[var(--bb-muted)] mb-4">
        You&apos;ll get {practice.label} from the College Board question bank, easiest first. Check each answer as you go and read the official explanation.
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-bold">Questions</span>
          <div className="inline-flex rounded-full border-[1.5px] border-[var(--bb-blue)] overflow-hidden" role="group" aria-label="Number of questions">
            {[5, 10, 15].map(n => (
              <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)}
                className={`px-4 py-1.5 text-[14px] font-bold ${count === n ? 'bg-[var(--bb-blue)] text-white' : 'text-[var(--bb-blue)] hover:bg-[var(--bb-blue-soft)]'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={bluebook} onChange={e => setBluebook(e.target.checked)} />
          Include Bluebook practice test questions (SAT &amp; PSAT)
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[14px] text-[var(--bb-muted)]">
          {last ? `Last practice: ${last.correct}/${last.total} correct (${Math.round((last.correct / last.total) * 100)}%)` : 'Not practiced yet'}
        </span>
        <button type="button" className="bb-primary" onClick={start}>Start Practice</button>
      </div>
    </section>
  );
}

export default function LessonView({ courseSlug, lessonSlug, blocks }: { courseSlug: string; lessonSlug: string; blocks: Block[] }) {
  const found = findLesson(courseSlug, lessonSlug)!;
  const { course, lesson, prev, next, number } = found;
  const progressAll = useLearnProgress();
  const key = lessonKey(courseSlug, lessonSlug);
  const progress = progressAll?.[key];
  const lessons = allLessons(course);
  const doneCount = lessons.filter(l => progressAll?.[lessonKey(courseSlug, l.slug)]?.done).length;

  const onCheck = (n: number, correct: boolean) => {
    // Chỉ ghi kết quả lần trả lời đầu tiên của mỗi câu hỏi nhanh
    updateLesson(key, p => (p.checks && n in p.checks ? p : { ...p, checks: { ...(p.checks || {}), [n]: correct } }));
  };
  const setDone = (done: boolean) => updateLesson(key, p => ({ ...p, done }));

  return (
    <div className="min-h-dvh bg-[#f7f7f7]">
      <header className="bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/learn" className="flex items-center gap-1 font-semibold hover:underline shrink-0"><ArrowLeft size={18} /> Learn</Link>
          <span className="text-lg font-bold truncate">{course.title}</span>
          <span className="ml-auto text-sm text-[var(--bb-muted)] shrink-0 hidden sm:block">{doneCount}/{lessons.length} complete</span>
        </div>
        <div className="bb-dash" />
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[270px_minmax(0,1fr)] gap-8">
        <nav className="hidden lg:block" aria-label="Lessons in this course">
          <div className="sticky top-24 space-y-5 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1">
            {course.units.map(unit => (
              <div key={unit.title}>
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--bb-muted)] mb-2">{unit.title}</div>
                <ul className="space-y-0.5">
                  {unit.lessons.map(l => {
                    const active = l.slug === lessonSlug;
                    return (
                      <li key={l.slug}>
                        <Link href={`/learn/${courseSlug}/${l.slug}`} aria-current={active ? 'page' : undefined}
                          className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-[14px] leading-snug ${active ? 'bg-[var(--bb-blue-soft)] font-bold text-[var(--bb-blue)]' : 'hover:bg-white'}`}>
                          <span className="mt-px"><StatusIcon progress={progressAll?.[lessonKey(courseSlug, l.slug)]} size={16} /></span>
                          {l.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <main className="min-w-0">
          <article className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] px-5 sm:px-10 py-8 sm:py-10">
            <div className="text-sm font-semibold text-[var(--bb-blue)] mb-2">Lesson {number} · {lesson.unit}</div>
            <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight mb-3">{lesson.title}</h1>
            <p className="text-[17px] text-[var(--bb-muted)] mb-4">{lesson.summary}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-[var(--bb-muted)] pb-6 mb-2 border-b border-[#e6e6e6]">
              <span className="flex items-center gap-1.5"><Clock size={14} /> {lesson.minutes} min</span>
              <span>Based on <em>{course.book}</em>, {lesson.chapter}, p. {lesson.pages}</span>
            </div>
            <div className="lr-body">
              <Blocks blocks={blocks} onCheck={onCheck} />
            </div>
          </article>

          <PracticeCard courseSlug={courseSlug} lesson={lesson} progress={progress} />

          <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
            {progress?.done ? (
              <button type="button" className="bb-secondary gap-2" onClick={() => setDone(false)}><CheckCircle2 size={18} /> Completed</button>
            ) : (
              <button type="button" className="bb-primary gap-2" onClick={() => setDone(true)}><Check size={18} /> Mark as Complete</button>
            )}
            <div className="flex gap-3 ml-auto">
              {prev && <Link href={`/learn/${courseSlug}/${prev.slug}`} className="bb-secondary gap-1"><ArrowLeft size={16} /> Previous</Link>}
              {next && (
                <Link href={`/learn/${courseSlug}/${next.slug}`} className="bb-primary gap-1" title={next.title}>
                  Next<span className="hidden sm:inline">: {next.title}</span> <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
