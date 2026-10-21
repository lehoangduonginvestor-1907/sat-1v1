-- Chạy một lần trong Supabase: Dashboard -> SQL Editor -> New query -> dán toàn bộ -> Run.
-- Bảng chỉ được truy cập qua backend (khoá secret); RLS bật và không có policy nên trình duyệt không đọc/ghi trực tiếp được.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Player',
  avatar_url text,
  elo integer not null default 1000,
  games integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  mode text not null,
  player1 uuid not null references public.profiles (id) on delete cascade,
  player2 uuid not null references public.profiles (id) on delete cascade,
  score1 integer not null,
  score2 integer not null,
  winner uuid references public.profiles (id) on delete cascade,
  elo1_before integer not null,
  elo1_after integer not null,
  elo2_before integer not null,
  elo2_after integer not null,
  settings jsonb,
  created_at timestamptz not null default now()
);

create index if not exists matches_player1_idx on public.matches (player1, created_at desc);
create index if not exists matches_player2_idx on public.matches (player2, created_at desc);

alter table public.profiles enable row level security;
alter table public.matches enable row level security;

-- Ghi một trận và cập nhật Elo hai người trong cùng một transaction
create or replace function public.record_match(
  p_mode text, p1 uuid, p2 uuid, s1 integer, s2 integer, p_winner uuid,
  e1_before integer, e1_after integer, e2_before integer, e2_after integer, p_settings jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into matches (mode, player1, player2, score1, score2, winner, elo1_before, elo1_after, elo2_before, elo2_after, settings)
  values (p_mode, p1, p2, s1, s2, p_winner, e1_before, e1_after, e2_before, e2_after, p_settings);

  update profiles set
    elo = e1_after,
    games = games + 1,
    wins = wins + coalesce(p_winner = p1, false)::int,
    losses = losses + coalesce(p_winner = p2, false)::int,
    draws = draws + (p_winner is null)::int
  where id = p1;

  update profiles set
    elo = e2_after,
    games = games + 1,
    wins = wins + coalesce(p_winner = p2, false)::int,
    losses = losses + coalesce(p_winner = p1, false)::int,
    draws = draws + (p_winner is null)::int
  where id = p2;
end;
$$;

revoke execute on function public.record_match(text, uuid, uuid, integer, integer, uuid, integer, integer, integer, integer, jsonb) from public, anon, authenticated;
grant execute on function public.record_match(text, uuid, uuid, integer, integer, uuid, integer, integer, integer, integer, jsonb) to service_role;
