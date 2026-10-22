'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import TestShell from '@/components/bluebook/TestShell';
import type { QuestionResult } from '@/components/bluebook/QuestionView';
import { BankStats, fetchMeta, fetchQuestions, gradeAnswers, QuestionFilter } from '@/lib/api';
import { getHistory, recordLessonPractice, recordResults, updateLesson, useHistory, useNickname } from '@/lib/storage';
import type { Answers, GradeResult, Question, Subject } from '@/lib/types';
import { SECTION_OF } from '@/lib/types';
import { findLesson } from '@/lib/learn';
import ReportView from '@/components/report/ReportView';
import { CB_ORDER, newReportId, PracticeReport, saveReport } from '@/lib/report';

type Kind = 'module' | 'section' | 'full' | 'custom';
type Pool = 'all' | 'unseen' | 'mistakes';

interface Config {
  subject: Subject;
  kind: Kind;
  skills: string[]; // rỗng = tất cả
  difficulties: string[];
  count: number;
  pool: Pool;
  timer: 'off' | 'pace' | 'custom';
  minutes: number;
  instant: boolean;
  includeBluebook: boolean;
  excludeSeen: boolean;
}

interface ModuleRun {
  title: string;
  questions: Question[];
  answers: Answers;
  endsAt: number | null;
  results: (GradeResult | undefined)[];
  seconds?: number[]; // thời gian ở từng câu
}

const MODULE = { Verbal: { size: 27, minutes: 32 }, Math: { size: 22, minutes: 35 } };
const PACE_SECONDS = { Verbal: 71, Math: 95 };
const ADAPTIVE_THRESHOLD = 0.6;

const byOrder = <T,>(entries: [string, T][]) => entries.sort(([a], [b]) => CB_ORDER.indexOf(a) - CB_ORDER.indexOf(b));

const sectionNumber = (s: Subject) => (s === 'Verbal' ? 1 : 2);
const moduleTitle = (s: Subject, n: number) => `Section ${sectionNumber(s)}, Module ${n}: ${SECTION_OF[s]}`;

function calculateSectionScore(correctCount: number, totalCount: number, isHarder: boolean): number {
  if (totalCount === 54) {
    // Verbal Section (2 modules = 54 questions)
    const rawRatio = correctCount / 54;
    if (isHarder) {
      return Math.min(800, Math.max(480, Math.round((480 + rawRatio * 320) / 10) * 10));
    } else {
      return Math.min(590, Math.max(200, Math.round((200 + rawRatio * 390) / 10) * 10));
    }
  } else if (totalCount === 44) {
    // Math Section (2 modules = 44 questions)
    const rawRatio = correctCount / 44;
    if (isHarder) {
      return Math.min(800, Math.max(480, Math.round((480 + rawRatio * 320) / 10) * 10));
    } else {
      return Math.min(590, Math.max(200, Math.round((200 + rawRatio * 390) / 10) * 10));
    }
  } else {
    // Single module
    return Math.min(800, Math.max(200, Math.round((200 + (correctCount / totalCount) * 600) / 10) * 10));
  }
}

function defaultConfig(subject: Subject, kind: Kind): Config {
  return {
    subject,
    kind,
    skills: [],
    difficulties: [],
    pool: 'all',
    count: kind === 'full' ? MODULE.Verbal.size : kind === 'custom' ? 10 : MODULE[subject].size,
    timer: kind === 'custom' ? 'off' : 'pace',
    minutes: 15,
    instant: kind === 'custom',
    includeBluebook: false,
    excludeSeen: true,
  };
}

function minutesFor(config: Config, count: number) {
  if (config.timer === 'off') return null;
  if (config.kind === 'full') return MODULE.Verbal.minutes;
  if (config.kind !== 'custom') return MODULE[config.subject].minutes;
  if (config.timer === 'pace') return Math.max(1, Math.round((count * PACE_SECONDS[config.subject]) / 60));
  return config.minutes;
}

// ---------- Màn hình nghỉ giữa giờ (Intermission Break) ----------

function BreakScreen({ onResume }: { onResume: () => void }) {
  const [seconds, setSeconds] = useState(600); // 10 phút

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timer);
          onResume();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onResume]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0f172a] text-white p-6">
      <div className="max-w-lg w-full bg-[#1e293b] rounded-2xl p-8 sm:p-10 border border-slate-700 shadow-2xl text-center space-y-6">
        <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
          Section 1 Complete
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">10-Minute Break</h1>
        <p className="text-sm text-slate-300">
          You have completed the Reading &amp; Writing section. Take a moment to stretch, drink water, or rest your eyes before starting Math.
        </p>

        <div className="py-6 bg-slate-900/60 rounded-xl border border-slate-800">
          <div className="text-6xl font-mono font-bold tracking-widest text-blue-400">
            {timeFormatted}
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Break time remaining</p>
        </div>

        <div className="text-left text-xs text-slate-300 bg-slate-800/80 p-4 rounded-lg space-y-2 border border-slate-700">
          <p className="font-semibold text-white">Guidelines during the break:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-300">
            <li>Do not close your browser tab.</li>
            <li>Testing will automatically resume when the clock reaches 00:00.</li>
            <li>You can resume immediately whenever you are ready.</li>
          </ul>
        </div>

        <button
          onClick={onResume}
          className="w-full bb-primary !py-3.5 !text-base !font-bold !rounded-xl !bg-blue-600 hover:!bg-blue-500 text-white shadow-lg transition-all"
        >
          Resume Testing (Section 2: Math) →
        </button>
      </div>
    </div>
  );
}

// ---------- Màn hình chọn bài ----------

function SkillPicker({ stats, subject, selected, onChange }: {
  stats: BankStats | null; subject: Subject; selected: string[]; onChange: (skills: string[]) => void;
}) {
  const section = stats?.[SECTION_OF[subject]];
  if (!section) return <p className="text-sm text-[var(--bb-muted)]">Loading question counts…</p>;
  const has = (s: string) => selected.includes(s);
  const toggle = (skills: string[], on: boolean) =>
    onChange(on ? [...new Set([...selected, ...skills])] : selected.filter(s => !skills.includes(s)));
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {byOrder(Object.entries(section.domains)).map(([domain, d]) => {
        const skills = byOrder(Object.entries(d.skills)).map(([skill]) => skill);
        const all = skills.every(has);
        return (
          <div key={domain}>
            <label className="flex items-center gap-2 font-bold text-[15px] mb-2">
              <input type="checkbox" checked={all} ref={el => { if (el) el.indeterminate = !all && skills.some(has); }}
                onChange={e => toggle(skills, e.target.checked)} />
              {domain} <span className="font-normal text-[var(--bb-muted)]">({d.total})</span>
            </label>
            <div className="pl-6 space-y-1.5">
              {byOrder(Object.entries(d.skills)).map(([skill, s]) => (
                <label key={skill} className="flex items-center gap-2 text-[14px]">
                  <input type="checkbox" checked={has(skill)} onChange={e => toggle([skill], e.target.checked)} />
                  {skill} <span className="text-[var(--bb-muted)]">({s.total})</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex justify-self-start w-fit flex-wrap rounded-full border-[1.5px] border-[var(--bb-blue)] overflow-hidden">
      {options.map(([v, label]) => (
        <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v}
          className={`px-4 py-1.5 text-[14px] font-bold ${value === v ? 'bg-[var(--bb-blue)] text-white' : 'text-[var(--bb-blue)] hover:bg-[var(--bb-blue-soft)]'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Setup({ config, setConfig, stats, onStart, error, loading }: {
  config: Config; setConfig: (c: Config) => void; stats: BankStats | null; onStart: () => void; error: string | null; loading: boolean;
}) {
  const history = useHistory();
  const section = SECTION_OF[config.subject];
  const mine = Object.values(history || {}).filter(h => h.section === section);
  const mistakes = mine.filter(h => !h.correct).length;
  const custom = config.kind === 'custom';
  const isFull = config.kind === 'full';
  const row = 'grid sm:grid-cols-[180px_1fr] gap-2 sm:gap-6 items-start py-4 border-b border-[#e3e3e3]';

  return (
    <div className="min-h-dvh bg-[#f7f7f7]">
      <header className="bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1 font-semibold hover:underline"><ArrowLeft size={18} /> Home</Link>
          <span className="text-xl font-bold">Practice</span>
        </div>
        <div className="bb-dash" />
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] px-7 py-3">
          <div className={row}>
            <span className="font-bold pt-1.5">Subject</span>
            {isFull ? (
              <div className="pt-1.5 text-[15px] font-semibold text-[var(--bb-blue)]">
                All Sections: Reading &amp; Writing + Math (Official 4-module test)
              </div>
            ) : (
              <Segmented value={config.subject} options={[['Verbal', 'Reading & Writing'], ['Math', 'Math']]}
                onChange={subject => setConfig({ ...defaultConfig(subject, config.kind), instant: config.instant })} />
            )}
          </div>
          <div className={row}>
            <span className="font-bold pt-1.5">Format</span>
            <div>
              <Segmented value={config.kind} options={[
                ['full', 'Full Test (134 min)'],
                ['section', 'Adaptive section'],
                ['module', 'Bluebook module'],
                ['custom', 'Custom set']
              ]}
                onChange={kind => setConfig(defaultConfig(config.subject, kind))} />
              <p className="text-sm text-[var(--bb-muted)] mt-2">
                {config.kind === 'full' && 'Complete 4-module Digital SAT exam (134 min): 2 adaptive Reading & Writing modules (64 min) → 10-minute break → 2 adaptive Math modules (70 min) with estimated 400–1600 composite score.'}
                {config.kind === 'module' && `${MODULE[config.subject].size} questions in ${MODULE[config.subject].minutes} minutes, with the official domain mix and question order.`}
                {config.kind === 'section' && `Two ${MODULE[config.subject].minutes}-minute modules. Module 2 gets harder or easier depending on how you do in Module 1, like the real test.`}
                {custom && 'Choose exactly what to practice.'}
              </p>
            </div>
          </div>

          {/* Tuỳ chọn chỉ chọn câu mới (Exclude Seen) */}
          <div className={row}>
            <span className="font-bold">Lọc câu hỏi</span>
            <label className="flex items-start gap-2 text-[15px]">
              <input
                type="checkbox"
                className="mt-1"
                checked={config.excludeSeen}
                onChange={e => setConfig({ ...config, excludeSeen: e.target.checked })}
              />
              <span>
                <strong>Chỉ chọn câu hỏi mới</strong> (Exclude seen questions).{' '}
                <span className="text-[var(--bb-muted)]">Hệ thống sẽ lọc bỏ các câu bạn đã từng làm để làm đề mới 100%.</span>
              </span>
            </label>
          </div>

          {custom && (
            <>
              <div className={row}>
                <span className="font-bold">Skills</span>
                <div>
                  <SkillPicker stats={stats} subject={config.subject} selected={config.skills} onChange={skills => setConfig({ ...config, skills })} />
                  <p className="text-xs text-[var(--bb-muted)] mt-3">Leave everything unchecked to practice all skills.</p>
                </div>
              </div>
              <div className={row}>
                <span className="font-bold">Difficulty</span>
                <div className="flex gap-5">
                  {['Easy', 'Medium', 'Hard'].map(d => (
                    <label key={d} className="flex items-center gap-2 text-[15px]">
                      <input type="checkbox" checked={config.difficulties.includes(d)}
                        onChange={e => setConfig({ ...config, difficulties: e.target.checked ? [...config.difficulties, d] : config.difficulties.filter(x => x !== d) })} />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
              <div className={row}>
                <span className="font-bold pt-1.5">Questions</span>
                <Segmented value={String(config.count)} options={['5', '10', '15', '20', '30'].map(n => [n, n] as [string, string])}
                  onChange={n => setConfig({ ...config, count: Number(n) })} />
              </div>
              <div className={row}>
                <span className="font-bold pt-1.5">Question pool</span>
                <div>
                  <Segmented value={config.pool} options={[['all', 'All'], ['unseen', 'New to me'], ['mistakes', `My mistakes (${mistakes})`]]}
                    onChange={pool => setConfig({ ...config, pool })} />
                </div>
              </div>
              <div className={row}>
                <span className="font-bold pt-1.5">Timer</span>
                <div className="flex flex-wrap items-center gap-3">
                  <Segmented value={config.timer} options={[['off', 'Off'], ['pace', 'Bluebook pace'], ['custom', 'Custom']]}
                    onChange={timer => setConfig({ ...config, timer })} />
                  {config.timer === 'custom' && (
                    <label className="flex items-center gap-2 text-[15px]">
                      <input type="number" min={1} max={120} value={config.minutes} aria-label="Minutes"
                        onChange={e => setConfig({ ...config, minutes: Math.min(120, Math.max(1, Number(e.target.value) || 1)) })}
                        className="w-20 border-[1.5px] border-[#5f5f5f] rounded px-2 py-1" /> minutes
                    </label>
                  )}
                  {config.timer === 'pace' && <span className="text-sm text-[var(--bb-muted)]">{minutesFor(config, config.count)} min</span>}
                </div>
              </div>
              <div className={row}>
                <span className="font-bold pt-1.5">Answers</span>
                <Segmented value={config.instant ? 'instant' : 'end'} options={[['instant', 'Check each question'], ['end', 'Show at the end']]}
                  onChange={v => setConfig({ ...config, instant: v === 'instant' })} />
              </div>
            </>
          )}

          <div className={`${row} border-b-0`}>
            <span className="font-bold">Bluebook tests</span>
            <label className="flex items-start gap-2 text-[15px]">
              <input type="checkbox" className="mt-1" checked={config.includeBluebook} onChange={e => setConfig({ ...config, includeBluebook: e.target.checked })} />
              <span>Include questions from the official Bluebook practice tests, SAT and PSAT ({stats?.[section]?.bluebook ?? '…'} more). <span className="text-[var(--bb-muted)]">Leave this off if you still plan to take those tests in Bluebook.</span></span>
            </label>
          </div>
        </div>

        {error && <p className="mt-4 text-[var(--bb-wrong)] font-semibold" role="alert">{error}</p>}
        <div className="flex justify-end mt-6">
          <button className="bb-primary text-lg px-10 py-3" onClick={onStart} disabled={loading}>{loading ? 'Loading…' : 'Start'}</button>
        </div>
      </main>
    </div>
  );
}

// ---------- Trang luyện tập ----------

function PracticeContent() {
  const params = useSearchParams();
  const router = useRouter();
  const preset = params.get('preset');
  const sharedIds = params.get('ids');
  const presetSubject: Subject = params.get('subject') === 'Math' ? 'Math' : 'Verbal';
  // Luyện tập sau bài học: /practice?lesson=grammar/transitions&count=10&bluebook=1
  const lessonParam = params.get('lesson');
  const lessonFound = lessonParam ? findLesson(...(lessonParam.split('/') as [string, string])) : null;
  const lesson = lessonFound?.lesson.practice ? lessonFound : null;
  const lessonHref = lesson ? `/learn/${lesson.course.slug}/${lesson.lesson.slug}` : null;

  const [config, setConfig] = useState<Config>(() =>
    preset === 'full'
      ? defaultConfig('Verbal', 'full')
      : preset === 'module' || preset === 'section'
      ? defaultConfig(presetSubject, preset)
      : defaultConfig(presetSubject, 'custom')
  );
  const [stats, setStats] = useState<BankStats | null>(null);
  const [phase, setPhase] = useState<'loading' | 'setup' | 'session' | 'transition' | 'break' | 'results' | 'review'>(
    preset || sharedIds || lesson ? 'loading' : 'setup'
  );
  const [modules, setModules] = useState<ModuleRun[]>([]);
  const [current, setCurrent] = useState(0);
  const [reviewing, setReviewing] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingIndex, setCheckingIndex] = useState<number | null>(null);
  const [adaptive, setAdaptive] = useState<string | null>(null);
  const [adaptiveFlags, setAdaptiveFlags] = useState<{ rwHarder?: boolean; mathHarder?: boolean }>({});
  const [report, setReport] = useState<PracticeReport | null>(null);

  // Đo thời gian ở từng câu của module đang làm
  const timing = useRef<{ index: number | null; since: number; seconds: number[] }>({ index: null, since: 0, seconds: [] });
  const resetTiming = () => { timing.current = { index: null, since: 0, seconds: [] }; };
  const onNavigate = useCallback((index: number | null) => {
    const t = timing.current;
    const now = Date.now();
    if (t.index !== null) t.seconds[t.index] = (t.seconds[t.index] || 0) + (now - t.since) / 1000;
    t.index = index;
    t.since = now;
  }, []);
  const name = useNickname() || 'Student';

  useEffect(() => {
    fetchMeta().then(m => setStats(m.stats)).catch(() => setError('Could not reach the question server. It may be waking up; try again in a moment.'));
  }, []);

  const buildFilter = useCallback((c: Config, extra: Partial<QuestionFilter> = {}): QuestionFilter => {
    const history = getHistory();
    const section = SECTION_OF[c.subject];
    const filter: QuestionFilter = {
      subject: c.subject,
      count: c.count,
      includeBluebook: c.includeBluebook,
      format: c.kind === 'custom' ? 'random' : 'module',
      excludeIds: c.excludeSeen ? Object.keys(history) : [],
    };
    if (c.kind === 'custom') {
      if (c.skills.length) filter.skills = c.skills;
      if (c.difficulties.length) filter.difficulties = c.difficulties;
      if (c.pool === 'all') filter.excludeIds = [];
      if (c.pool === 'mistakes') {
        filter.onlyIds = Object.entries(history).filter(([, h]) => !h.correct && h.section === section).map(([id]) => id);
        filter.excludeIds = [];
      }
    }
    return { ...filter, ...extra };
  }, []);

  // Tải đề rồi vào bài; chỉ đặt state sau khi có kết quả (gọi được từ effect)
  const launch = useCallback(async (c: Config, extra: Partial<QuestionFilter> = {}) => {
    try {
      const activeSubject = c.kind === 'full' ? 'Verbal' : c.subject;
      const count = c.kind === 'full' ? MODULE.Verbal.size : c.count;
      const filter = buildFilter({ ...c, subject: activeSubject, count }, extra);
      const questions = await (filter.onlyIds && !filter.onlyIds.length
        ? Promise.reject(new Error('You have no mistakes to redo here yet.'))
        : fetchQuestions(filter));
      if (!questions.length) throw new Error('No questions match these settings. Try selecting more skills or difficulties.');
      const minutes = minutesFor(c, questions.length);
      setConfig(c);
      setModules([{
        title: lesson && extra.topics !== undefined ? `Lesson Practice: ${lesson.lesson.title}`
          : extra.subject === 'Any' ? 'Practice'
          : c.kind === 'full' ? moduleTitle('Verbal', 1)
          : c.kind === 'custom' ? `Practice: ${SECTION_OF[c.subject]}`
          : moduleTitle(c.subject, 1),
        questions,
        answers: {},
        endsAt: minutes ? Date.now() + minutes * 60_000 : null,
        results: [],
      }]);
      setCurrent(0);
      setAdaptive(null);
      setAdaptiveFlags({});
      setReport(null);
      resetTiming();
      setError(null);
      setPhase('session');
    } catch (e) {
      setConfig(c);
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setPhase('setup');
    } finally {
      setLoading(false);
    }
  }, [buildFilter, lesson]);

  // Câu luyện tập của bài học: đúng skill, ưu tiên đúng chủ đề và câu chưa làm, không tính giờ, kiểm tra từng câu
  const launchLesson = useCallback(() => {
    if (!lesson?.lesson.practice) return;
    const { skills, topics } = lesson.lesson.practice;
    const count = [5, 10, 15].includes(Number(params.get('count'))) ? Number(params.get('count')) : 10;
    launch({ ...defaultConfig(lesson.course.slug === 'math' ? 'Math' : 'Verbal', 'custom'), count, instant: true, timer: 'off', includeBluebook: params.get('bluebook') === '1' },
      { skills, topics: topics || [], excludeIds: Object.keys(getHistory()) });
  }, [lesson, params, launch]);

  const start = (c: Config, extra: Partial<QuestionFilter> = {}) => {
    setLoading(true);
    setError(null);
    launch(c, extra);
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (lesson) {
      launchLesson();
    } else if (sharedIds) {
      const ids = sharedIds.split(',').map(s => s.trim()).filter(Boolean).slice(0, 100);
      launch({ ...defaultConfig('Verbal', 'custom'), count: ids.length, instant: true },
        { subject: 'Any', onlyIds: ids, excludeIds: [], includeBluebook: true, format: 'random' });
    } else if (preset === 'mistakes') {
      const c = { ...defaultConfig('Verbal', 'custom'), pool: 'mistakes' as Pool, count: 30 };
      const history = getHistory();
      const wrong = Object.entries(history).filter(([, h]) => !h.correct);
      const subject: Subject = wrong.length && wrong.every(([, h]) => h.section === 'Math') ? 'Math' : 'Verbal';
      launch({ ...c, subject });
    } else if (preset === 'full') {
      launch(defaultConfig('Verbal', 'full'));
    } else if (preset === 'module' || preset === 'section') {
      launch(defaultConfig(presetSubject, preset));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const mod = modules[current];

  const updateModule = (i: number, patch: Partial<ModuleRun>) =>
    setModules(prev => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  const onAnswer = (index: number, value: string) => {
    setModules(prev => prev.map((m, idx) => (idx === current ? { ...m, answers: { ...m.answers, [index]: value } } : m)));
  };

  const onCheck = async (index: number) => {
    const q = mod.questions[index];
    setCheckingIndex(index);
    try {
      const [result] = await gradeAnswers([{ id: q.id, answer: mod.answers[index] || '' }]);
      recordResults([q], [result]);
      const results = [...mod.results];
      results[index] = result;
      updateModule(current, { results });
    } catch {
      setError('Could not check this answer. Please try again.');
    } finally {
      setCheckingIndex(null);
    }
  };

  const finishSession = (done: ModuleRun[], adaptiveNote: string | null, scaled?: { total: number; rw?: number; math?: number }) => {
    const r: PracticeReport = {
      id: newReportId(),
      ts: Date.now(),
      title: config.kind === 'full'
        ? 'Full Practice Test: Reading & Writing + Math'
        : config.kind === 'section'
        ? `${SECTION_OF[config.subject]}: Adaptive Section`
        : done[0].title,
      adaptive: adaptiveNote,
      modules: done.map(({ title, questions, answers, results, seconds }) => ({ title, questions, answers, results, seconds })),
      scaledScore: scaled,
    };
    saveReport(r);
    setReport(r);
    setPhase('results');
  };

  // Bắt đầu phần Math sau khi hết 10 phút nghỉ
  const resumeAfterBreak = async () => {
    setPhase('transition');
    try {
      const questions = await fetchQuestions(buildFilter({ ...config, subject: 'Math', count: MODULE.Math.size }, {
        subject: 'Math',
        count: MODULE.Math.size,
        format: 'module',
        excludeIds: [...(config.excludeSeen ? Object.keys(getHistory()) : []), ...modules.flatMap(m => m.questions.map(q => q.id))],
      }));
      setModules(prev => [
        ...prev,
        {
          title: moduleTitle('Math', 1),
          questions,
          answers: {},
          endsAt: Date.now() + MODULE.Math.minutes * 60_000,
          results: [],
        },
      ]);
      setCurrent(2);
      resetTiming();
      setPhase('session');
    } catch {
      setError('Could not load Section 2 (Math). Check your connection.');
      finishSession(modules, adaptive, undefined);
    }
  };

  const finishModule = async () => {
    const m = modules[current];
    onNavigate(null);
    const seconds = [...timing.current.seconds];
    let graded: GradeResult[];
    try {
      graded = await gradeAnswers(m.questions.map((q, i) => ({ id: q.id, answer: m.answers[i] || '' })));
    } catch {
      setError('Could not submit your answers. Check your connection and try again.');
      return;
    }
    const results = m.questions.map((q, i) => graded.find(r => r.id === q.id) || m.results[i]);
    recordResults(m.questions.filter((_, i) => !m.results[i]), results.filter((r, i) => r && !m.results[i]) as GradeResult[]);
    const done = modules.map((x, idx) => (idx === current ? { ...x, results, seconds } : x));
    setModules(done);

    // Xử lý Full-length Practice Test (4 modules)
    if (config.kind === 'full') {
      if (current === 0) {
        // Hoàn thành R&W Module 1 -> sang R&W Module 2 Adaptive
        const ratio = results.filter(r => r?.correct).length / results.length;
        const harder = ratio >= ADAPTIVE_THRESHOLD;
        setAdaptiveFlags(prev => ({ ...prev, rwHarder: harder }));
        setPhase('transition');
        try {
          const questions = await fetchQuestions(buildFilter({ ...config, subject: 'Verbal', count: MODULE.Verbal.size }, {
            difficulties: harder ? ['Medium', 'Hard'] : ['Easy', 'Medium'],
            excludeIds: [...(config.excludeSeen ? Object.keys(getHistory()) : []), ...m.questions.map(q => q.id)],
          }));
          setModules([...done, {
            title: moduleTitle('Verbal', 2),
            questions,
            answers: {},
            endsAt: Date.now() + MODULE.Verbal.minutes * 60_000,
            results: [],
          }]);
          setCurrent(1);
          resetTiming();
          setPhase('session');
        } catch {
          setError('Could not load Reading & Writing Module 2.');
          finishSession(done, null);
        }
        return;
      }

      if (current === 1) {
        // Hoàn thành R&W Module 2 -> Nghỉ giải lao 10 phút trước khi làm Math
        setPhase('break');
        return;
      }

      if (current === 2) {
        // Hoàn thành Math Module 1 -> sang Math Module 2 Adaptive
        const ratio = results.filter(r => r?.correct).length / results.length;
        const harder = ratio >= ADAPTIVE_THRESHOLD;
        setAdaptiveFlags(prev => ({ ...prev, mathHarder: harder }));
        setPhase('transition');
        try {
          const questions = await fetchQuestions(buildFilter({ ...config, subject: 'Math', count: MODULE.Math.size }, {
            difficulties: harder ? ['Medium', 'Hard'] : ['Easy', 'Medium'],
            excludeIds: [...(config.excludeSeen ? Object.keys(getHistory()) : []), ...done.flatMap(x => x.questions.map(q => q.id))],
          }));
          setModules([...done, {
            title: moduleTitle('Math', 2),
            questions,
            answers: {},
            endsAt: Date.now() + MODULE.Math.minutes * 60_000,
            results: [],
          }]);
          setCurrent(3);
          resetTiming();
          setPhase('session');
        } catch {
          setError('Could not load Math Module 2.');
          finishSession(done, null);
        }
        return;
      }

      if (current === 3) {
        // Hoàn thành toàn bộ 4 Module đề thi chuẩn
        const rwCorrect = (done[0].results.filter(r => r?.correct).length) + (done[1].results.filter(r => r?.correct).length);
        const mathCorrect = (done[2].results.filter(r => r?.correct).length) + (done[3].results.filter(r => r?.correct).length);
        const rwHarder = adaptiveFlags.rwHarder ?? true;
        const mathHarder = adaptiveFlags.mathHarder ?? true;
        const rwScore = calculateSectionScore(rwCorrect, 54, rwHarder);
        const mathScore = calculateSectionScore(mathCorrect, 44, mathHarder);
        const total = rwScore + mathScore;
        const adaptiveNote = `R&W: ${rwHarder ? 'Harder' : 'Easier'} M2 · Math: ${mathHarder ? 'Harder' : 'Easier'} M2`;
        finishSession(done, adaptiveNote, { total, rw: rwScore, math: mathScore });
        return;
      }
    }

    // Xử lý Section Test (2 modules adaptive)
    if (config.kind === 'section') {
      if (current === 0) {
        const ratio = results.filter(r => r?.correct).length / results.length;
        const harder = ratio >= ADAPTIVE_THRESHOLD;
        setAdaptiveFlags({ [config.subject === 'Verbal' ? 'rwHarder' : 'mathHarder']: harder });
        const note = harder ? 'Module 2 was the harder module.' : 'Module 2 was the easier module.';
        setAdaptive(note);
        setPhase('transition');
        try {
          const questions = await fetchQuestions(buildFilter(config, {
            difficulties: harder ? ['Medium', 'Hard'] : ['Easy', 'Medium'],
            excludeIds: [...(config.excludeSeen ? Object.keys(getHistory()) : []), ...m.questions.map(q => q.id)],
          }));
          setModules([...done, {
            title: moduleTitle(config.subject, 2),
            questions,
            answers: {},
            endsAt: Date.now() + MODULE[config.subject].minutes * 60_000,
            results: [],
          }]);
          setCurrent(1);
          resetTiming();
          setPhase('session');
        } catch {
          setError('Could not load Module 2.');
          finishSession(done, null);
        }
        return;
      }

      if (current === 1) {
        const totalCorrect = (done[0].results.filter(r => r?.correct).length) + (done[1].results.filter(r => r?.correct).length);
        const totalQ = done[0].questions.length + done[1].questions.length;
        const harder = (config.subject === 'Verbal' ? adaptiveFlags.rwHarder : adaptiveFlags.mathHarder) ?? true;
        const score = calculateSectionScore(totalCorrect, totalQ, harder);
        finishSession(done, adaptive, { total: score });
        return;
      }
    }

    // Single Module
    if (config.kind === 'module') {
      const totalCorrect = done[0].results.filter(r => r?.correct).length;
      const score = calculateSectionScore(totalCorrect, done[0].questions.length, false);
      finishSession(done, null, { total: score });
      return;
    }

    if (lesson && m.title.startsWith('Lesson Practice')) {
      const key = `${lesson.course.slug}/${lesson.lesson.slug}`;
      recordLessonPractice(key, results.filter(r => r?.correct).length, results.length);
      updateLesson(key, p => ({ ...p, done: true }));
    }

    finishSession(done, adaptive);
  };

  const redoMistakes = () => {
    const ids = modules.flatMap(m => m.questions.filter((_, i) => !m.results[i]?.correct).map(q => q.id));
    const c = { ...config, kind: 'custom' as Kind, instant: true, timer: 'off' as const, count: Math.min(ids.length, 30) };
    start(c, { onlyIds: ids, excludeIds: [], skills: undefined, difficulties: undefined, format: 'random' });
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-[var(--bb-blue)] border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-semibold">Preparing your questions…</p>
      </div>
    );
  }

  if (phase === 'setup' || !mod) {
    return <Setup config={config} setConfig={setConfig} stats={stats} onStart={() => start(config)} error={error} loading={loading} />;
  }

  if (phase === 'transition') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-[var(--bb-blue)] border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-semibold">Module complete. Loading next module…</p>
      </div>
    );
  }

  if (phase === 'break') {
    return <BreakScreen onResume={resumeAfterBreak} />;
  }

  if (phase === 'results' && report) {
    const wrong = modules.some(m => m.results.some(r => !r?.correct));
    const onNew = lessonHref ? () => router.push(lessonHref) : () => { setPhase('setup'); router.replace('/practice'); };
    return (
      <ReportView report={report} onReview={m => { setReviewing(m); setPhase('review'); }}
        back={lessonHref ? { href: lessonHref, label: 'Lesson' } : { href: '/', label: 'Home' }}
        actions={<>
          <Link href="/reports" className="bb-secondary">All Reports</Link>
          {wrong && <button className="bb-secondary" onClick={redoMistakes}>Redo My Mistakes</button>}
          <button className="bb-primary" onClick={onNew}>{lessonHref ? 'Back to Lesson' : 'New Practice'}</button>
        </>} />
    );
  }

  if (phase === 'review') {
    const r = modules[reviewing];
    return (
      <TestShell
        key={`review-${reviewing}`}
        title={r.title}
        questions={r.questions}
        answers={r.answers}
        studentName={name}
        results={r.results.map(x => (x ? { key: x, correct: x.correct } : undefined)) as (QuestionResult | undefined)[]}
        onSubmit={() => setPhase('results')}
        onExit={() => setPhase('results')}
        exitLabel="Back to Results"
        reviewNote={<p>Select a question to review it. Select <strong>Next</strong> to go back to your results.</p>}
        shareLinks
      />
    );
  }

  const submitMessage =
    config.kind === 'full'
      ? current === 0
        ? "You will move on to Reading & Writing Module 2 and won't be able to return to these questions."
        : current === 1
        ? "You have completed Section 1. You will proceed to the 10-minute break before Math Section."
        : current === 2
        ? "You will move on to Math Module 2 and won't be able to return to these questions."
        : "You will submit your test and view your complete Digital SAT score report."
      : config.kind === 'section' && current === 0
      ? "You will move on to Module 2 and won't be able to return to these questions."
      : "You will see your score and explanations next.";

  return (
    <>
      <TestShell
        key={`run-${current}-${mod.questions[0]?.id}`}
        title={mod.title}
        questions={mod.questions}
        answers={mod.answers}
        onAnswer={onAnswer}
        endsAt={mod.endsAt}
        onTimeUp={finishModule}
        onSubmit={finishModule}
        onNavigate={onNavigate}
        submitConfirm={submitMessage}
        studentName={name}
        results={mod.results.map(x => (x ? { key: x, correct: x.correct } : undefined))}
        onCheck={config.instant ? onCheck : undefined}
        checkingIndex={checkingIndex}
        onExit={lessonHref ? () => router.push(lessonHref) : () => { setPhase('setup'); router.replace('/practice'); }}
        exitLabel="Exit Practice"
        exitConfirm="Your answers in this set won't be saved."
        shareLinks
      />
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[var(--bb-wrong)] text-white px-4 py-2 rounded-lg font-semibold" role="alert"
          onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <PracticeContent />
    </Suspense>
  );
}
