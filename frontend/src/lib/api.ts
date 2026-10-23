import type { GradeResult, Question } from './types';

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://sat-1v1.onrender.com';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed (${res.status})`);
  return res.json();
}

export interface SkillStats { total: number; Easy: number; Medium: number; Hard: number }
export interface BankStats {
  [section: string]: {
    total: number;
    bluebook: number;
    exams: Record<string, number>; // câu đề thi thật, chỉ có khi chọn đề
    domains: Record<string, { total: number; skills: Record<string, SkillStats> }>;
  };
}
export interface Blueprint { size: number; minutes: number; domains: Record<string, number>; skillOrder?: string[] }

export async function fetchMeta(): Promise<{ stats: BankStats; blueprints: Record<string, Blueprint> }> {
  const res = await fetch(`${BACKEND_URL}/api/meta`);
  if (!res.ok) throw new Error(`/api/meta failed (${res.status})`);
  return res.json();
}

export interface QuestionFilter {
  subject: 'Verbal' | 'Math' | 'Any'; // 'Any' chỉ dùng kèm onlyIds
  domains?: string[];
  skills?: string[];
  topics?: string[]; // ưu tiên câu đúng chủ đề bài học (thiếu thì bù câu cùng skill)
  difficulties?: string[];
  includeBluebook?: boolean;
  exam?: string; // chỉ lấy câu của đề thi thật này
  excludeIds?: string[];
  onlyIds?: string[];
  count: number;
  format?: 'module' | 'random';
}

export async function fetchQuestions(filter: QuestionFilter): Promise<Question[]> {
  return (await post<{ questions: Question[] }>('/api/questions', filter)).questions;
}

export async function gradeAnswers(answers: { id: string; answer: string }[]): Promise<GradeResult[]> {
  return (await post<{ results: GradeResult[] }>('/api/grade', { answers })).results;
}

export async function reportQuestion(payload: { questionId: string; reason: string; description?: string; studentName?: string }): Promise<void> {
  await post('/api/report-question', payload);
}
