'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crown } from 'lucide-react';
import { BACKEND_URL } from '@/lib/api';
import { useAuth } from '@/lib/supabase';
import AuthButton from '@/components/AuthButton';

interface Row { id: string; name: string; avatar_url: string | null; elo: number; games: number; wins: number; losses: number; draws: number }
type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; enabled: boolean; players: Row[] };

export default function LeaderboardPage() {
  const { session } = useAuth();
  const [load, setLoad] = useState<Load>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    fetch(`${BACKEND_URL}/api/leaderboard`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        if (alive) setLoad({ status: 'ready', enabled: Boolean(data.enabled), players: data.players || [] });
      })
      .catch(err => { if (alive) setLoad({ status: 'error', message: err.message || 'Could not load the leaderboard.' }); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-dvh bg-[#f7f7f7]">
      <header className="bg-white">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1 font-semibold hover:underline"><ArrowLeft size={18} /> Home</Link>
            <span className="text-xl font-bold">Leaderboard</span>
          </div>
          <AuthButton />
        </div>
        <div className="bb-dash" />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <section className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-7">
          <p className="text-sm text-[var(--bb-muted)] mb-5">
            1v1 Elo. Every match between two signed-in players counts; Finish Line matches move ratings half as much as classic ones.
          </p>
          {load.status === 'loading' && <p className="text-[var(--bb-muted)] font-semibold">Loading… (the server may take up to a minute to wake up)</p>}
          {load.status === 'error' && <p className="font-semibold" role="alert">{load.message}</p>}
          {load.status === 'ready' && !load.enabled && <p className="font-semibold">Elo is not set up on the server yet.</p>}
          {load.status === 'ready' && load.enabled && load.players.length === 0 && <p className="text-[var(--bb-muted)]">No players yet. Sign in with Google and play a 1v1 match.</p>}
          {load.status === 'ready' && load.players.length > 0 && (
            <table className="w-full text-[15px]">
              <thead>
                <tr className="text-left text-[var(--bb-muted)] text-sm">
                  <th className="pb-2 font-semibold w-10">#</th>
                  <th className="pb-2 font-semibold">Player</th>
                  <th className="pb-2 font-semibold text-right">Elo</th>
                  <th className="pb-2 font-semibold text-right">W / L / D</th>
                  <th className="pb-2 font-semibold text-right hidden sm:table-cell">Win %</th>
                </tr>
              </thead>
              <tbody>
                {load.players.map((p, i) => (
                  <tr key={p.id} className={`border-t border-[#ececec] ${p.id === session?.user.id ? 'bg-[var(--bb-blue-soft)]' : ''}`}>
                    <td className="py-2.5 font-bold">{i === 0 && p.games > 0 ? <Crown size={18} className="text-[#d4a000]" /> : i + 1}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {p.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.avatar_url} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full" />
                          : <span className="w-7 h-7 rounded-full bg-[var(--bb-bar)]" />}
                        <span className="font-semibold truncate">{p.name}</span>
                        {p.id === session?.user.id && <span className="text-[var(--bb-muted)] text-sm">(you)</span>}
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-bold tabular-nums">{p.elo}</td>
                    <td className="py-2.5 text-right tabular-nums">{p.wins} / {p.losses} / {p.draws}</td>
                    <td className="py-2.5 text-right tabular-nums hidden sm:table-cell">{p.games ? `${Math.round((p.wins / p.games) * 100)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
