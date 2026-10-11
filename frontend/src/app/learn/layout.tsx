import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn · SAT Arena',
  description: 'Lessons for every Digital SAT Reading, Writing and Math question type, with practice on official College Board questions.',
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
