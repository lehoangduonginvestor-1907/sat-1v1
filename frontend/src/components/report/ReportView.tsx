'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronDown, Download, FileSpreadsheet, Minus, Printer, X as XIcon } from 'lucide-react';
import RichContent from '@/components/bluebook/RichContent';
import { correctAnswerText } from '@/lib/types';
import { allLessons, COURSES } from '@/lib/learn';
import {
  downloadReportCsv, downloadReportHtml, formatDate, formatDuration, Outcome, pct, PracticeReport, printReport,
  ReportItem, reportStats, Tally,
} from '@/lib/report';

const card = 'bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)]';

// Bài học dạy skill này (ưu tiên bài chung, không giới hạn chủ đề)
function lessonFor(skill: string) {
  const matches = COURSES.flatMap(c => allLessons(c).filter(l => l.practice?.skills.includes(skill)).map(l => ({ course: c, lesson: l })));
  const best = matches.find(m => !m.lesson.practice?.topics) || matches[0];
  return best ? { href: `/learn/${best.course.slug}/${best.lesson.slug}`, title: best.lesson.title } : null;
}

function StackedBar({ t }: { t: Tally }) {
  const w = (n: number) => `${(n / Math.max(t.total, 1)) * 100}%`;
  return (
    <div className="h-2.5 rounded-full bg-[#e6e6e6] overflow-hidden flex" role="img"
      aria-label={`${t.correct} correct, ${t.incorrect} incorrect, ${t.omitted} omitted`}>
      <div className="h-full bg-[var(--bb-correct)]" style={{ width: w(t.correct) }} />
      <div className="h-full bg-[var(--bb-wrong)]" style={{ width: w(t.incorrect) }} />
      <div className="h-full bg-[#9a9a9a]" style={{ width: w(t.omitted) }} />
    </div>
  );
}

function TallyRow({ name, t, strong }: { name: string; t: Tally; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_56px_44px] gap-3 items-center">
      <div className="min-w-0">
        <div className={`text-[14px] mb-1 truncate ${strong ? 'font-bold text-[15px]' : ''}`} title={name}>{name}</div>
        <StackedBar t={t} />
      </div>
      <span className="text-right text-[14px] tabular-nums">{t.correct}/{t.total}</span>
      <span className={`text-right text-[14px] tabular-nums font-semibold ${pct(t) >= 80 ? 'text-[var(--bb-correct)]' : pct(t) < 50 ? 'text-[var(--bb-wrong)]' : ''}`}>{pct(t)}%</span>
    </div>
  );
}

const OUTCOME: Record<Outcome, { label: string; className: string; icon: React.ReactNode }> = {
  correct: { label: 'Correct', className: 'bg-[var(--bb-correct-soft)] text-[var(--bb-correct)]', icon: <Check size={16} /> },
  incorrect: { label: 'Incorrect', className: 'bg-[var(--bb-wrong-soft)] text-[var(--bb-wrong)]', icon: <XIcon size={16} /> },
  omitted: { label: 'Omitted', className: 'bg-[#eee] text-[var(--bb-muted)]', icon: <Minus size={16} /> },
};

function Tag({ outcome }: { outcome: Outcome }) {
  const o = OUTCOME[outcome];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold ${o.className}`}>{o.icon}{o.label}</span>;
}

function QuestionDetail({ item }: { item: ReportItem }) {
  const q = item.question;
  const key = item.result;
  return (
    <div className="px-4 sm:px-6 pb-6 pt-4 border-t border-[#ececec] bg-[#fcfcfc]">
      {q.stimulus && <RichContent html={q.stimulus} className="mb-4" />}
      <RichContent html={q.stem} className="mb-5" />
      {q.type === 'mcq' && (
        <div className="space-y-3 mb-5">
          {q.options.map((o, i) => {
            const letter = 'ABCD'[i];
            const state = key?.type === 'mcq' && i === key.correctAnswer ? 'is-correct' : item.answer === letter ? 'is-wrong' : '';
            return (
              <div key={letter} className={`bb-choice ${state}`}>
                <span className="bb-letter">{letter}</span>
                <RichContent html={o} inline className="flex-1" />
              </div>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-x-8 gap-y-1 text-[15px] mb-4">
        <span><span className="font-bold">Correct Answer: </span><span className="text-[var(--bb-correct)] font-bold">{key ? correctAnswerText(key) : '—'}</span></span>
        <span>
          <span className="font-bold">Your Answer: </span>
          <span className={`font-bold ${item.outcome === 'correct' ? 'text-[var(--bb-correct)]' : 'text-[var(--bb-wrong)]'}`}>{item.answer || 'Omitted'}</span>
        </span>
        {item.seconds > 0 && <span><span className="font-bold">Time: </span>{formatDuration(item.seconds)}</span>}
      </div>
      {key?.rationale && (
        <div className="rounded-lg bg-white border border-[#e3e3e3] p-4">
          <h4 className="font-bold mb-2">Explanation</h4>
          <RichContent html={key.rationale} className="text-[15px]" />
        </div>
      )}
    </div>
  );
}

function ExportMenu({ report }: { report: PracticeReport }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (label: string, fn: () => unknown) => {
    setOpen(false);
    setBusy(label);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };
  const item = 'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--bb-blue-soft)]';
  return (
    <div className="relative">
      <button className="bb-primary gap-2" onClick={() => setOpen(o => !o)} aria-expanded={open} disabled={Boolean(busy)}>
        <Download size={17} /> {busy ? `${busy}…` : 'Export Report'} <ChevronDown size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-20 w-72 bg-white rounded-xl shadow-[0_6px_24px_rgb(0_0_0/0.2)] overflow-hidden py-1" role="menu">
            <button className={item} role="menuitem" onClick={() => run('Preparing', () => downloadReportHtml(report))}>
              <Download size={18} className="mt-0.5 text-[var(--bb-blue)]" />
              <span><span className="font-bold block">Download (HTML)</span><span className="text-[13px] text-[var(--bb-muted)]">Full report with questions and explanations. Opens offline in any browser.</span></span>
            </button>
            <button className={item} role="menuitem" onClick={() => run('Preparing', () => printReport(report))}>
              <Printer size={18} className="mt-0.5 text-[var(--bb-blue)]" />
              <span><span className="font-bold block">Print / Save as PDF</span><span className="text-[13px] text-[var(--bb-muted)]">Choose “Save as PDF” as the printer.</span></span>
            </button>
            <button className={item} role="menuitem" onClick={() => run('Preparing', () => downloadReportCsv(report))}>
              <FileSpreadsheet size={18} className="mt-0.5 text-[var(--bb-blue)]" />
              <span><span className="font-bold block">Question list (CSV)</span><span className="text-[13px] text-[var(--bb-muted)]">For Excel or Google Sheets.</span></span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type Filter = 'all' | 'missed' | 'correct';

interface Props {
  report: PracticeReport;
  back: { href: string; label: string };
  onReview?: (module: number) => void; // xem lại trong giao diện Bluebook
  actions?: React.ReactNode;
}

export default function ReportView({ report, back, onReview, actions }: Props) {
  const stats = useMemo(() => reportStats(report), [report]);
  const o = stats.overall;
  const missedCount = o.incorrect + o.omitted;
  const keyOf = (it: ReportItem) => `${it.module}-${it.index}`;
  const [filter, setFilter] = useState<Filter>(missedCount ? 'missed' : 'all');
  // Mặc định mở sẵn câu sai / bỏ trống để xem lời giải ngay
  const [open, setOpen] = useState<Set<string>>(() => new Set(stats.items.filter(it => it.outcome !== 'correct').map(keyOf)));
  const toggle = (k: string) => setOpen(prev => {
    const next = new Set(prev);
    if (next.has(k)) next.delete(k); else next.add(k);
    return next;
  });

  const skills = stats.domains.flatMap(d => d.skills);
  const focus = skills.filter(s => s.tally.correct < s.tally.total)
    .sort((a, b) => pct(a.tally) - pct(b.tally) || (b.tally.total - b.tally.correct) - (a.tally.total - a.tally.correct)).slice(0, 3);
  const strengths = skills.filter(s => pct(s.tally) >= 80 && !focus.includes(s))
    .sort((a, b) => pct(b.tally) - pct(a.tally) || b.tally.total - a.tally.total).slice(0, 3);

  const numbered = stats.items.map((item, i) => ({ item, n: i + 1 }));
  const shown = numbered.filter(({ item }) => filter === 'all' || (filter === 'correct' ? item.outcome === 'correct' : item.outcome !== 'correct'));
  const allOpen = shown.length > 0 && shown.every(({ item }) => open.has(keyOf(item)));
  const multi = report.modules.length > 1;

  const filters: [Filter, string, number][] = [['missed', 'Incorrect & Omitted', missedCount], ['correct', 'Correct', o.correct], ['all', 'All', o.total]];

  return (
    <div className="min-h-dvh bg-[#f7f7f7]">
      <header className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href={back.href} className="flex items-center gap-1 font-semibold hover:underline"><ArrowLeft size={18} /> {back.label}</Link>
          <span className="text-xl font-bold">Practice Report</span>
        </div>
        <div className="bb-dash" />
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold leading-tight">{report.title}</h1>
            <p className="text-[var(--bb-muted)]">{formatDate(report.ts)}{report.adaptive && ` · ${report.adaptive}`}</p>
          </div>
          <ExportMenu report={report} />
        </div>

        {/* Thang điểm Digital SAT (200-800 hoặc 400-1600) */}
        {report.scaledScore && (
          <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white rounded-xl p-6 sm:p-7 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-blue-200">
                  Estimated Digital SAT Score
                </span>
                <div className="text-5xl sm:text-6xl font-black tracking-tight mt-1">
                  {report.scaledScore.total}{' '}
                  <span className="text-xl sm:text-2xl font-normal text-blue-200">
                    / {report.scaledScore.rw !== undefined && report.scaledScore.math !== undefined ? 1600 : 800}
                  </span>
                </div>
              </div>
              {report.scaledScore.rw !== undefined && report.scaledScore.math !== undefined && (
                <div className="flex items-center gap-6 sm:gap-8 border-t sm:border-t-0 sm:border-l border-blue-400/30 pt-4 sm:pt-0 sm:pl-8">
                  <div>
                    <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Reading & Writing</div>
                    <div className="text-3xl font-extrabold">{report.scaledScore.rw} <span className="text-sm text-blue-200 font-normal">/ 800</span></div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Math</div>
                    <div className="text-3xl font-extrabold">{report.scaledScore.math} <span className="text-sm text-blue-200 font-normal">/ 800</span></div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Điểm tổng */}
        <section className={`${card} p-6 sm:p-7 grid md:grid-cols-[200px_1fr] gap-6 sm:gap-8 items-center`}>
          <div className="text-center">
            <div className="text-[56px] font-bold leading-none">{o.correct}<span className="text-2xl text-[var(--bb-muted)]">/{o.total}</span></div>
            <div className="mt-2 text-[var(--bb-muted)]">correct ({pct(o)}%)</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Incorrect', String(o.incorrect)],
              ['Omitted', String(o.omitted)],
              ['Time spent', o.seconds ? formatDuration(o.seconds) : '—'],
              ['Avg / question', o.seconds ? formatDuration(o.seconds / Math.max(o.total, 1)) : '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[#f3f4f8] px-4 py-3">
                <div className="text-[13px] text-[var(--bb-muted)]">{label}</div>
                <div className="text-[22px] font-bold tabular-nums">{value}</div>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-4"><StackedBar t={o} /></div>
          </div>
        </section>

        {/* Điểm mạnh / cần luyện thêm */}
        {(focus.length > 0 || strengths.length > 0) && (
          <section className="grid md:grid-cols-2 gap-6">
            <div className={`${card} p-6`}>
              <h2 className="text-lg font-bold mb-3">Focus on next</h2>
              {focus.length ? (
                <ul className="space-y-3">
                  {focus.map(s => {
                    const lesson = lessonFor(s.name);
                    return (
                      <li key={s.name} className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-[14px] text-[var(--bb-wrong)] font-semibold">{s.tally.total - s.tally.correct} missed of {s.tally.total}</span>
                        {lesson && <Link href={lesson.href} className="w-full text-[14px] text-[var(--bb-blue)] font-semibold hover:underline">Study: {lesson.title} →</Link>}
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="text-[var(--bb-muted)]">Nothing missed. Nice work!</p>}
            </div>
            <div className={`${card} p-6`}>
              <h2 className="text-lg font-bold mb-3">Strengths</h2>
              {strengths.length ? (
                <ul className="space-y-3">
                  {strengths.map(s => (
                    <li key={s.name} className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-[14px] text-[var(--bb-correct)] font-semibold">{s.tally.correct}/{s.tally.total} correct</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[var(--bb-muted)]">No skill at 80% or higher in this set yet.</p>}
            </div>
          </section>
        )}

        {/* Thống kê theo domain / skill và độ khó */}
        <section className="grid md:grid-cols-[1fr_300px] gap-6 items-start">
          <div className={`${card} p-6`}>
            <h2 className="text-lg font-bold mb-4">Performance by Skill</h2>
            <div className="space-y-6">
              {stats.domains.map(d => (
                <div key={d.name} className="space-y-3">
                  <TallyRow name={d.name} t={d.tally} strong />
                  <div className="pl-4 space-y-3 border-l-2 border-[#ececec]">
                    {d.skills.map(s => <TallyRow key={s.name} name={s.name} t={s.tally} />)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-5 text-[13px] text-[var(--bb-muted)]">
              <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm bg-[var(--bb-correct)]" />Correct</span>
              <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm bg-[var(--bb-wrong)]" />Incorrect</span>
              <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm bg-[#9a9a9a]" />Omitted</span>
            </div>
          </div>
          <div className={`${card} p-6`}>
            <h2 className="text-lg font-bold mb-4">By Difficulty</h2>
            <div className="space-y-4">
              {stats.difficulties.map(d => <TallyRow key={d.name} name={d.name} t={d.tally} />)}
            </div>
            {o.seconds > 0 && (
              <>
                <h3 className="font-bold mt-6 mb-2">Average time</h3>
                <div className="space-y-1 text-[14px]">
                  {(['correct', 'incorrect'] as const).map(k => {
                    const list = stats.items.filter(it => it.outcome === k);
                    return list.length ? (
                      <div key={k} className="flex justify-between"><span>{OUTCOME[k].label} answers</span>
                        <span className="tabular-nums font-semibold">{formatDuration(list.reduce((s, it) => s + it.seconds, 0) / list.length)}</span></div>
                    ) : null;
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Danh sách câu hỏi + lời giải */}
        <section className={`${card} overflow-hidden`}>
          <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#ececec]">
            <h2 className="text-lg font-bold">Questions</h2>
            <div className="flex flex-wrap items-center gap-2">
              {filters.map(([f, label, n]) => (
                <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
                  className={`px-3.5 py-1.5 rounded-full text-[14px] font-bold border-[1.5px] border-[var(--bb-blue)] ${filter === f ? 'bg-[var(--bb-blue)] text-white' : 'text-[var(--bb-blue)] hover:bg-[var(--bb-blue-soft)]'}`}>
                  {label} ({n})
                </button>
              ))}
              {shown.length > 0 && (
                <button className="text-[14px] font-semibold text-[var(--bb-blue)] hover:underline ml-1"
                  onClick={() => setOpen(prev => {
                    const next = new Set(prev);
                    shown.forEach(({ item }) => (allOpen ? next.delete(keyOf(item)) : next.add(keyOf(item))));
                    return next;
                  })}>
                  {allOpen ? 'Collapse all' : 'Expand all'}
                </button>
              )}
            </div>
          </div>

          {report.modules.map((m, mi) => {
            const rows = shown.filter(({ item }) => item.module === mi);
            return (
              <div key={mi}>
                {(multi || onReview) && (
                  <div className="px-5 sm:px-6 py-3 bg-[#f7f7f7] flex flex-wrap items-center justify-between gap-2 border-b border-[#ececec]">
                    <span className="font-bold">{m.title}</span>
                    {onReview && <button className="bb-secondary py-1.5 text-[14px]" onClick={() => onReview(mi)}>Review in Test View</button>}
                  </div>
                )}
                {rows.length === 0 && <p className="px-6 py-5 text-[var(--bb-muted)]">No questions here.</p>}
                <div className="divide-y divide-[#ececec]">
                  {rows.map(({ item, n }) => {
                    const k = keyOf(item);
                    const isOpen = open.has(k);
                    return (
                      <div key={k}>
                        <button className="w-full flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3 text-left hover:bg-[#fafafa]" onClick={() => toggle(k)} aria-expanded={isOpen}>
                          <span className="w-7 font-bold tabular-nums">{n}</span>
                          <Tag outcome={item.outcome} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14px] font-semibold truncate">{item.question.skill}</span>
                            <span className="block text-[13px] text-[var(--bb-muted)] truncate">{item.question.domain} · {item.question.difficulty}</span>
                          </span>
                          <span className="hidden sm:block text-[13px] text-right text-[var(--bb-muted)] w-36">
                            You: <b className="text-[var(--bb-ink)]">{item.answer || '—'}</b> · Key: <b className="text-[var(--bb-ink)]">{item.result ? correctAnswerText(item.result) : '—'}</b>
                          </span>
                          <span className="hidden md:block w-14 text-right text-[13px] tabular-nums text-[var(--bb-muted)]">{item.seconds ? formatDuration(item.seconds) : ''}</span>
                          <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && <QuestionDetail item={item} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {actions && <div className="flex flex-wrap justify-end gap-3">{actions}</div>}
      </main>
    </div>
  );
}
