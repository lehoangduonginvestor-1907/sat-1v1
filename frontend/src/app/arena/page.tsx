'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { ArrowLeft, Check, Copy, Crown, X as XIcon } from 'lucide-react';
import TestShell from '@/components/bluebook/TestShell';
import { formatClock } from '@/components/bluebook/BluebookHeader';
import { BACKEND_URL } from '@/lib/api';
import { useNickname, usePlayerId } from '@/lib/storage';
import type { AnswerKey, Answers, Question } from '@/lib/types';
import { SECTION_OF } from '@/lib/types';
import { Emote, EmoteDock, EmoteLayer } from '@/components/arena/Emotes';
import { FinishLineGame, FinishLineResults, FlEnd, FlState } from '@/components/arena/FinishLine';

interface RoomPlayer { playerId: string; name: string; connected: boolean; answered: number; finished: boolean; rematch: boolean }
interface RoomSettings { subject: 'Verbal' | 'Math'; domain: string; difficulty: string; questionCount: number; timeLimit: number; includeBluebook: boolean; mode?: 'classic' | 'finish'; turns?: number }
interface Room { code: string; state: 'waiting' | 'playing' | 'ended'; settings: RoomSettings; hostId: string; total: number; players: RoomPlayer[] }
interface MatchStart { questions: Question[]; startedAt: number; endsAt: number; serverNow: number; answers: Answers; finished: boolean }
interface PlayerResult { playerId: string; name: string; score: number; correct: boolean[]; answers: Answers; timeUsed: number }
interface MatchEnd { results: PlayerResult[]; winnerId: string | null; review: AnswerKey[] }

function TopBar({ me, opponent, total, code }: { me?: RoomPlayer; opponent?: RoomPlayer; total: number; code: string }) {
  const bar = (p: RoomPlayer | undefined, color: string, align: 'left' | 'right') => (
    <div className={`flex items-center gap-3 flex-1 min-w-0 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="font-semibold truncate max-w-[140px]">{p?.name ?? 'Waiting…'}</span>
      <div className="h-1.5 w-28 sm:w-40 rounded-full bg-white/20 overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${((p?.answered ?? 0) / Math.max(total, 1)) * 100}%`, background: color, marginLeft: align === 'right' ? 'auto' : undefined }} />
      </div>
      <span className="tabular-nums text-white/80">{p?.answered ?? 0}/{total}</span>
      {p?.finished && <span className="text-[11px] font-bold uppercase tracking-wide bg-white/15 rounded px-1.5 py-0.5">Submitted</span>}
      {p && !p.connected && <span className="text-[11px] font-bold uppercase tracking-wide text-[#ffb4b4]">Offline</span>}
    </div>
  );
  return (
    <div className="flex items-center gap-6 px-6 h-9 bg-[#1e1e1e] text-white text-[13px] flex-shrink-0">
      {bar(me, '#7d93ff', 'left')}
      <span className="font-bold tracking-[0.18em] text-white/70 whitespace-nowrap">1V1 · ROOM {code}</span>
      {bar(opponent, '#ff8a7a', 'right')}
    </div>
  );
}

function Lobby({ room, me, inviteLink, onLeave }: { room: Room; me: string; inviteLink: string; onLeave: () => void }) {
  const [copied, setCopied] = useState(false);
  const s = room.settings;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Trình duyệt chặn clipboard: người dùng tự chép link
    }
  };
  return (
    <div className="min-h-dvh bg-[#f7f7f7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgb(0_0_0/0.12)] w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold mb-1">Room {room.code}</h1>
        <p className="text-[var(--bb-muted)] mb-6">
          {s.mode === 'finish'
            ? <><b className="text-[var(--bb-ink)]">Finish Line</b> · {SECTION_OF[s.subject]} · {s.domain === 'All' ? 'All domains' : s.domain} · {s.turns} {s.turns === 1 ? 'turn' : 'turns'} each</>
            : <>{SECTION_OF[s.subject]} · {s.domain === 'All' ? 'All domains' : s.domain} · {s.difficulty === 'All' ? 'Mixed difficulty' : s.difficulty} · {s.questionCount} questions · {s.timeLimit} min</>}
        </p>
        <label className="block text-sm font-bold mb-2">Send this link to your opponent</label>
        <div className="flex items-center gap-2 border-[1.5px] border-[#5f5f5f] rounded-lg p-1.5 mb-6">
          <input readOnly value={inviteLink} aria-label="Invite link" className="flex-1 text-sm px-2 outline-none bg-transparent" onFocus={e => e.target.select()} />
          <button onClick={copy} className="bb-secondary !py-1.5 !px-3 flex items-center gap-1.5">{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</button>
        </div>
        <h2 className="font-bold mb-3">Players ({room.players.length}/2)</h2>
        <ul className="space-y-2 mb-6">
          {room.players.map(p => (
            <li key={p.playerId} className="flex items-center gap-3 bg-[var(--bb-bar)] rounded-lg px-4 py-2.5 font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${p.connected ? 'bg-[var(--bb-correct)]' : 'bg-[#bbb]'}`} />
              <span className="flex-1">{p.name} {p.playerId === me && <span className="text-[var(--bb-muted)] font-normal">(you)</span>}</span>
              {p.playerId === room.hostId && <span className="text-xs text-[var(--bb-muted)]">Host</span>}
            </li>
          ))}
          {room.players.length < 2 && (
            <li className="flex items-center gap-3 rounded-lg px-4 py-2.5 border-[1.5px] border-dashed border-[#bbb] text-[var(--bb-muted)]">
              <span className="w-4 h-4 border-2 border-[var(--bb-muted)] border-t-transparent rounded-full animate-spin" /> Waiting for opponent…
            </li>
          )}
        </ul>
        <p className="text-sm text-[var(--bb-muted)] mb-6">The match starts automatically when both players are here.</p>
        <button onClick={onLeave} className="font-semibold text-[var(--bb-muted)] hover:underline">Leave room</button>
      </div>
    </div>
  );
}

function Results({ end, room, me, questions, onReview, onRematch }: {
  end: MatchEnd; room: Room | null; me: string; questions: Question[]; onReview: () => void; onRematch: () => void;
}) {
  const { width, height } = useWindowSize();
  const mine = end.results.find(r => r.playerId === me);
  const theirs = end.results.find(r => r.playerId !== me);
  const won = end.winnerId === me;
  const tie = end.winnerId === null;
  const myRematch = room?.players.find(p => p.playerId === me)?.rematch;
  const theirRematch = room?.players.find(p => p.playerId !== me)?.rematch;
  const opponentHere = room?.players.some(p => p.playerId !== me && p.connected);

  const domains = useMemo(() => {
    const rows = new Map<string, { mine: number; theirs: number; total: number }>();
    questions.forEach((q, i) => {
      const r = rows.get(q.domain) || { mine: 0, theirs: 0, total: 0 };
      r.total++;
      if (mine?.correct[i]) r.mine++;
      if (theirs?.correct[i]) r.theirs++;
      rows.set(q.domain, r);
    });
    return [...rows.entries()];
  }, [questions, mine, theirs]);

  const card = (r: PlayerResult | undefined, label: string, highlight: boolean) => (
    <div className={`flex-1 rounded-xl p-5 border-2 ${highlight ? 'border-[var(--bb-blue)] bg-[var(--bb-blue-soft)]' : 'border-[#e3e3e3]'}`}>
      <div className="flex items-center gap-2 font-bold text-[15px] mb-2">
        {r && end.winnerId === r.playerId && <Crown size={18} className="text-[#d4a000]" />}
        <span className="truncate">{r?.name ?? '—'}</span> <span className="text-[var(--bb-muted)] font-normal">{label}</span>
      </div>
      <div className="text-[44px] font-bold leading-none">{r?.score ?? 0}<span className="text-xl text-[var(--bb-muted)]">/{questions.length}</span></div>
      <div className="text-sm text-[var(--bb-muted)] mt-2">Time used: {formatClock(r?.timeUsed ?? 0)}</div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#f7f7f7]">
      {won && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />
        </div>
      )}
      <header className="bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1 font-semibold hover:underline"><ArrowLeft size={18} /> Home</Link>
          <span className="text-xl font-bold">Match Results</span>
        </div>
        <div className="bb-dash" />
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-7">
          <h1 className="text-3xl font-bold text-center mb-6">{tie ? "It's a tie!" : won ? 'You won!' : `${theirs?.name ?? 'Your opponent'} won`}</h1>
          <div className="flex flex-col sm:flex-row gap-4">{card(mine, '(you)', true)}{card(theirs, '', false)}</div>
          {!tie && mine && theirs && mine.score === theirs.score && (
            <p className="text-center text-sm text-[var(--bb-muted)] mt-4">Same score — the faster finish wins.</p>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-7">
          <h2 className="text-lg font-bold mb-4">By domain</h2>
          <table className="w-full text-[15px]">
            <thead><tr className="text-left text-[var(--bb-muted)] text-sm"><th className="pb-2 font-semibold">Domain</th><th className="pb-2 font-semibold text-right">You</th><th className="pb-2 font-semibold text-right">{theirs?.name ?? 'Opponent'}</th></tr></thead>
            <tbody>
              {domains.map(([domain, r]) => (
                <tr key={domain} className="border-t border-[#ececec]">
                  <td className="py-2">{domain}</td>
                  <td className="py-2 text-right font-semibold">{r.mine}/{r.total}</td>
                  <td className="py-2 text-right">{r.theirs}/{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-7">
          <h2 className="text-lg font-bold mb-4">Question by question</h2>
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 gap-y-1.5 text-[14px] items-center">
            <span className="text-[var(--bb-muted)] text-xs font-semibold">#</span>
            <span className="text-[var(--bb-muted)] text-xs font-semibold">Skill</span>
            <span className="text-[var(--bb-muted)] text-xs font-semibold text-center w-12">You</span>
            <span className="text-[var(--bb-muted)] text-xs font-semibold text-center w-12 truncate">{theirs?.name ?? 'Opp.'}</span>
            {questions.map((q, i) => (
              <React.Fragment key={q.id}>
                <span className="font-bold w-6">{i + 1}</span>
                <span className="truncate">{q.skill} <span className="text-[var(--bb-muted)]">· {q.difficulty}</span></span>
                <span className="flex justify-center w-12">{mine?.correct[i] ? <Check size={18} className="text-[var(--bb-correct)]" /> : <XIcon size={18} className="text-[var(--bb-wrong)]" />}</span>
                <span className="flex justify-center w-12">{theirs?.correct[i] ? <Check size={18} className="text-[var(--bb-correct)]" /> : <XIcon size={18} className="text-[var(--bb-wrong)]" />}</span>
              </React.Fragment>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {theirRematch && !myRematch && <span className="text-sm font-semibold text-[var(--bb-blue)]">{theirs?.name} wants a rematch!</span>}
          <button className="bb-secondary" onClick={onReview}>Review Answers</button>
          <button className="bb-primary" onClick={onRematch} disabled={Boolean(myRematch) || !opponentHere}>
            {myRematch ? 'Waiting for opponent…' : opponentHere ? 'Rematch' : 'Opponent left'}
          </button>
        </div>
      </main>
    </div>
  );
}

function ArenaContent() {
  const params = useSearchParams();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const nickname = useNickname();
  const storedId = usePlayerId();
  const playerId = storedId || '';
  const name = nickname || '';
  const ready = nickname !== null && storedId !== null; // đã đọc xong localStorage
  const [room, setRoom] = useState<Room | null>(null);
  const [match, setMatch] = useState<MatchStart | null>(null);
  const [offset, setOffset] = useState(0); // Date.now() - giờ server
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [end, setEnd] = useState<MatchEnd | null>(null);
  const [view, setView] = useState<'match' | 'results' | 'review'>('match');
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [fl, setFl] = useState<FlState | null>(null);
  const [flEnd, setFlEnd] = useState<FlEnd | null>(null);
  const [emotes, setEmotes] = useState<Emote[]>([]);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const code = params.get('room');

  useEffect(() => {
    if (!ready) return;
    if (!nickname) {
      router.replace(code ? `/?join=${code}` : '/');
      return;
    }
    const id = storedId!;

    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    const enter = () => {
      if (code) {
        socket.emit('room:join', { code, name: nickname, playerId: id }, (res: { error?: string; room?: Room }) => {
          if (res.error) setError(res.error);
          else if (res.room) setRoom(res.room);
        });
      } else if (params.get('new')) {
        const settings = {
          subject: params.get('subject'), domain: params.get('domain'), difficulty: params.get('difficulty'),
          questionCount: Number(params.get('count')), timeLimit: Number(params.get('minutes')), includeBluebook: params.get('bluebook') === '1',
          mode: params.get('mode'), turns: Number(params.get('turns')),
        };
        socket.emit('room:create', { name: nickname, playerId: id, settings }, (res: { error?: string; room?: Room }) => {
          if (res.error || !res.room) return setError(res.error || 'Could not create the room.');
          setRoom(res.room);
          router.replace(`/arena?room=${res.room.code}`);
        });
      } else {
        router.replace('/');
      }
    };
    // Kết nối lại (mất mạng, server ngủ dậy): vào lại phòng với cùng playerId
    socket.on('connect', enter);
    socket.on('connect_error', () => setError(prev => prev ?? 'Connecting to the game server… (it may take up to a minute to wake up)'));
    socket.on('room:update', (r: Room) => { setRoom(r); setError(null); });
    socket.on('match:start', (m: MatchStart) => {
      setOffset(Date.now() - m.serverNow);
      setMatch(m);
      setAnswers(m.answers || {});
      setSubmitted(m.finished);
      setEnd(null);
      setView('match');
    });
    socket.on('match:end', (e: MatchEnd | FlEnd) => {
      if ('mode' in e && e.mode === 'finish') setFlEnd(e);
      else { setEnd(e as MatchEnd); setView(v => (v === 'review' ? v : 'results')); }
    });
    socket.on('fl:state', (st: FlState) => {
      setOffset(Date.now() - st.serverNow);
      setFl(st);
      if (st.phase !== 'done') setFlEnd(null);
    });
    socket.on('room:emote', (e: Emote) => {
      if (mutedRef.current && e.playerId !== id) return;
      setEmotes(list => [...list.slice(-11), e]);
      setTimeout(() => setEmotes(list => list.filter(x => x.id !== e.id)), 3800);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // Chỉ kết nối một lần; khi tạo phòng xong URL đổi sang ?room= nhưng vẫn dùng socket này
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Đếm ngược trước khi bắt đầu
  const countdown = match ? Math.ceil((match.startedAt + offset - now) / 1000) : 0;
  useEffect(() => {
    if (!match || countdown <= 0) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [match, countdown]);

  const onAnswer = useCallback((index: number, value: string) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (value) next[index] = value;
      else delete next[index];
      return next;
    });
    socketRef.current?.emit('match:answer', { index, answer: value });
  }, []);

  const finish = useCallback(() => {
    setSubmitted(true);
    socketRef.current?.emit('match:finish');
  }, []);

  const leave = () => {
    socketRef.current?.emit('room:leave');
    router.push('/');
  };

  const sendEmote = useCallback((text: string) => socketRef.current?.emit('room:emote', { text }), []);
  const flSend = useCallback((event: string, data?: object) => socketRef.current?.emit(event, data), []);

  const inviteLink = typeof window !== 'undefined' && room ? `${window.location.origin}/arena?room=${room.code}` : '';
  const me = room?.players.find(p => p.playerId === playerId);
  const opponent = room?.players.find(p => p.playerId !== playerId);

  if (error && !room) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#f7f7f7] p-4">
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgb(0_0_0/0.12)] p-8 max-w-md text-center">
          <p className="font-semibold mb-6" role="alert">{error}</p>
          <Link href="/" className="bb-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return <div className="min-h-dvh flex items-center justify-center text-[var(--bb-muted)] font-semibold">Connecting…</div>;
  }

  const emoteUi = (dockClass?: string, top?: number) => (
    <>
      <EmoteLayer emotes={emotes} me={playerId} top={top} />
      {opponent && <EmoteDock onSend={sendEmote} muted={muted} onToggleMute={() => setMuted(m => !m)} className={dockClass} />}
    </>
  );

  if (room.settings.mode === 'finish') {
    if (flEnd) {
      return <>{<FinishLineResults end={flEnd} me={playerId} players={room.players} onRematch={() => socketRef.current?.emit('match:rematch')} />}{emoteUi()}</>;
    }
    if (room.state === 'waiting' || !fl) return <><Lobby room={room} me={playerId} inviteLink={inviteLink} onLeave={leave} />{emoteUi()}</>;
    return <><FinishLineGame s={fl} offset={offset} me={me} opp={opponent} send={flSend} onLeave={leave} />{emoteUi(undefined, 96)}</>;
  }

  if (end && view === 'results') {
    return (
      <>
        <Results end={end} room={room} me={playerId} questions={match?.questions ?? []} onReview={() => setView('review')}
          onRematch={() => socketRef.current?.emit('match:rematch')} />
        {emoteUi()}
      </>
    );
  }

  if (end && view === 'review' && match) {
    const mine = end.results.find(r => r.playerId === playerId);
    return (
      <TestShell
        title={`Review: ${SECTION_OF[room.settings.subject]}`}
        questions={match.questions}
        answers={mine?.answers ?? answers}
        studentName={name}
        results={end.review.map((key, i) => ({ key, correct: Boolean(mine?.correct[i]) }))}
        onSubmit={() => setView('results')}
        onExit={() => setView('results')}
        exitLabel="Back to Results"
        reviewNote={<p>Select a question to review it. Select <strong>Next</strong> to go back to the results.</p>}
      />
    );
  }

  if (room.state === 'waiting' || !match) {
    return <><Lobby room={room} me={playerId} inviteLink={inviteLink} onLeave={leave} />{emoteUi()}</>;
  }

  return (
    <>
      <TestShell
        key={match.startedAt}
        title={`Section ${room.settings.subject === 'Verbal' ? 1 : 2}, Module 1: ${SECTION_OF[room.settings.subject]}`}
        questions={match.questions}
        answers={answers}
        onAnswer={submitted ? undefined : onAnswer}
        endsAt={match.endsAt + offset}
        onTimeUp={finish}
        onSubmit={finish}
        submitConfirm="Your answers will be locked in. Results appear when both players have submitted."
        studentName={name}
        topBar={<TopBar me={me} opponent={opponent} total={match.questions.length} code={room.code} />}
        onExit={leave}
        exitLabel="Leave Match"
        exitConfirm="Leaving submits your current answers and ends the match for you."
      />
      {emoteUi('bottom-24 right-4', 120)}
      {countdown > 0 && (
        <div className="bb-modal-backdrop">
          <div className="text-center text-white">
            <p className="text-xl font-semibold mb-2">Match starts in</p>
            <p className="text-[96px] font-bold leading-none tabular-nums">{countdown}</p>
            <p className="mt-4 text-white/80">{me?.name} vs {opponent?.name}</p>
          </div>
        </div>
      )}
      {submitted && !end && (
        <div className="bb-modal-backdrop">
          <div className="bb-modal text-center">
            <div className="w-12 h-12 border-4 border-[var(--bb-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <h2 className="text-2xl font-bold mb-2">Answers submitted</h2>
            <p className="text-[var(--bb-muted)]">
              {opponent?.finished ? 'Your opponent has finished too. Tallying results…' : `Waiting for ${opponent?.name ?? 'your opponent'} to finish (${opponent?.answered ?? 0}/${match.questions.length} answered).`}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ArenaContent />
    </Suspense>
  );
}
