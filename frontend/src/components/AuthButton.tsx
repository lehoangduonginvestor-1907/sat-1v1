'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { authEnabled, googleAvatar, googleName, signInWithGoogle, signOut, useAuth } from '@/lib/supabase';

// Nút đăng nhập Google + link bảng xếp hạng, dùng trên header trang chủ
export default function AuthButton() {
  const { loading, session } = useAuth();
  if (!authEnabled) return null;

  const avatar = googleAvatar(session);
  return (
    <div className="flex items-center gap-4 text-[15px]">
      <Link href="/leaderboard" className="flex items-center gap-1.5 font-semibold hover:underline">
        <Trophy size={16} /> Leaderboard
      </Link>
      {loading ? (
        <span className="w-24" />
      ) : session ? (
        <div className="flex items-center gap-2">
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full" />
          )}
          <span className="hidden sm:inline text-[var(--bb-muted)] max-w-[160px] truncate" title={session.user.email}>{googleName(session)}</span>
          <button onClick={signOut} className="font-semibold text-[var(--bb-muted)] hover:underline">Sign out</button>
        </div>
      ) : (
        <button onClick={signInWithGoogle} className="bb-secondary !py-1.5 !px-3">Sign in with Google</button>
      )}
    </div>
  );
}
