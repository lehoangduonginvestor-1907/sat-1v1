'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { ArrowLeft, Calculator, ChevronDown, Crown, Star, Swords, Zap } from 'lucide-react';
import RichContent from '@/components/bluebook/RichContent';
import CalculatorPanel from '@/components/bluebook/CalculatorPanel';
import Modal from '@/components/bluebook/Modal';
import { isValidSprInput } from '@/components/bluebook/QuestionView';
import type { AnswerKey, Question } from '@/lib/types';
import { correctAnswerText } from '@/lib/types';

// ---- Kiểu dữ liệu server gửi xuống (backend/lib/finishLine.js) ----

type Difficulty = 'Easy' | 'Medium' | 'Hard';
export interface FlEntry {
  turn: number; q: number; activeId: string; questionId: string; difficulty: Difficulty; value: number; star: boolean;
  answer: string; correct: boolean; steal: { playerId: string; answer: string; correct: boolean } | null; deltas: Record<string, number>;
}
export interface FlState {
  phase: 'pick' | 'ready' | 'question' | 'steal' | 'stealAnswer' | 'reveal' | 'tiebreak' | 'done';
  activeId: string | null; turn: number; totalTurns: number; turns: string[];
  pkg: { difficulty: Difficulty; value: number }[] | null; q: number; star: boolean; starUsed: boolean;
  deadline: number; startsAt: number; serverNow: number; scores: Record<string, number>;
  question: Question | null; seconds: number; value: number | null; difficulty: Difficulty | null;
  attempt: { answer: string; correct: boolean } | null;
  steal: { playerId: string; answer?: string; correct?: boolean } | null;
  reveal: { key: AnswerKey; entry: FlEntry } | null;
  continued: string[]; tiebreak: { locked: string[]; winnerId: string | null } | null; log: FlEntry[];
}
export interface FlEnd {
  mode: 'finish'; results: { playerId: string; name: string; score: number }[]; winnerId: string | null; forfeitId: string | null;
  log: FlEntry[]; tiebreak: { locked: string[]; winnerId: string | null; questionId: string } | null;
  questions: Record<string, Question>; keys: Record<string, AnswerKey>;
}
interface Player { playerId: string; name: string; connected: boolean; rematch: boolean }

const VALUE: Record<Difficulty, number> = { Easy: 10, Medium: 20, Hard: 30 };
const DIFF_STYLE: Record<Difficulty, string> = {
  Easy: 'bg-[#e6f4ec] text-[#0b7a3b] border-[#0b7a3b]',
  Medium: 'bg-[#fff4d6] text-[#8a5a00] border-[#d49b00]',
  Hard: 'bg-[#fbe9ec] text-[#c4122f] border-[#c4122f]',
};
const PRESETS: [string, Difficulty[]][] = [
  ['Safe · 40', ['Easy', 'Easy', 'Medium']],
  ['Balanced · 60', ['Medium', 'Medium', 'Medium']],
  ['Bold · 80', ['Medium', 'Hard', 'Hard']],
  ['All-in · 90', ['Hard', 'Hard', 'Hard']],
];

function useSecondsLeft(deadline: number, offset: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, Math.ceil((deadline + offset - now) / 1000));
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

// ---- Bảng điểm ----

function Scoreboard({ s, me, opp, secondsLeft }: { s: FlState; me?: Player; opp?: Player; secondsLeft: number }) {
  const [last, setLast] = useState<{ key: number; deltas: Record<string, number> } | null>(null);
  const logLen = s.log.length;
  // Hiện +/- điểm mỗi khi có câu mới được chấm
  useEffect(() => {
    const entry = s.log[logLen - 1];
    if (!entry) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLast({ key: logLen, deltas: entry.deltas });
  }, [logLen]); // eslint-disable-line react-hooks/exhaustive-deps

  const side = (p: Player | undefined, mine: boolean) => {
    const active = p && s.activeId === p.playerId;
    const delta = p && last?.deltas[p.playerId];
    return (
      <div className={`flex-1 min-w-0 flex items-center gap-3 ${mine ? '' : 'flex-row-reverse text-right'}`}>
        <div className={`relative rounded-xl px-4 py-2 min-w-[92px] text-center ${active ? (mine ? 'bg-[#7d93ff] text-[#10184a]' : 'bg-[#ff8a7a] text-[#4a1208]') : 'bg-white/10'}`}>
          <div className="text-[30px] font-bold leading-none tabular-nums">{p ? s.scores[p.playerId] ?? 0 : 0}</div>
          {delta ? <span key={last!.key} className={`fl-delta absolute -top-3 ${mine ? '-right-3' : '-left-3'} text-[15px] font-bold rounded-full px-2 py-0.5 ${delta > 0 ? 'bg-[#0b7a3b]' : 'bg-[#c4122f]'} text-white`}>{signed(delta)}</span> : null}
        </div>
        <div className="min-w-0">
          <div className="font-bold truncate">{p?.name ?? '…'} {mine && <span className="font-normal text-white/60">(you)</span>}</div>
          <div className="text-[12px] text-white/60">
            {active ? (s.star ? <span className="text-[#ffd34d] font-bold">⭐ Star of Hope on</span> : 'On the clock') : p && !p.connected ? <span className="text-[#ffb4b4]">Offline</span> : ' '}
          </div>
        </div>
      </div>
    );
  };
  const timed = !['reveal', 'done'].includes(s.phase);
  return (
    <div className="bg-[#1e1e1e] text-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        {side(me, true)}
        <div className="text-center flex-shrink-0">
          <div className="text-[11px] font-bold tracking-[0.2em] text-white/60">{s.phase === 'tiebreak' ? 'SUDDEN DEATH' : `TURN ${Math.min(s.turn + 1, s.totalTurns)}/${s.totalTurns}`}</div>
          <div className={`text-[26px] font-bold tabular-nums leading-tight ${timed && secondsLeft <= 10 ? 'text-[#ff8a7a]' : ''}`}>{timed ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}` : '—'}</div>
        </div>
        {side(opp, false)}
      </div>
    </div>
  );
}

function PackageStrip({ s }: { s: FlState }) {
  if (!s.pkg) return null;
  const turnLog = s.log.filter(e => e.turn === s.turn);
  return (
    <div className="flex justify-center gap-2 sm:gap-3 py-3 bg-white border-b border-[#e3e3e3]">
      {s.pkg.map((p, i) => {
        const done = turnLog.find(e => e.q === i);
        const current = i === s.q && !done;
        const starred = done ? done.star : current && s.star;
        return (
          <div key={i} className={`relative rounded-lg border-[1.5px] px-3 py-1.5 text-center min-w-[78px] ${DIFF_STYLE[p.difficulty]} ${current ? 'ring-2 ring-offset-2 ring-[var(--bb-blue)]' : ''} ${done ? 'opacity-70' : ''}`}>
            <div className="text-[11px] font-bold uppercase tracking-wide">{p.difficulty}</div>
            <div className="text-[18px] font-bold leading-tight">{p.value}</div>
            {starred && <Star size={16} className="absolute -top-2 -right-2 fill-[#ffd34d] text-[#c99700]" />}
            {done && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-bold bg-white rounded-full px-1.5 border">{done.correct ? '✓' : done.steal?.correct ? 'Stolen' : '✗'}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ---- Chọn gói câu hỏi ----

function PackagePicker({ onPick, secondsLeft }: { onPick: (d: Difficulty[]) => void; secondsLeft: number }) {
  const [slots, setSlots] = useState<Difficulty[]>(['Medium', 'Medium', 'Medium']);
  const total = slots.reduce((n, d) => n + VALUE[d], 0);
  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-[0_2px_16px_rgb(0_0_0/0.12)] p-6 sm:p-8">
      <h2 className="text-2xl font-bold mb-1">Choose your package</h2>
      <p className="text-[var(--bb-muted)] mb-5">Three questions. Harder ones are worth more, and your opponent can steal any you miss. Auto-picks Balanced in {secondsLeft}s.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {PRESETS.map(([label, d]) => (
          <button key={label} onClick={() => setSlots(d)} className={`px-3 py-1.5 rounded-full text-[14px] font-bold border-[1.5px] ${slots.join() === d.join() ? 'bg-[var(--bb-blue)] text-white border-[var(--bb-blue)]' : 'border-[var(--bb-blue)] text-[var(--bb-blue)] hover:bg-[var(--bb-blue-soft)]'}`}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {slots.map((d, i) => (
          <div key={i}>
            <div className="text-[12px] font-bold text-[var(--bb-muted)] mb-1">Question {i + 1}</div>
            <div className="flex flex-col gap-1.5">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(opt => (
                <button key={opt} onClick={() => setSlots(slots.map((x, j) => (j === i ? opt : x)))} aria-pressed={d === opt}
                  className={`rounded-lg border-[1.5px] py-1.5 text-[14px] font-bold ${d === opt ? DIFF_STYLE[opt] : 'border-[#d6d6d6] text-[var(--bb-muted)]'}`}>
                  {opt} · {VALUE[opt]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">Package: {total} points</span>
        <button className="bb-primary" onClick={() => onPick(slots)}>Lock In</button>
      </div>
    </div>
  );
}

// ---- Câu hỏi ----

function QuestionPanel({ s, canAnswer, onAnswer, banner, reveal }: {
  s: FlState; canAnswer: boolean; onAnswer: (a: string) => void; banner: React.ReactNode;
  reveal?: { key: AnswerKey; marks: Record<string, string> };
}) {
  const q = s.question!;
  const [draft, setDraft] = useState('');
  const [calc, setCalc] = useState(false);
  const isMath = q.section === 'Math';
  const correctLetter = reveal?.key.type === 'mcq' ? 'ABCD'[reveal.key.correctAnswer ?? 0] : null;
  const locked = !canAnswer;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4">{banner}</div>
      <div className={`bg-white rounded-2xl shadow-[0_2px_16px_rgb(0_0_0/0.1)] p-5 sm:p-7 ${!isMath && q.stimulus ? 'md:grid md:grid-cols-2 md:gap-8' : 'max-w-3xl mx-auto'}`}>
        {q.stimulus && <div className={!isMath ? 'mb-5 md:mb-0 md:pr-8 md:border-r border-[#e3e3e3]' : 'mb-4'}><RichContent html={q.stimulus} /></div>}
        <div>
          <div className="flex items-center gap-2 mb-3">
            {s.difficulty && <span className={`text-[12px] font-bold rounded-full border px-2 py-0.5 ${DIFF_STYLE[s.difficulty]}`}>{s.difficulty} · {s.value ?? 20} pts</span>}
            <span className="text-[13px] text-[var(--bb-muted)]">{q.skill}</span>
            {isMath && <button className="ml-auto flex items-center gap-1 text-[13px] font-semibold text-[var(--bb-blue)] hover:underline" onClick={() => setCalc(c => !c)}><Calculator size={15} /> Calculator</button>}
          </div>
          <RichContent html={q.stem} className="mb-5" />
          {q.type === 'mcq' ? (
            <div className="space-y-3">
              {q.options.map((o, i) => {
                const letter = 'ABCD'[i];
                const mark = reveal?.marks[letter];
                const state = reveal
                  ? letter === correctLetter ? 'is-correct' : mark ? 'is-wrong' : ''
                  : draft === letter ? 'is-selected' : '';
                return (
                  <button key={letter} className={`bb-choice ${state}`} disabled={locked} onClick={() => setDraft(letter)} aria-pressed={draft === letter}>
                    <span className="bb-letter">{letter}</span>
                    <RichContent html={o} inline className="flex-1" />
                    {mark && <span className="text-[12px] font-bold text-[var(--bb-wrong)] self-center whitespace-nowrap">{mark}</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <input type="text" inputMode="decimal" autoComplete="off" spellCheck={false} aria-label="Your answer" value={draft} disabled={locked}
                onChange={e => isValidSprInput(e.target.value) && setDraft(e.target.value)}
                className="w-48 h-12 px-3 text-xl font-serif rounded-lg outline-none border-[1.5px] border-[#5f5f5f] focus:border-[var(--bb-blue)] bg-white disabled:bg-[#f3f3f3]" />
              {reveal && <p className="mt-3 font-bold">Correct answer: <span className="text-[var(--bb-correct)]">{correctAnswerText(reveal.key)}</span></p>}
            </div>
          )}
          {canAnswer && (
            <div className="mt-6 flex justify-end">
              <button className="bb-primary" disabled={!draft} onClick={() => onAnswer(draft)}>Lock In Answer</button>
            </div>
          )}
        </div>
      </div>
      {isMath && <CalculatorPanel open={calc} onClose={() => setCalc(false)} />}
    </div>
  );
}

function Banner({ tone, children }: { tone: 'blue' | 'red' | 'gold' | 'gray' | 'green'; children: React.ReactNode }) {
  const tones = {
    blue: 'bg-[var(--bb-blue-soft)] text-[var(--bb-blue)] border-[var(--bb-blue)]',
    red: 'bg-[var(--bb-wrong-soft)] text-[var(--bb-wrong)] border-[var(--bb-wrong)]',
    gold: 'bg-[#fff4d6] text-[#8a5a00] border-[#d49b00]',
    gray: 'bg-white text-[var(--bb-ink)] border-[#d6d6d6]',
    green: 'bg-[var(--bb-correct-soft)] text-[var(--bb-correct)] border-[var(--bb-correct)]',
  };
  return <div className={`rounded-xl border-[1.5px] px-4 py-3 font-semibold flex flex-wrap items-center gap-3 ${tones[tone]}`}>{children}</div>;
}

// ---- Màn hình trận đấu ----

export function FinishLineGame({ s, offset, me, opp, send, onLeave }: {
  s: FlState; offset: number; me?: Player; opp?: Player; send: (event: string, data?: object) => void; onLeave: () => void;
}) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const secondsLeft = useSecondsLeft(s.deadline, offset);
  const startIn = useSecondsLeft(s.startsAt, offset);
  const myId = me?.playerId;
  const isActive = s.activeId === myId;
  const name = (id: string | null | undefined) => (id === myId ? 'You' : id === opp?.playerId ? opp?.name ?? 'Opponent' : '—');
  const activeName = name(s.activeId);
  const [showWhy, setShowWhy] = useState(false);
  const qKey = `${s.question?.id}-${s.phase === 'stealAnswer' ? 'steal' : s.phase === 'reveal' ? 'reveal' : 'main'}`;

  let body: React.ReactNode = null;
  if (s.phase === 'pick') {
    body = isActive
      ? <PackagePicker onPick={d => send('fl:pick', { difficulties: d })} secondsLeft={secondsLeft} />
      : <Waiting title={`${activeName} is choosing a package…`} text="Read along when the question appears. If they miss, you can steal the points." />;
  } else if (s.phase === 'ready') {
    body = isActive ? (
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-[0_2px_16px_rgb(0_0_0/0.12)] p-7 text-center">
        <p className="text-[var(--bb-muted)] font-semibold">Question {s.q + 1} of 3</p>
        <p className={`inline-block mt-2 mb-5 text-[22px] font-bold rounded-full border-[1.5px] px-4 py-1 ${DIFF_STYLE[s.difficulty!]}`}>{s.difficulty} · {s.value} points</p>
        <p className="text-[15px] mb-6">
          {s.starUsed ? 'You already used your Star of Hope this turn.' : <>Use your <b>Star of Hope</b>? Right: <b className="text-[var(--bb-correct)]">+{(s.value ?? 0) * 2}</b> · Wrong: <b className="text-[var(--bb-wrong)]">−{s.value}</b>. Once per turn.</>}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {!s.starUsed && (
            <button className="bb-primary !bg-[#d49b00] hover:!bg-[#b88600] gap-2" onClick={() => send('fl:star', { use: true })}>
              <Star size={18} className="fill-white" /> Use Star of Hope
            </button>
          )}
          <button className={s.starUsed ? 'bb-primary' : 'bb-secondary'} onClick={() => send('fl:star', { use: false })}>Start Question</button>
        </div>
        <p className="text-[13px] text-[var(--bb-muted)] mt-4">Starts automatically in {secondsLeft}s.</p>
      </div>
    ) : <Waiting title={`${activeName}: question ${s.q + 1}, ${s.difficulty} for ${s.value} points`} text="They're deciding whether to bet the Star of Hope…" />;
  } else if (s.question && s.phase !== 'done') {
    const stealer = s.steal?.playerId;
    let banner: React.ReactNode;
    let canAnswer = false;
    let reveal: { key: AnswerKey; marks: Record<string, string> } | undefined;
    if (s.phase === 'question') {
      canAnswer = isActive;
      banner = isActive
        ? <Banner tone={s.star ? 'gold' : 'blue'}>{s.star && <Star size={18} className="fill-[#ffd34d]" />}Your question, {s.seconds}s total. {s.star ? 'Star of Hope is on!' : ''}</Banner>
        : <Banner tone="gray"><Swords size={18} />{activeName} is answering{s.star ? ' with the Star of Hope ⭐' : ''}. Work it out too: if they miss, you can steal.</Banner>;
    } else if (s.phase === 'steal') {
      const attempt = s.attempt?.answer ? `answered ${s.attempt.answer}, wrong` : 'ran out of time';
      banner = isActive
        ? <Banner tone="red">You {attempt}. {opp?.name} has {secondsLeft}s to steal…</Banner>
        : (
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl bg-[var(--bb-wrong-soft)] border-[1.5px] border-[var(--bb-wrong)] p-4">
            <p className="flex-1 font-semibold text-[var(--bb-wrong)]">{activeName} {attempt}! Steal {s.value} points? Wrong steal costs {Math.round((s.value ?? 0) / 2)}.</p>
            <button className="fl-steal rounded-full bg-[var(--bb-wrong)] text-white font-bold text-xl px-8 py-3 flex items-center gap-2" onClick={() => send('fl:steal')}>
              <Zap size={22} className="fill-white" /> STEAL! {secondsLeft}
            </button>
          </div>
        );
    } else if (s.phase === 'stealAnswer') {
      canAnswer = stealer === myId;
      banner = canAnswer
        ? <Banner tone="red"><Zap size={18} />You&apos;re stealing! Answer for {s.value} points.</Banner>
        : <Banner tone="red"><Zap size={18} />{name(stealer)} is stealing your {s.value} points…</Banner>;
    } else if (s.phase === 'tiebreak') {
      const lockedOut = Boolean(myId && s.tiebreak?.locked.includes(myId));
      canAnswer = !lockedOut;
      banner = <Banner tone="gold"><Crown size={18} />Sudden death: first correct answer wins the match. A wrong answer locks you out.{lockedOut ? ' You are locked out.' : ''}</Banner>;
    } else if (s.phase === 'reveal' && s.reveal) {
      const e = s.reveal.entry;
      const marks: Record<string, string> = {};
      if (e.answer && !e.correct) marks[e.answer] = name(e.activeId);
      if (e.steal?.answer && !e.steal.correct) marks[e.steal.answer] = marks[e.steal.answer] ? 'Both' : `${name(e.steal.playerId)} (steal)`;
      reveal = { key: s.reveal.key, marks };
      const parts = Object.entries(e.deltas).filter(([, d]) => d).map(([id, d]) => `${name(id)} ${signed(d)}`);
      const headline = e.correct ? `${name(e.activeId)} got it${e.star ? ' with the Star of Hope ⭐' : ''}!`
        : e.steal ? (e.steal.correct ? `${name(e.steal.playerId)} stole it!` : `Steal failed!`)
          : `${name(e.activeId)} missed${e.answer ? '' : ' (time ran out)'}.`;
      const waiting = myId && s.continued.includes(myId);
      banner = (
        <Banner tone={e.correct || e.steal?.correct ? 'green' : 'red'}>
          <span className="flex-1">{headline} {parts.length ? <span className="font-normal">({parts.join(', ')})</span> : null}</span>
          <button className="bb-primary !py-1.5" onClick={() => send('fl:continue')} disabled={Boolean(waiting)}>
            {waiting ? 'Waiting…' : `Continue (${secondsLeft})`}
          </button>
        </Banner>
      );
    }
    body = (
      <>
        <QuestionPanel key={qKey} s={s} canAnswer={canAnswer} onAnswer={a => send('fl:answer', { answer: a })} banner={banner} reveal={reveal} />
        {reveal && s.reveal?.key.rationale && (
          <div className="max-w-5xl mx-auto mt-4 bg-white rounded-2xl shadow-[0_2px_16px_rgb(0_0_0/0.1)]">
            <button className="w-full flex items-center justify-between px-6 py-4 font-bold" onClick={() => setShowWhy(v => !v)} aria-expanded={showWhy}>
              Explanation <ChevronDown size={18} className={showWhy ? 'rotate-180' : ''} />
            </button>
            {showWhy && <div className="px-6 pb-6"><RichContent html={s.reveal.key.rationale} className="text-[15px]" /></div>}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f7f7f7] flex flex-col">
      <Scoreboard s={s} me={me} opp={opp} secondsLeft={secondsLeft} />
      <PackageStrip s={s} />
      <main className="flex-1 px-4 py-6 pb-24">{body}</main>
      <button className="fixed bottom-6 left-6 z-40 text-[14px] font-semibold text-[var(--bb-muted)] bg-white/90 rounded-full px-4 py-2 shadow hover:underline" onClick={() => setConfirmLeave(true)}>
        Leave match
      </button>
      {confirmLeave && (
        <Modal title="Leave the match?" confirmLabel="Leave" onConfirm={onLeave} onCancel={() => setConfirmLeave(false)}>
          Leaving counts as a loss.
        </Modal>
      )}
      {startIn > 0 && (
        <div className="bb-modal-backdrop">
          <div className="text-center text-white">
            <p className="text-xl font-semibold mb-2">Finish Line starts in</p>
            <p className="text-[96px] font-bold leading-none tabular-nums">{startIn}</p>
            <p className="mt-4 text-white/80">{name(s.turns[0])} {s.turns[0] === myId ? 'go' : 'goes'} first</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Waiting({ title, text }: { title: string; text: string }) {
  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-[0_2px_16px_rgb(0_0_0/0.12)] p-8 text-center">
      <div className="w-10 h-10 border-4 border-[var(--bb-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-[var(--bb-muted)]">{text}</p>
    </div>
  );
}

// ---- Kết quả ----

export function FinishLineResults({ end, me, players, onRematch }: { end: FlEnd; me: string; players: Player[]; onRematch: () => void }) {
  const { width, height } = useWindowSize();
  const [open, setOpen] = useState<string | null>(null);
  const mine = end.results.find(r => r.playerId === me);
  const theirs = end.results.find(r => r.playerId !== me);
  const won = end.winnerId === me;
  const name = (id: string) => (id === me ? 'You' : theirs?.name ?? 'Opponent');
  const myRematch = players.find(p => p.playerId === me)?.rematch;
  const theirRematch = players.find(p => p.playerId !== me)?.rematch;
  const opponentHere = players.some(p => p.playerId !== me && p.connected);

  const rows = useMemo(() => [
    ...end.log.map((e, i) => ({ key: `l${i}`, e })),
    ...(end.tiebreak ? [{ key: 'tb', e: null }] : []),
  ], [end]);

  const card = (r: typeof mine, label: string, highlight: boolean) => (
    <div className={`flex-1 rounded-xl p-5 border-2 ${highlight ? 'border-[var(--bb-blue)] bg-[var(--bb-blue-soft)]' : 'border-[#e3e3e3]'}`}>
      <div className="flex items-center gap-2 font-bold text-[15px] mb-2">
        {r && end.winnerId === r.playerId && <Crown size={18} className="text-[#d4a000]" />}
        <span className="truncate">{r?.name ?? '—'}</span> <span className="text-[var(--bb-muted)] font-normal">{label}</span>
      </div>
      <div className="text-[44px] font-bold leading-none">{r?.score ?? 0}<span className="text-xl text-[var(--bb-muted)]"> pts</span></div>
    </div>
  );

  const detail = (qid: string) => {
    const q = end.questions[qid];
    const key = end.keys[qid];
    if (!q || !key) return null;
    return (
      <div className="px-4 sm:px-6 pb-5 pt-3 bg-[#fcfcfc] border-t border-[#ececec]">
        {q.stimulus && <RichContent html={q.stimulus} className="mb-3" />}
        <RichContent html={q.stem} className="mb-4" />
        {q.type === 'mcq' && (
          <div className="space-y-2 mb-4">
            {q.options.map((o, i) => (
              <div key={i} className={`bb-choice ${i === key.correctAnswer ? 'is-correct' : ''}`}><span className="bb-letter">{'ABCD'[i]}</span><RichContent html={o} inline className="flex-1" /></div>
            ))}
          </div>
        )}
        <p className="font-bold mb-2">Correct answer: <span className="text-[var(--bb-correct)]">{correctAnswerText(key)}</span></p>
        {key.rationale && <RichContent html={key.rationale} className="text-[15px]" />}
      </div>
    );
  };

  return (
    <div className="min-h-dvh bg-[#f7f7f7] pb-24">
      {won && <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden"><Confetti width={width} height={height} recycle={false} numberOfPieces={400} /></div>}
      <header className="bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1 font-semibold hover:underline"><ArrowLeft size={18} /> Home</Link>
          <span className="text-xl font-bold">Finish Line Results</span>
        </div>
        <div className="bb-dash" />
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-7">
          <h1 className="text-3xl font-bold text-center mb-2">{end.winnerId === null ? "It's a tie!" : won ? 'You won!' : `${theirs?.name ?? 'Your opponent'} won`}</h1>
          <p className="text-center text-[var(--bb-muted)] mb-6">
            {end.forfeitId ? `${name(end.forfeitId)} left the match.` : end.tiebreak?.winnerId ? 'Decided by the sudden-death question.' : ' '}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">{card(mine, '(you)', true)}{card(theirs, '', false)}</div>
        </section>

        <section className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] overflow-hidden">
          <h2 className="text-lg font-bold px-6 pt-6 pb-3">Play by play</h2>
          <div className="divide-y divide-[#ececec]">
            {rows.map(({ key, e }) => {
              const qid = e ? e.questionId : end.tiebreak!.questionId;
              const isOpen = open === key;
              return (
                <div key={key}>
                  <button className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3 text-left hover:bg-[#fafafa]" onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen}>
                    {e ? (
                      <>
                        <span className="w-16 text-[13px] text-[var(--bb-muted)]">T{e.turn + 1} · Q{e.q + 1}</span>
                        <span className="font-semibold w-28 truncate">{name(e.activeId)}</span>
                        <span className={`text-[12px] font-bold rounded-full border px-2 py-0.5 ${DIFF_STYLE[e.difficulty]}`}>{e.difficulty} · {e.value}</span>
                        {e.star && <Star size={16} className="fill-[#ffd34d] text-[#c99700]" />}
                        <span className={`text-[14px] font-semibold ${e.correct ? 'text-[var(--bb-correct)]' : 'text-[var(--bb-wrong)]'}`}>{e.correct ? 'Correct' : e.answer ? 'Wrong' : 'Time out'}</span>
                        {e.steal && <span className="text-[14px]"><Zap size={14} className="inline -mt-0.5" /> {name(e.steal.playerId)} {e.steal.correct ? 'stole it' : 'missed the steal'}</span>}
                        <span className="ml-auto text-[13px] tabular-nums text-[var(--bb-muted)]">{Object.entries(e.deltas).filter(([, d]) => d).map(([id, d]) => `${name(id)} ${signed(d)}`).join(' · ')}</span>
                      </>
                    ) : (
                      <span className="font-semibold"><Crown size={16} className="inline -mt-1 text-[#d4a000]" /> Sudden death: {end.tiebreak?.winnerId ? `${name(end.tiebreak.winnerId)} answered first` : 'nobody got it'}</span>
                    )}
                    <ChevronDown size={18} className={`${e ? '' : 'ml-auto'} ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && detail(qid)}
                </div>
              );
            })}
            {rows.length === 0 && <p className="px-6 pb-6 text-[var(--bb-muted)]">No questions were played.</p>}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {theirRematch && !myRematch && <span className="text-sm font-semibold text-[var(--bb-blue)]">{theirs?.name} wants a rematch!</span>}
          <button className="bb-primary" onClick={onRematch} disabled={Boolean(myRematch) || !opponentHere}>
            {myRematch ? 'Waiting for opponent…' : opponentHere ? 'Rematch' : 'Opponent left'}
          </button>
        </div>
      </main>
    </div>
  );
}
