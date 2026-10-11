'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Volume2, VolumeX } from 'lucide-react';

export interface Emote { id: string; playerId: string; name: string; text: string }

const EMOJIS = ['😂', '🔥', '😎', '😱', '🤯', '💀', '👀', '🐢', '👏', '😤', '🫡', '🤡'];
const PHRASES = [
  'Too easy 😎', 'Is that all you got?', 'Speed up, turtle 🐢', 'Calculated.', 'Lucky guess…',
  "I'm coming for you!", 'Steal incoming 👀', 'Watch this ⭐', 'Nice one 👏', 'GG',
];
const COOLDOWN_MS = 1200;

// Chỉ gồm emoji (không có chữ) thì hiển thị to
const emojiOnly = (text: string) => /^(\p{Extended_Pictographic}|\p{Emoji_Component}|\s|‍|️)+$/u.test(text) && !/[0-9#*]/.test(text);

// Bong bóng emote nổi lên: của mình bên trái, của đối thủ bên phải
export function EmoteLayer({ emotes, me, top = 64 }: { emotes: Emote[]; me: string; top?: number }) {
  const side = (mine: boolean) => emotes.filter(e => (e.playerId === me) === mine).slice(-4);
  const column = (mine: boolean) => (
    <div className={`fixed z-[70] flex flex-col gap-2 pointer-events-none max-w-[min(320px,45vw)] ${mine ? 'left-4 items-start' : 'right-4 items-end'}`} style={{ top }}>
      {side(mine).map(e => (
        <div key={e.id} className={`emote-pop rounded-2xl px-4 py-2 shadow-[0_6px_20px_rgb(0_0_0/0.25)] ${mine ? 'bg-[var(--bb-blue)] text-white rounded-bl-sm' : 'bg-white text-[var(--bb-ink)] border-2 border-[#ff8a7a] rounded-br-sm'}`}>
          {!mine && <div className="text-[11px] font-bold uppercase tracking-wide text-[#d4573f]">{e.name}</div>}
          <div className={emojiOnly(e.text) ? 'text-[40px] leading-tight' : 'text-[16px] font-semibold'}>{e.text}</div>
        </div>
      ))}
    </div>
  );
  return <>{column(true)}{column(false)}</>;
}

export function EmoteDock({ onSend, muted, onToggleMute, className = 'bottom-6 right-6' }: {
  onSend: (text: string) => void; muted: boolean; onToggleMute: () => void; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const [cooling, setCooling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const send = (text: string) => {
    if (cooling || !text.trim()) return;
    onSend(text.trim());
    setCooling(true);
    timer.current = setTimeout(() => setCooling(false), COOLDOWN_MS);
  };

  // Phím tắt: Alt+1..9 gửi nhanh emoji
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || !/^[1-9]$/.test(e.key)) return;
      e.preventDefault();
      send(EMOJIS[Number(e.key) - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={`fixed z-[65] ${className}`}>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute bottom-14 right-0 w-[min(340px,calc(100vw-32px))] bg-white rounded-2xl shadow-[0_10px_40px_rgb(0_0_0/0.3)] p-3" role="dialog" aria-label="Emotes and trash talk">
            <div className="grid grid-cols-6 gap-1 mb-2">
              {EMOJIS.map((e, i) => (
                <button key={e} onClick={() => send(e)} disabled={cooling} title={i < 9 ? `Alt+${i + 1}` : undefined}
                  className="text-[26px] h-11 rounded-lg hover:bg-[var(--bb-bar)] disabled:opacity-40">{e}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {PHRASES.map(p => (
                <button key={p} onClick={() => send(p)} disabled={cooling}
                  className="text-[13px] font-semibold px-2.5 py-1 rounded-full border-[1.5px] border-[#d0d0d0] hover:border-[var(--bb-blue)] hover:text-[var(--bb-blue)] disabled:opacity-40">{p}</button>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); send(custom); setCustom(''); }}>
              <input value={custom} onChange={e => setCustom(e.target.value.slice(0, 60))} placeholder="Say something…" aria-label="Custom message"
                className="flex-1 min-w-0 border-[1.5px] border-[#c4c4c4] rounded-full px-3 py-1.5 text-[14px] outline-none focus:border-[var(--bb-blue)]" />
              <button type="submit" className="bb-primary !min-w-0 !px-3 !py-1.5" disabled={cooling || !custom.trim()} aria-label="Send"><Send size={16} /></button>
            </form>
            <button onClick={onToggleMute} className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--bb-muted)] hover:underline">
              {muted ? <><VolumeX size={15} /> Opponent muted (tap to unmute)</> : <><Volume2 size={15} /> Mute opponent</>}
            </button>
          </div>
        </>
      )}
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Emotes and trash talk"
        className="relative w-12 h-12 rounded-full bg-[var(--bb-blue)] text-white shadow-[0_4px_16px_rgb(0_0_0/0.3)] grid place-items-center hover:bg-[var(--bb-blue-hover)]">
        <MessageCircle size={22} />
      </button>
    </div>
  );
}
