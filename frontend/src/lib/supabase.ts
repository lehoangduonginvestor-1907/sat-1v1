import { useEffect, useState } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

// Đăng nhập Google qua Supabase Auth. Thiếu biến môi trường thì tắt: mọi người chơi như khách.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const authEnabled = Boolean(SUPABASE_URL && KEY);

let client: SupabaseClient | null | undefined;

// Chỉ tạo client trên trình duyệt (cần localStorage để giữ phiên đăng nhập)
export function getSupabase(): SupabaseClient | null {
  if (client === undefined) client = authEnabled && typeof window !== 'undefined' ? createClient(SUPABASE_URL!, KEY!) : null;
  return client;
}

export interface AuthState { loading: boolean; session: Session | null }

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: authEnabled, session: null });
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => { if (alive) setState({ loading: false, session: data.session }); });
    const { data } = sb.auth.onAuthStateChange((_event, session) => { if (alive) setState({ loading: false, session }); });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return state;
}

export function signInWithGoogle() {
  getSupabase()?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
}

export function signOut() {
  getSupabase()?.auth.signOut();
}

// Token mới nhất (getSession tự làm mới khi sắp hết hạn) để gửi lên game server
export async function getAccessToken(): Promise<string | undefined> {
  const sb = getSupabase();
  if (!sb) return undefined;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token;
}

export function googleName(session: Session | null): string {
  const meta = session?.user.user_metadata || {};
  return String(meta.full_name || meta.name || '');
}

export function googleAvatar(session: Session | null): string | null {
  const meta = session?.user.user_metadata || {};
  return meta.avatar_url || meta.picture || null;
}
