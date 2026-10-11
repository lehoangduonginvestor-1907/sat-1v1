'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Trash2 } from 'lucide-react';
import TestShell from '@/components/bluebook/TestShell';
import ReportView from '@/components/report/ReportView';
import Modal from '@/components/bluebook/Modal';
import { useNickname } from '@/lib/storage';
import { deleteReport, formatDate, formatDuration, pct, PracticeReport, reportStats, useReports } from '@/lib/report';

function SavedReport({ report }: { report: PracticeReport }) {
  const [reviewing, setReviewing] = useState<number | null>(null);
  const name = useNickname() || 'Student';
  const missed = report.modules.flatMap(m => m.questions.filter((_, i) => !m.results[i]?.correct).map(q => q.id));

  if (reviewing !== null) {
    const m = report.modules[reviewing];
    return (
      <TestShell
        title={m.title}
        questions={m.questions}
        answers={m.answers}
        studentName={name}
        results={m.results.map(x => (x ? { key: x, correct: x.correct } : undefined))}
        onSubmit={() => setReviewing(null)}
        onExit={() => setReviewing(null)}
        exitLabel="Back to Report"
        reviewNote={<p>Select a question to review it. Select <strong>Next</strong> to go back to your report.</p>}
        shareLinks
      />
    );
  }

  return (
    <ReportView report={report} back={{ href: '/reports', label: 'Reports' }} onReview={setReviewing}
      actions={<>
        {missed.length > 0 && <Link href={`/practice?ids=${missed.slice(0, 100).join(',')}`} className="bb-secondary">Redo Mistakes ({missed.length})</Link>}
        <Link href="/practice" className="bb-primary">New Practice</Link>
      </>} />
  );
}

function ReportList({ reports }: { reports: PracticeReport[] }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<PracticeReport | null>(null);
  return (
    <div className="min-h-dvh bg-[#f7f7f7]">
      <header className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1 font-semibold hover:underline"><ArrowLeft size={18} /> Home</Link>
          <span className="text-xl font-bold">Practice Reports</span>
        </div>
        <div className="bb-dash" />
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-[var(--bb-muted)] mb-5">
          A report is saved on this device after every practice set (up to your 30 most recent). Open one to see every question with explanations and your skill breakdown, or export it.
        </p>
        {reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] p-8 text-center">
            <p className="font-semibold mb-4">No reports yet. Finish a practice set to get your first one.</p>
            <Link href="/practice" className="bb-primary">Start Practicing</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-[0_2px_12px_rgb(0_0_0/0.1)] divide-y divide-[#ececec] overflow-hidden">
            {reports.map(r => {
              const s = reportStats(r).overall;
              return (
                <div key={r.id} className="flex items-center gap-2 pr-3 hover:bg-[#fafafa]">
                  <button className="flex-1 min-w-0 flex items-center gap-4 px-5 py-4 text-left" onClick={() => router.push(`/reports?id=${r.id}`)}>
                    <span className={`w-14 shrink-0 text-center text-[18px] font-bold tabular-nums ${pct(s) >= 80 ? 'text-[var(--bb-correct)]' : pct(s) < 50 ? 'text-[var(--bb-wrong)]' : ''}`}>{pct(s)}%</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{r.title}</span>
                      <span className="block text-[13px] text-[var(--bb-muted)]">
                        {formatDate(r.ts)} · {s.correct}/{s.total} correct{s.seconds ? ` · ${formatDuration(s.seconds)}` : ''}
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-[var(--bb-muted)]" />
                  </button>
                  <button className="p-2 rounded-full text-[var(--bb-muted)] hover:text-[var(--bb-wrong)] hover:bg-[var(--bb-wrong-soft)]"
                    onClick={() => setConfirm(r)} aria-label={`Delete report ${r.title}`}><Trash2 size={17} /></button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      {confirm && (
        <Modal title="Delete this report?" confirmLabel="Delete" onConfirm={() => { deleteReport(confirm.id); setConfirm(null); }} onCancel={() => setConfirm(null)}>
          {confirm.title}, {formatDate(confirm.ts)}. Your answer history for these questions is kept.
        </Modal>
      )}
    </div>
  );
}

function ReportsContent() {
  const id = useSearchParams().get('id');
  const reports = useReports();
  if (!reports) return <div className="min-h-dvh bg-[#f7f7f7]" />;
  if (id) {
    const report = reports.find(r => r.id === id);
    if (report) return <SavedReport key={report.id} report={report} />;
  }
  return <ReportList reports={reports} />;
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ReportsContent />
    </Suspense>
  );
}
