import { useSyncExternalStore } from 'react';
import type { Answers, GradeResult, Question } from './types';
import { correctAnswerText } from './types';

// ---- Báo cáo sau mỗi phiên luyện tập ----

// Thứ tự domain / skill như trong College Board Question Bank
export const CB_ORDER = [
  'Craft and Structure', 'Words in Context', 'Text Structure and Purpose', 'Cross-Text Connections',
  'Information and Ideas', 'Central Ideas and Details', 'Command of Evidence', 'Inferences',
  'Standard English Conventions', 'Boundaries', 'Form, Structure, and Sense',
  'Expression of Ideas', 'Rhetorical Synthesis', 'Transitions',
  'Algebra', 'Linear Equations in One Variable', 'Linear Functions', 'Linear Equations in Two Variables',
  'Systems of Linear Equations', 'Linear Inequalities',
  'Advanced Math', 'Nonlinear Functions', 'Nonlinear Equations and Systems', 'Equivalent Expressions',
  'Problem-Solving and Data Analysis', 'Ratios, Rates, Proportions, and Units', 'Percentages', 'One-Variable Data',
  'Two-Variable Data', 'Probability', 'Sample Statistics and Margin of Error', 'Evaluating Statistical Claims',
  'Geometry and Trigonometry', 'Area and Volume', 'Lines, Angles, and Triangles', 'Right Triangles and Trigonometry', 'Circles',
];

export interface ReportModule {
  title: string;
  questions: Question[];
  answers: Answers;
  results: (GradeResult | undefined)[];
  seconds?: number[]; // thời gian ở từng câu (giây)
}

export interface PracticeReport {
  id: string;
  ts: number; // lúc nộp bài
  title: string;
  adaptive: string | null;
  modules: ReportModule[];
}

export type Outcome = 'correct' | 'incorrect' | 'omitted';

export interface ReportItem {
  module: number;
  index: number; // vị trí trong module
  question: Question;
  answer: string;
  result?: GradeResult;
  outcome: Outcome;
  seconds: number;
}

export interface Tally { correct: number; incorrect: number; omitted: number; total: number; seconds: number }

export interface ReportStats {
  overall: Tally;
  domains: { name: string; tally: Tally; skills: { name: string; tally: Tally }[] }[];
  difficulties: { name: string; tally: Tally }[];
  items: ReportItem[];
}

const emptyTally = (): Tally => ({ correct: 0, incorrect: 0, omitted: 0, total: 0, seconds: 0 });

function add(t: Tally, item: ReportItem) {
  t[item.outcome]++;
  t.total++;
  t.seconds += item.seconds;
}

export const pct = (t: Tally) => (t.total ? Math.round((t.correct / t.total) * 100) : 0);

export function reportItems(report: PracticeReport): ReportItem[] {
  return report.modules.flatMap((m, mi) => m.questions.map((question, index) => {
    const result = m.results[index];
    const answer = m.answers[index] || '';
    const outcome: Outcome = result?.correct ? 'correct' : answer ? 'incorrect' : 'omitted';
    return { module: mi, index, question, answer, result, outcome, seconds: Math.round(m.seconds?.[index] || 0) };
  }));
}

export function reportStats(report: PracticeReport): ReportStats {
  const items = reportItems(report);
  const overall = emptyTally();
  const domains = new Map<string, { tally: Tally; skills: Map<string, Tally> }>();
  const difficulties = new Map<string, Tally>(['Easy', 'Medium', 'Hard'].map(d => [d, emptyTally()]));
  for (const item of items) {
    const q = item.question;
    add(overall, item);
    const d = domains.get(q.domain) || { tally: emptyTally(), skills: new Map() };
    add(d.tally, item);
    const s = d.skills.get(q.skill) || emptyTally();
    add(s, item);
    d.skills.set(q.skill, s);
    domains.set(q.domain, d);
    const diff = difficulties.get(q.difficulty) || emptyTally();
    add(diff, item);
    difficulties.set(q.difficulty, diff);
  }
  const rank = (name: string) => (CB_ORDER.includes(name) ? CB_ORDER.indexOf(name) : CB_ORDER.length);
  const sorted = <T,>(entries: [string, T][]) => entries.sort(([a], [b]) => rank(a) - rank(b));
  return {
    overall,
    items,
    domains: sorted([...domains.entries()]).map(([name, d]) => ({
      name, tally: d.tally, skills: sorted([...d.skills.entries()]).map(([skill, tally]) => ({ name: skill, tally })),
    })),
    difficulties: [...difficulties.entries()].filter(([, t]) => t.total).map(([name, tally]) => ({ name, tally })),
  };
}

export function formatDuration(seconds: number) {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

export const formatDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ---- Lưu các báo cáo gần đây (localStorage) ----

const REPORTS_KEY = 'sat_reports_v1';
const MAX_REPORTS = 30;
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: PracticeReport[] } = { raw: null, value: [] };

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function getReports(): PracticeReport[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(REPORTS_KEY);
  } catch {
    // localStorage bị chặn
  }
  if (raw !== cache.raw) {
    let value: PracticeReport[] = [];
    try {
      value = raw ? JSON.parse(raw) : [];
    } catch {
      value = [];
    }
    cache = { raw, value: Array.isArray(value) ? value : [] };
  }
  return cache.value;
}

export const useReports = () => useSyncExternalStore(subscribe, getReports, () => null);

function writeReports(reports: PracticeReport[]) {
  // Đầy bộ nhớ thì bỏ dần báo cáo cũ nhất (luôn giữ báo cáo mới nhất)
  let list = reports.slice(0, MAX_REPORTS);
  while (list.length) {
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
      break;
    } catch {
      if (list.length === 1) break;
      list = list.slice(0, -1);
    }
  }
  listeners.forEach(l => l());
}

export function saveReport(report: PracticeReport) {
  writeReports([report, ...getReports().filter(r => r.id !== report.id)]);
}

export function deleteReport(id: string) {
  writeReports(getReports().filter(r => r.id !== id));
}

export const newReportId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---- Xuất báo cáo thành một file HTML độc lập (mở offline, in ra PDF được) ----

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

// Nhúng hình (/media/...) vào file dưới dạng data URI để file mở được khi không có mạng
async function inlineMedia(html: string): Promise<string> {
  const urls = [...new Set([...html.matchAll(/(?:src="|url\()(\/media\/[^")]+)/g)].map(m => m[1]))];
  const map = new Map<string, string>();
  await Promise.all(urls.map(async url => {
    try {
      const blob = await (await fetch(url)).blob();
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      map.set(url, data);
    } catch {
      map.set(url, `${window.location.origin}${url}`);
    }
  }));
  return html.replace(/(src="|url\()(\/media\/[^")]+)/g, (_, pre: string, url: string) => pre + (map.get(url) || url));
}

const REPORT_CSS = `
*{box-sizing:border-box}
body{margin:0;background:#f7f7f7;color:#1e1e1e;font-family:"Noto Sans",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.5}
.wrap{max-width:900px;margin:0 auto;padding:32px 20px 60px}
h1{font-size:28px;margin:0 0 4px}h2{font-size:20px;margin:0 0 14px}h3{font-size:16px;margin:0 0 8px}
.muted{color:#505050}.card{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgb(0 0 0/.1);padding:24px;margin-top:20px;break-inside:avoid}
.score{display:flex;flex-wrap:wrap;gap:28px;align-items:center}.big{font-size:52px;font-weight:700;line-height:1}.big small{font-size:22px;color:#505050}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;flex:1}
.kpi{background:#f3f4f8;border-radius:10px;padding:10px 14px}.kpi b{display:block;font-size:20px}
.bar{height:9px;border-radius:9px;background:#e6e6e6;overflow:hidden;display:flex}.bar i{display:block;height:100%}
.ok{background:#0b7a3b}.bad{background:#c4122f}.om{background:#9a9a9a}
.row{display:grid;grid-template-columns:1fr 70px 50px;gap:12px;align-items:center;margin:8px 0}.row .n{text-align:right;font-variant-numeric:tabular-nums}
.domain{margin-bottom:16px}.domain>.row{font-weight:700}.skill{padding-left:18px;font-size:14px}
table.q{width:100%;border-collapse:collapse;font-size:14px}table.q th,table.q td{text-align:left;padding:7px 8px;border-bottom:1px solid #ececec;vertical-align:top}
table.q th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#505050}
.tag{display:inline-block;font-weight:700;font-size:12px;padding:2px 8px;border-radius:99px}
.t-correct{background:#e6f4ec;color:#0b7a3b}.t-incorrect{background:#fbe9ec;color:#c4122f}.t-omitted{background:#eee;color:#505050}
details.item{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgb(0 0 0/.1);margin-top:16px;break-inside:avoid-page}
details.item>summary{cursor:pointer;padding:14px 20px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;font-weight:700;list-style:none}
details.item>summary::-webkit-details-marker{display:none}
.body{padding:0 20px 20px;border-top:1px solid #ececec}
.choice{display:flex;gap:10px;border:1.5px solid #c4c4c4;border-radius:10px;padding:8px 12px;margin:8px 0}
.choice .l{flex:none;width:26px;height:26px;border:1.5px solid #1e1e1e;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:13px;font-family:"Noto Sans",sans-serif}
.choice.c{border-color:#0b7a3b;background:#e6f4ec}.choice.w{border-color:#c4122f;background:#fbe9ec}
.ans{display:flex;flex-wrap:wrap;gap:6px 28px;margin:14px 0 10px;font-weight:700}
.expl{background:#f7f7f9;border-radius:10px;padding:14px 16px;margin-top:10px}
.bb-content{font-family:"Noto Serif",Georgia,serif;font-size:16px;line-height:1.65;overflow-wrap:break-word}
.bb-content p{margin:0 0 12px}.bb-content p:last-child{margin-bottom:0}
.bb-content ul,.bb-content ol{margin:0 0 12px;padding-left:28px}.bb-content blockquote{margin:0 0 12px;padding-left:28px}
.bb-content .poem-line{display:block}.bb-content em,.bb-content .italic{font-style:italic}.bb-content u,.bb-content .underline{text-decoration:underline}
.bb-content table{margin:4px auto 14px;border-collapse:collapse;font-family:"Noto Sans",sans-serif;font-size:14px}
.bb-content th,.bb-content td{border:1px solid #3a3a3a;padding:5px 9px}.bb-content caption{font-weight:700;padding-bottom:6px}
.bb-content figure{margin:4px 0 14px;text-align:center}.bb-content img{max-width:100%;height:auto}
.bb-content .svg-figure,.bb-content figure img,.bb-content img.fig{display:block;margin:0 auto 10px}
.bb-content img.math-img{vertical-align:middle}.bb-content .m{display:inline-block;background-repeat:no-repeat}
.bb-content math{font-family:"STIX Two Math","Cambria Math","Latin Modern Math",math;font-size:1.08em}
.stem{margin:14px 0}
@media print{body{background:#fff}.wrap{padding:0}.card,details.item{box-shadow:none;border:1px solid #ddd}}
`;

function tallyRow(name: string, t: Tally) {
  const w = (n: number) => `${(n / Math.max(t.total, 1)) * 100}%`;
  return `<div class="row"><div><div>${esc(name)}</div><div class="bar"><i class="ok" style="width:${w(t.correct)}"></i><i class="bad" style="width:${w(t.incorrect)}"></i><i class="om" style="width:${w(t.omitted)}"></i></div></div>`
    + `<div class="n">${t.correct}/${t.total}</div><div class="n">${pct(t)}%</div></div>`;
}

const OUTCOME_LABEL: Record<Outcome, string> = { correct: 'Correct', incorrect: 'Incorrect', omitted: 'Omitted' };

function questionHtml(item: ReportItem, n: number, open: boolean) {
  const q = item.question;
  const key = item.result;
  const correctIdx = key?.type === 'mcq' ? key.correctAnswer : undefined;
  const choices = q.type === 'mcq'
    ? q.options.map((o, i) => {
      const letter = 'ABCD'[i];
      const cls = i === correctIdx ? 'c' : item.answer === letter ? 'w' : '';
      return `<div class="choice ${cls}"><span class="l">${letter}</span><div class="bb-content">${o}</div></div>`;
    }).join('')
    : '';
  return `<details class="item"${open ? ' open' : ''}><summary><span>Question ${n}</span><span class="tag t-${item.outcome}">${OUTCOME_LABEL[item.outcome]}</span>`
    + `<span class="muted" style="font-weight:400">${esc(q.skill)} · ${esc(q.difficulty)}${item.seconds ? ` · ${formatDuration(item.seconds)}` : ''}</span></summary>`
    + `<div class="body">${q.stimulus ? `<div class="bb-content stem">${q.stimulus}</div>` : ''}<div class="bb-content stem">${q.stem}</div>${choices}`
    + `<div class="ans"><span>Correct answer: <span style="color:#0b7a3b">${key ? esc(correctAnswerText(key)) : '—'}</span></span>`
    + `<span>Your answer: <span style="color:${item.outcome === 'correct' ? '#0b7a3b' : '#c4122f'}">${esc(item.answer || 'Omitted')}</span></span></div>`
    + (key?.rationale ? `<div class="expl"><h3>Explanation</h3><div class="bb-content">${key.rationale}</div></div>` : '')
    + `</div></details>`;
}

export async function reportHtml(report: PracticeReport, opts: { openAll?: boolean } = {}): Promise<string> {
  const stats = reportStats(report);
  const o = stats.overall;
  const numbered = stats.items.map((item, i) => ({ item, n: i + 1 }));
  const missed = numbered.filter(x => x.item.outcome !== 'correct');
  const right = numbered.filter(x => x.item.outcome === 'correct');
  const multi = report.modules.length > 1;

  const rows = numbered.map(({ item, n }) => {
    const key = item.result;
    return `<tr><td>${n}</td>${multi ? `<td>M${item.module + 1}</td>` : ''}<td>${esc(item.question.domain)}<br><span class="muted">${esc(item.question.skill)}</span></td>`
      + `<td>${esc(item.question.difficulty)}</td><td>${esc(item.answer || '—')}</td><td>${key ? esc(correctAnswerText(key)) : '—'}</td>`
      + `<td>${item.seconds ? formatDuration(item.seconds) : '—'}</td><td><span class="tag t-${item.outcome}">${OUTCOME_LABEL[item.outcome]}</span></td></tr>`;
  }).join('');

  const body = `<div class="wrap">
<h1>${esc(report.title)}</h1>
<div class="muted">Practice report · ${esc(formatDate(report.ts))}${report.adaptive ? ` · ${esc(report.adaptive)}` : ''}</div>
<div class="card score"><div><div class="big">${o.correct}<small>/${o.total}</small></div><div class="muted">correct (${pct(o)}%)</div></div>
<div class="kpis"><div class="kpi"><span class="muted">Incorrect</span><b>${o.incorrect}</b></div><div class="kpi"><span class="muted">Omitted</span><b>${o.omitted}</b></div>
<div class="kpi"><span class="muted">Time spent</span><b>${o.seconds ? formatDuration(o.seconds) : '—'}</b></div><div class="kpi"><span class="muted">Avg / question</span><b>${o.seconds ? formatDuration(o.seconds / Math.max(o.total, 1)) : '—'}</b></div></div></div>
<div class="card"><h2>Performance by skill</h2>${stats.domains.map(d => `<div class="domain">${tallyRow(d.name, d.tally)}${d.skills.map(s => `<div class="skill">${tallyRow(s.name, s.tally)}</div>`).join('')}</div>`).join('')}
<p class="muted" style="font-size:13px;margin:0"><span class="tag t-correct">Correct</span> <span class="tag t-incorrect">Incorrect</span> <span class="tag t-omitted">Omitted</span></p></div>
<div class="card"><h2>Performance by difficulty</h2>${stats.difficulties.map(d => tallyRow(d.name, d.tally)).join('')}</div>
<div class="card"><h2>All questions</h2><table class="q"><thead><tr><th>#</th>${multi ? '<th>Module</th>' : ''}<th>Domain / Skill</th><th>Difficulty</th><th>Yours</th><th>Correct</th><th>Time</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></div>
${missed.length ? `<h2 style="margin-top:32px">Incorrect &amp; omitted questions (${missed.length})</h2>${missed.map(x => questionHtml(x.item, x.n, true)).join('')}` : ''}
${right.length ? `<h2 style="margin-top:32px">Correct questions (${right.length})</h2>${right.map(x => questionHtml(x.item, x.n, Boolean(opts.openAll))).join('')}` : ''}
</div>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<title>${esc(report.title)} — Practice Report</title><style>${REPORT_CSS}</style></head><body>${await inlineMedia(body)}</body></html>`;
}

function fileName(report: PracticeReport, ext: string) {
  const d = new Date(report.ts);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const slug = report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  return `sat-report-${slug}-${date}.${ext}`;
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadReportHtml(report: PracticeReport) {
  download(fileName(report, 'html'), await reportHtml(report), 'text/html;charset=utf-8');
}

// Bảng câu hỏi dạng CSV (mở bằng Excel / Google Sheets)
export function downloadReportCsv(report: PracticeReport) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ['#', 'Module', 'Question ID', 'Section', 'Domain', 'Skill', 'Difficulty', 'Your answer', 'Correct answer', 'Result', 'Time (s)'];
  const lines = reportItems(report).map((item, i) => [
    i + 1, item.module + 1, item.question.id, item.question.section, item.question.domain, item.question.skill, item.question.difficulty,
    item.answer, item.result ? correctAnswerText(item.result) : '', OUTCOME_LABEL[item.outcome], item.seconds,
  ].map(cell).join(','));
  // BOM để Excel đọc đúng UTF-8
  download(fileName(report, 'csv'), `﻿${[header.map(cell).join(','), ...lines].join('\r\n')}`, 'text/csv;charset=utf-8');
}

// In / lưu PDF: in bản HTML đầy đủ (mở hết lời giải) trong iframe ẩn
export async function printReport(report: PracticeReport) {
  const html = await reportHtml(report, { openAll: true });
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);
  iframe.onload = () => {
    const w = iframe.contentWindow;
    if (!w) return;
    // Đợi hình tải xong rồi mới in
    const imgs = [...w.document.images].filter(img => !img.complete);
    Promise.all(imgs.map(img => new Promise(r => { img.onload = img.onerror = r; }))).then(() => {
      w.focus();
      w.print();
      setTimeout(() => iframe.remove(), 60_000);
    });
  };
  iframe.srcdoc = html;
}
