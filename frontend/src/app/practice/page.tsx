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

type Kind = 'module' | 'section' | 'custom';
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

function defaultConfig(subject: Subject, kind: Kind): Config {
  return {
    subject, kind, skills: [], difficulties: [], pool: 'all',
    count: kind === 'custom' ? 10 : MODULE[subject].size,
    timer: kind === 'custom' ? 'off' : 'pace',
    minutes: 15,
    instant: kind === 'custom',
    includeBluebook: false,
  };
}

function minutesFor(config: Config, count: number) {
  if (config.timer === 'off') return null;
  if (config.kind !== 'custom') return MODULE[config.subject].minutes;
  if (config.timer === 'pace') return Math.max(1, Math.round((count * PACE_SECONDS[config.subject]) / 60));
  return config.minutes;
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
            <Segmented value={config.subject} options={[['Verbal', 'Reading & Writing'], ['Math', 'Math']]}
              onChange={subject => setConfig({ ...defaultConfig(subject, config.kind), instant: config.instant })} />
          </div>
          <div className={row}>
            <span className="font-bold pt-1.5">Format</span>
            <div>
              <Segmented value={config.kind} options={[['custom', 'Custom set'], ['module', 'Bluebook module'], ['section', 'Adaptive section']]}
                onChange={kind => setConfig(defaultConfig(config.subject, kind))} />
              <p className="text-sm text-[var(--bb-muted)] mt-2">
                {config.kind === 'module' && `${MODULE[config.subject].size} questions in ${MODULE[config.subject].minutes} minutes, with the official domain mix and question order.`}
                {config.kind === 'section' && `Two ${MODULE[config.subject].minutes}-minute modules. Module 2 gets harder or easier depending on how you do in Module 1, like the real test.`}
                {custom && 'Choose exactly what to practice.'}
              </p>
            </div>
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
    preset === 'module' || preset === 'section' ? defaultConfig(presetSubject, preset) : defaultConfig(presetSubject, 'custom'));
  const [stats, setStats] = useState<BankStats | null>(null);
  const [phase, setPhase] = useState<'loading' | 'setup' | 'session' | 'transition' | 'results' | 'review'>(preset || sharedIds || lesson ? 'loading' : 'setup');
  const [modules, setModules] = useState<ModuleRun[]>([]);
  const [current, setCurrent] = useState(0);
  const [reviewing, setReviewing] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingIndex, setCheckingIndex] = useState<number | null>(null);
  const [adaptive, setAdaptive] = useState<string | null>(null);
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
      excludeIds: Object.keys(history), // ưu tiên câu chưa làm
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
      const filter = buildFilter(c, extra);
      const questions = await (filter.onlyIds && !filter.onlyIds.length
        ? Promise.reject(new Error('You have no mistakes to redo here yet.'))
        : fetchQuestions(filter));
      if (!questions.length) throw new Error('No questions match these settings. Try selecting more skills or difficulties.');
      const minutes = minutesFor(c, questions.length);
      setConfig(c);
      setModules([{
        title: lesson && extra.topics !== undefined ? `Lesson Practice: ${lesson.lesson.title}`
          : extra.subject === 'Any' ? 'Practice' : c.kind === 'custom' ? `Practice: ${SECTION_OF[c.subject]}` : moduleTitle(c.subject, 1),
        questions,
        answers: {},
        endsAt: minutes ? Date.now() + minutes * 60_000 : null,
        results: [],
      }]);
      setCurrent(0);
      setAdaptive(null);
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

  // Vào thẳng từ trang chủ (module / section / làm lại câu sai).
  // launch() chỉ đặt state sau khi tải đề xong (sau await), không phải setState đồng bộ trong effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (lesson) {
      launchLesson();
    } else if (sharedIds) {
      // Link chia sẻ: /practice?ids=a1b2c3d4,e5f6a7b8
      const ids = sharedIds.split(',').map(s => s.trim()).filter(Boolean).slice(0, 100);
      launch({ ...defaultConfig('Verbal', 'custom'), count: ids.length, instant: true },
        { subject: 'Any', onlyIds: ids, excludeIds: [], includeBluebook: true, format: 'random' });
    } else if (preset === 'mistakes') {
      const c = { ...defaultConfig('Verbal', 'custom'), pool: 'mistakes' as Pool, count: 30 };
      const history = getHistory();
      const wrong = Object.entries(history).filter(([, h]) => !h.correct);
      const subject: Subject = wrong.length && wrong.every(([, h]) => h.section === 'Math') ? 'Math' : 'Verbal';
      launch({ ...c, subject });
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

  // Kiểm tra từng câu (chế độ học)
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

  // Kết thúc phiên: lập báo cáo và lưu lại để xem / tải về sau
  const finishSession = (done: ModuleRun[], adaptiveNote: string | null) => {
    const r: PracticeReport = {
      id: newReportId(),
      ts: Date.now(),
      title: config.kind === 'section' ? `${SECTION_OF[config.subject]}: Adaptive Section` : done[0].title,
      adaptive: adaptiveNote,
      modules: done.map(({ title, questions, answers, results, seconds }) => ({ title, questions, answers, results, seconds })),
    };
    saveReport(r);
    setReport(r);
    setPhase('results');
  };

  const finishModule = async () => {
    const m = modules[current];
    onNavigate(null); // dừng đồng hồ câu đang xem
    const seconds = [...timing.current.seconds];
    let graded: GradeResult[];
    try {
      graded = await gradeAnswers(m.questions.map((q, i) => ({ id: q.id, answer: m.answers[i] || '' })));
    } catch {
      setError('Could not submit your answers. Check your connection and try again.');
      return;
    }
    const results = m.questions.map((q, i) => graded.find(r => r.id === q.id) || m.results[i]);
    // Câu đã kiểm tra từng câu thì đã được ghi lại rồi
    recordResults(m.questions.filter((_, i) => !m.results[i]), results.filter((r, i) => r && !m.results[i]) as GradeResult[]);
    const done = modules.map((x, idx) => (idx === current ? { ...x, results, seconds } : x));
    setModules(done);

    if (config.kind === 'section' && current === 0) {
      // Module 2 thích ứng: làm tốt module 1 thì module 2 khó hơn
      const ratio = results.filter(r => r?.correct).length / results.length;
      const harder = ratio >= ADAPTIVE_THRESHOLD;
      const note = harder ? 'Module 2 was the harder module.' : 'Module 2 was the easier module.';
      setAdaptive(note);
      setPhase('transition');
      try {
        const questions = await fetchQuestions(buildFilter(config, {
          difficulties: harder ? ['Medium', 'Hard'] : ['Easy', 'Medium'],
          excludeIds: [...Object.keys(getHistory()), ...m.questions.map(q => q.id)],
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
    if (lesson && m.title.startsWith('Lesson Practice')) { // không tính lượt "làm lại câu sai"
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
        <p className="text-lg font-semibold">Module 1 complete. Loading Module 2…</p>
      </div>
    );
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
        submitConfirm={config.kind === 'section' && current === 0 ? 'You will move on to Module 2 and won\'t be able to return to these questions.' : 'You will see your score and explanations next.'}
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
