import fs from 'node:fs/promises';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allLessons, COURSES, findLesson } from '@/lib/learn';
import { parseLesson } from '@/lib/learnParse';
import LessonView from '@/components/learn/LessonView';

type Params = { course: string; lesson: string };

// Mọi bài học được dựng sẵn lúc build; đường dẫn lạ → 404
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return COURSES.flatMap(c => allLessons(c).map(l => ({ course: c.slug, lesson: l.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { course, lesson } = await params;
  const found = findLesson(course, lesson);
  return found ? { title: `${found.lesson.title} · ${found.course.short} · SAT Arena`, description: found.lesson.summary } : {};
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { course, lesson } = await params;
  if (!findLesson(course, lesson)) notFound();
  const source = await fs.readFile(path.join(process.cwd(), 'src', 'content', 'learn', course, `${lesson}.md`), 'utf8');
  return <LessonView courseSlug={course} lessonSlug={lesson} blocks={parseLesson(source)} />;
}
