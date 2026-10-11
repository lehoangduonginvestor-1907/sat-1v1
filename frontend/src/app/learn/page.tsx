'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { allLessons, COURSES, lessonKey } from '@/lib/learn';
import { useLearnProgress } from '@/lib/storage';
import { StatusIcon } from '@/components/learn/LessonView';

export default function LearnPage() {
  const progress = useLearnProgress();

  return (
    <div className="min-h-dvh bg-[#f7f7f7]">
      <header className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1 font-semibold hover:underline"><ArrowLeft size={18} /> Home</Link>
          <span className="text-xl font-bold">Learn</span>
        </div>
        <div className="bb-dash" />
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <section>
          <h1 className="text-[28px] font-bold mb-2">Lessons</h1>
          <p className="text-[var(--bb-muted)] max-w-3xl">
            Step-by-step lessons for every Reading, Writing and Math question type, each followed by practice on official College Board questions.
            The lessons follow the chapter order of Erica Meltzer&apos;s <em>The Ultimate Guide to SAT Grammar</em> and <em>The Complete Guide to Digital SAT Reading</em>,
            and Nielson Phu&apos;s <em>The College Panda&apos;s SAT Math</em>, rewritten in our own words with original examples. Page numbers point to those books if you want to read further.
          </p>
        </section>

        {COURSES.map(course => {
          const lessons = allLessons(course);
          const done = lessons.filter(l => progress?.[lessonKey(course.slug, l.slug)]?.done).length;
          const nextUp = lessons.find(l => !progress?.[lessonKey(course.slug, l.slug)]?.done) || lessons[0];
          return (
            <section key={course.slug} className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div className="max-w-2xl">
                  <h2 className="text-[22px] font-bold mb-1">{course.title}</h2>
                  <p className="text-[15px] text-[var(--bb-muted)]">{course.description}</p>
                </div>
                <Link href={`/learn/${course.slug}/${nextUp.slug}`} className="bb-primary gap-1">
                  {done === 0 ? 'Start' : done === lessons.length ? 'Review' : 'Continue'} <ArrowRight size={16} />
                </Link>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-2.5 rounded-full bg-[#e6e6e6] overflow-hidden">
                  <div className="h-full bg-[var(--bb-correct)]" style={{ width: `${(done / lessons.length) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-[var(--bb-muted)]">{done}/{lessons.length} lessons</span>
              </div>

              <div className="space-y-6">
                {course.units.map(unit => (
                  <div key={unit.title}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--bb-muted)] mb-2">{unit.title}</h3>
                    <ul className="divide-y divide-[#ececec] border-y border-[#ececec]">
                      {unit.lessons.map(l => {
                        const p = progress?.[lessonKey(course.slug, l.slug)];
                        const last = p?.practice?.[p.practice.length - 1];
                        return (
                          <li key={l.slug}>
                            <Link href={`/learn/${course.slug}/${l.slug}`} className="flex items-start gap-3 py-3 px-1 hover:bg-[#fafafa]">
                              <span className="mt-0.5"><StatusIcon progress={p} /></span>
                              <span className="flex-1 min-w-0">
                                <span className="block font-semibold">{l.title}</span>
                                <span className="block text-[14px] text-[var(--bb-muted)]">{l.summary}</span>
                              </span>
                              <span className="hidden sm:flex flex-col items-end gap-0.5 text-[13px] text-[var(--bb-muted)] shrink-0">
                                <span className="flex items-center gap-1"><Clock size={13} /> {l.minutes} min</span>
                                {last && <span className="font-semibold text-[var(--bb-ink)]">Practice {last.correct}/{last.total}</span>}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
