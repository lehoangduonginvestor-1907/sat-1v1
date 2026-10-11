'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Edit2, Swords, BookOpen, GraduationCap, Target, X } from 'lucide-react';
import { setNickname as saveNickname, useHistory, useNickname, History } from '@/lib/storage';

const DOMAINS: Record<string, string[]> = {
  Verbal: ['Craft and Structure', 'Information and Ideas', 'Standard English Conventions', 'Expression of Ideas'],
  Math: ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'],
};

interface MatchSettings {
  subject: 'Verbal' | 'Math';
  domain: string;
  difficulty: string;
  questionCount: number;
  timeLimit: number;
  includeBluebook: boolean;
  mode: 'classic' | 'finish';
  turns: number; // số lượt mỗi người (Finish Line)
}

function NicknameForm({ initial, onSave, onCancel }: { initial: string; onSave: (name: string) => void; onCancel?: () => void }) {
  const [name, setName] = useState(initial);
  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (name.trim()) onSave(name.trim()); }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Math Destroyer" autoFocus maxLength={20}
        aria-label="Nickname"
        className="w-full border-[1.5px] border-[#5f5f5f] px-4 py-3 rounded-lg text-center font-bold outline-none focus:border-[var(--bb-blue)] text-lg" />
      <div className="flex gap-3 justify-center">
        {onCancel && <button type="button" className="bb-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="bb-primary" disabled={!name.trim()}>Continue</button>
      </div>
    </form>
  );
}

function CreateMatchModal({ onClose, onCreate }: { onClose: () => void; onCreate: (s: MatchSettings) => void }) {
  const [s, setS] = useState<MatchSettings>({ subject: 'Verbal', domain: 'All', difficulty: 'All', questionCount: 10, timeLimit: 12, includeBluebook: false, mode: 'classic', turns: 2 });
  const select = 'w-full border-[1.5px] border-[#5f5f5f] rounded-lg px-3 py-2.5 outline-none focus:border-[var(--bb-blue)] bg-white';
  const subjectButton = (subject: MatchSettings['subject'], label: string) => (
    <button type="button" onClick={() => setS({ ...s, subject, domain: 'All' })}
      className={`py-2.5 rounded-lg font-bold border-[1.5px] ${s.subject === subject ? 'border-[var(--bb-blue)] bg-[var(--bb-blue-soft)] text-[var(--bb-blue)]' : 'border-[#c4c4c4] text-[var(--bb-muted)]'}`}>
      {label}
    </button>
  );
  return (
    <div className="bb-modal-backdrop" role="dialog" aria-modal="true" aria-label="Match settings">
      <form className="bb-modal relative" onSubmit={e => { e.preventDefault(); onCreate(s); }}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[var(--bb-muted)]" aria-label="Close"><X size={22} /></button>
        <h2 className="text-2xl font-bold mb-5">New 1v1 Match</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {([['classic', 'Classic Race', 'Same questions, race the clock'], ['finish', 'Finish Line', 'Turns, point packages, steals']] as const).map(([mode, label, hint]) => (
                <button key={mode} type="button" onClick={() => setS({ ...s, mode })}
                  className={`py-2.5 px-3 rounded-lg border-[1.5px] text-left ${s.mode === mode ? 'border-[var(--bb-blue)] bg-[var(--bb-blue-soft)]' : 'border-[#c4c4c4]'}`}>
                  <span className={`block font-bold ${s.mode === mode ? 'text-[var(--bb-blue)]' : ''}`}>{label}</span>
                  <span className="block text-xs text-[var(--bb-muted)]">{hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Subject</label>
            <div className="grid grid-cols-2 gap-3">{subjectButton('Verbal', 'Reading & Writing')}{subjectButton('Math', 'Math')}</div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2" htmlFor="m-domain">Domain</label>
            <select id="m-domain" className={select} value={s.domain} onChange={e => setS({ ...s, domain: e.target.value })}>
              <option value="All">All domains (Bluebook mix)</option>
              {DOMAINS[s.subject].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {s.mode === 'finish' ? (
            <>
              <div>
                <label className="block text-sm font-bold mb-2" htmlFor="m-turns">Turns per player</label>
                <select id="m-turns" className={select} value={s.turns} onChange={e => setS({ ...s, turns: Number(e.target.value) })}>
                  {[1, 2, 3].map(n => <option key={n} value={n}>{n} {n === 1 ? 'turn' : 'turns'} ({n * 3} questions each)</option>)}
                </select>
              </div>
              <ul className="text-xs text-[var(--bb-muted)] space-y-1 list-disc pl-4">
                <li>On your turn, pick a package of 3 questions: Easy 10, Medium 20 or Hard 30 points.</li>
                <li>Star of Hope (once per turn): double points if right, lose the points if wrong.</li>
                <li>Miss or run out of time and your opponent can steal: right takes your points, wrong costs them half.</li>
                <li>Tied at the end? A sudden-death question: first correct answer wins.</li>
              </ul>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="m-diff">Difficulty</label>
                  <select id="m-diff" className={select} value={s.difficulty} onChange={e => setS({ ...s, difficulty: e.target.value })}>
                    <option value="All">Mixed</option><option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="m-count">Questions</label>
                  <select id="m-count" className={select} value={s.questionCount} onChange={e => setS({ ...s, questionCount: Number(e.target.value) })}>
                    {[5, 10, 15, 20, 22, 27].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="m-time">Minutes</label>
                  <select id="m-time" className={select} value={s.timeLimit} onChange={e => setS({ ...s, timeLimit: Number(e.target.value) })}>
                    {[5, 8, 10, 12, 15, 20, 25, 32, 35].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-[var(--bb-muted)]">Bluebook pace: 27 questions in 32 min (Reading &amp; Writing), 22 in 35 min (Math).</p>
            </>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5" checked={s.includeBluebook} onChange={e => setS({ ...s, includeBluebook: e.target.checked })} />
            <span>Include questions from the official Bluebook practice tests (SAT and PSAT) <span className="text-[var(--bb-muted)]">(leave off if you still plan to take them)</span></span>
          </label>
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" className="bb-primary">Create Room</button>
        </div>
      </form>
    </div>
  );
}

function Stats({ history }: { history: History }) {
  const entries = Object.values(history);
  if (!entries.length) return null;
  const correct = entries.filter(e => e.correct).length;
  const mistakes = entries.filter(e => !e.correct).length;
  return (
    <div className="flex flex-wrap gap-8 text-[15px]">
      <div><div className="text-2xl font-bold">{entries.length}</div><div className="text-[var(--bb-muted)]">questions practiced</div></div>
      <div><div className="text-2xl font-bold">{Math.round((correct / entries.length) * 100)}%</div><div className="text-[var(--bb-muted)]">latest accuracy</div></div>
      <div><div className="text-2xl font-bold">{mistakes}</div><div className="text-[var(--bb-muted)]">to redo</div></div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const nickname = useNickname();
  const history = useHistory();
  const [editingName, setEditingName] = useState(false);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');

  // Link mời kiểu cũ: /?join=1234
  const legacyJoin = params.get('join');
  useEffect(() => {
    if (legacyJoin) router.replace(`/arena?room=${encodeURIComponent(legacyJoin)}`);
  }, [legacyJoin, router]);

  const mistakes = useMemo(() => Object.values(history || {}).filter(e => !e.correct).length, [history]);

  if (nickname === null || legacyJoin) return <div className="min-h-dvh" />;

  if (!nickname || editingName) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#f7f7f7] p-4">
        <div className="bg-white p-10 rounded-2xl shadow-[0_2px_16px_rgb(0_0_0/0.12)] w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-2">SAT Arena</h1>
          <p className="text-[var(--bb-muted)] mb-8">Choose a nickname. Your opponents will see it.</p>
          <NicknameForm initial={nickname} onCancel={nickname ? () => setEditingName(false) : undefined}
            onSave={name => { saveNickname(name); setEditingName(false); }} />
        </div>
      </div>
    );
  }

  const createMatch = (s: MatchSettings) => {
    const q = new URLSearchParams({
      new: '1', subject: s.subject, domain: s.domain, difficulty: s.difficulty,
      count: String(s.questionCount), minutes: String(s.timeLimit), bluebook: s.includeBluebook ? '1' : '0',
      mode: s.mode, turns: String(s.turns),
    });
    router.push(`/arena?${q}`);
  };

  return (
    <div className="min-h-dvh bg-[#f7f7f7]">
      <header className="bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">SAT Arena</span>
          <button onClick={() => setEditingName(true)} className="flex items-center gap-2 text-[15px] font-semibold hover:underline" title="Change nickname">
            {nickname} <Edit2 size={15} />
          </button>
        </div>
        <div className="bb-dash" />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <section>
          <h1 className="text-[28px] font-bold mb-1">Welcome back, {nickname}</h1>
          <p className="text-[var(--bb-muted)]">Practice on official College Board questions in a Bluebook-style test window.</p>
        </section>

        <section className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-7">
          <div className="flex items-center gap-3 mb-2"><GraduationCap className="text-[var(--bb-blue)]" /><h2 className="text-xl font-bold">Learn</h2></div>
          <p className="text-[var(--bb-muted)] mb-5">Lessons for every Reading, Writing and Math question type, from transitions and punctuation to quadratics, circles and statistics. Each lesson ends with practice on official questions.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/learn/grammar/transitions" className="bb-primary">Writing: Grammar &amp; Expression</Link>
            <Link href="/learn/reading/how-sat-reading-works" className="bb-primary">Reading</Link>
            <Link href="/learn/math/sat-math-and-desmos" className="bb-primary">Math</Link>
            <Link href="/learn" className="bb-secondary">All Lessons</Link>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-7 flex flex-col">
            <div className="flex items-center gap-3 mb-2"><Swords className="text-[var(--bb-blue)]" /><h2 className="text-xl font-bold">1v1 Arena</h2></div>
            <p className="text-[var(--bb-muted)] mb-6 flex-1">Race a friend on the same questions, or play Finish Line: take turns picking point packages, bet with the Star of Hope and steal points when your opponent misses. Trash talk included.</p>
            <button className="bb-primary self-start mb-5" onClick={() => setCreating(true)}>Create Match</button>
            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (code.trim()) router.push(`/arena?room=${encodeURIComponent(code.trim())}`); }}>
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Room code" inputMode="numeric"
                aria-label="Room code"
                className="w-36 border-[1.5px] border-[#5f5f5f] rounded-full px-4 py-2 outline-none focus:border-[var(--bb-blue)] font-semibold tracking-widest" />
              <button type="submit" className="bb-secondary" disabled={code.length !== 4}>Join</button>
            </form>
          </section>

          <section className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-7 flex flex-col">
            <div className="flex items-center gap-3 mb-2"><BookOpen className="text-[var(--bb-blue)]" /><h2 className="text-xl font-bold">Bluebook-Style Module</h2></div>
            <p className="text-[var(--bb-muted)] mb-6 flex-1">A full timed module with the official domain mix and question order. Check your work, then review every answer with explanations.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/practice?preset=module&subject=Verbal" className="bb-primary">Reading &amp; Writing · 27 Q · 32 min</Link>
              <Link href="/practice?preset=module&subject=Math" className="bb-primary">Math · 22 Q · 35 min</Link>
            </div>
            <Link href="/practice?preset=section&subject=Verbal" className="mt-4 text-[15px] font-semibold text-[var(--bb-blue)] hover:underline self-start">
              Or take a full adaptive section (2 modules) →
            </Link>
          </section>
        </div>

        <section className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-7">
          <div className="flex items-center gap-3 mb-2"><Target className="text-[var(--bb-blue)]" /><h2 className="text-xl font-bold">Free Practice</h2></div>
          <p className="text-[var(--bb-muted)] mb-5">Pick domains, skills and difficulty. Check each answer as you go or at the end, and redo the ones you missed.</p>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <Stats history={history || {}} />
            <div className="flex flex-wrap gap-3">
              <Link href="/reports" className="bb-secondary">Reports</Link>
              {mistakes > 0 && <Link href="/practice?preset=mistakes" className="bb-secondary">Redo Mistakes ({mistakes})</Link>}
              <Link href="/practice" className="bb-primary">Start Practicing</Link>
            </div>
          </div>
        </section>
      </main>

      {creating && <CreateMatchModal onClose={() => setCreating(false)} onCreate={createMatch} />}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <HomeContent />
    </Suspense>
  );
}
