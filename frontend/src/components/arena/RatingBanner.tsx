'use client';

export interface RatingChange { before: number; after: number; delta: number }
export type MatchRating = Record<string, RatingChange>;

// Thông báo Elo thay đổi sau trận (chỉ hiện khi cả hai đã đăng nhập)
export default function RatingBanner({ rating, me }: { rating: MatchRating | null; me: string }) {
  const mine = rating?.[me];
  if (!mine) return null;
  const up = mine.delta > 0;
  const color = up ? 'var(--bb-correct)' : mine.delta < 0 ? 'var(--bb-wrong)' : 'var(--bb-muted)';
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-white rounded-full shadow-[0_2px_16px_rgb(0_0_0/0.18)] px-5 py-2 text-[15px] font-semibold flex items-center gap-2">
      <span className="text-[var(--bb-muted)]">Elo</span>
      <span className="tabular-nums">{mine.before} → {mine.after}</span>
      <span className="tabular-nums" style={{ color }}>({up ? '+' : ''}{mine.delta})</span>
    </div>
  );
}
