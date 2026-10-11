export type Section = 'Reading and Writing' | 'Math';
export type Subject = 'Verbal' | 'Math';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

// Câu hỏi như server gửi xuống (không kèm đáp án)
export interface Question {
  id: string;
  section: Section;
  domain: string;
  skill: string;
  difficulty: Difficulty;
  type: 'mcq' | 'spr';
  stimulus: string; // HTML
  stem: string; // HTML
  options: string[]; // HTML, 4 lựa chọn (rỗng với câu tự điền)
}

// Đáp án + lời giải, chỉ có sau khi nộp bài / kiểm tra câu
export interface AnswerKey {
  id: string;
  type: 'mcq' | 'spr';
  correctAnswer?: number;
  acceptedAnswers?: string[];
  rationale: string;
}

export interface GradeResult extends AnswerKey {
  answer: string;
  correct: boolean;
}

// Câu trả lời theo vị trí câu: chữ cái A-D hoặc chuỗi tự điền
export type Answers = Record<number, string>;

export const SECTION_OF: Record<Subject, Section> = { Verbal: 'Reading and Writing', Math: 'Math' };

export function correctAnswerText(key: AnswerKey): string {
  return key.type === 'spr' ? (key.acceptedAnswers || []).join(', ') : 'ABCD'[key.correctAnswer ?? 0];
}
