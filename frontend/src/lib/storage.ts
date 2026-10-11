import { useSyncExternalStore } from 'react';
import type { GradeResult, Question } from './types';

// localStorage có thể bị chặn (chế độ ẩn danh...): mọi thao tác đều bọc try/catch

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Bỏ qua: chỉ mất tiện ích ghi nhớ
  }
  listeners.forEach(l => l());
}

// Đọc localStorage trong component: null khi đang render phía server / lúc hydrate
function useStored<T>(read: () => T): T | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

// ---- Tên & định danh người chơi ----

// Lưu dạng chuỗi thô (giữ tương thích với bản cũ)
export function getNickname(): string {
  return readRaw('sat_nickname') || '';
}

export function setNickname(name: string) {
  write('sat_nickname', name);
}

export const useNickname = () => useStored(getNickname);

// Định danh cố định của người chơi: dùng để vào lại phòng khi tải lại trang
export function getPlayerId(): string {
  let id = readRaw('sat_player_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem('sat_player_id', id);
    } catch {
      // Không lưu được: mỗi lần tải trang là một người chơi mới
    }
  }
  return id;
}

export const usePlayerId = () => useStored(getPlayerId);

// ---- Lịch sử luyện tập ----

export interface Attempt {
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  attempts: number;
  correct: boolean; // kết quả lần gần nhất
  everWrong: boolean;
  lastAnswer: string;
  ts: number;
}

export type History = Record<string, Attempt>;
const HISTORY_KEY = 'sat_history_v1';
let cache: { raw: string | null; value: History } = { raw: null, value: {} };

export function getHistory(): History {
  const raw = readRaw(HISTORY_KEY);
  if (raw !== cache.raw) {
    let value: History = {};
    try {
      value = raw ? JSON.parse(raw) : {};
    } catch {
      value = {};
    }
    cache = { raw, value };
  }
  return cache.value;
}

export const useHistory = () => useStored(getHistory);

export function recordResults(questions: Question[], results: GradeResult[]) {
  const history = { ...getHistory() };
  const byId = new Map(questions.map(q => [q.id, q]));
  for (const r of results) {
    const q = byId.get(r.id);
    if (!q || !r.answer) continue;
    const prev = history[r.id];
    history[r.id] = {
      section: q.section,
      domain: q.domain,
      skill: q.skill,
      difficulty: q.difficulty,
      attempts: (prev?.attempts || 0) + 1,
      correct: r.correct,
      everWrong: Boolean(prev?.everWrong) || !r.correct,
      lastAnswer: r.answer,
      ts: Date.now(),
    };
  }
  write(HISTORY_KEY, JSON.stringify(history));
}
