import React from 'react';

// Hướng dẫn từng phần (diễn đạt lại theo nội dung hướng dẫn của bài thi)

export function SprRules() {
  return (
    <ul className="list-disc pl-6 space-y-1.5">
      <li>If you find more than one correct answer, enter only one of them.</li>
      <li>You can enter up to 5 characters for a positive answer and up to 6 characters (including the negative sign) for a negative answer.</li>
      <li>If your answer is a fraction that doesn&apos;t fit in the space, enter its decimal equivalent.</li>
      <li>If your answer is a decimal that doesn&apos;t fit in the space, truncate or round it at the fourth digit.</li>
      <li>Enter a mixed number (such as 3½) as an improper fraction (7/2) or a decimal (3.5).</li>
      <li>Don&apos;t enter symbols such as a percent sign, comma, or dollar sign.</li>
    </ul>
  );
}

const EXAMPLES: [string, string, string][] = [
  ['3.5', '3.5\n3.50\n7/2', '31/2\n3 1/2'],
  ['2/3', '2/3\n.6666\n.6667\n0.666\n0.667', '0.66\n.66\n0.67\n.67'],
  ['−1/3', '-1/3\n-.3333\n-0.333', '-.33\n-0.33'],
];

export function SprExamples() {
  return (
    <table className="w-full text-[14px] border-collapse mt-4" style={{ fontFamily: 'var(--bb-sans)' }}>
      <caption className="text-left font-bold pb-2">Examples</caption>
      <thead>
        <tr className="bg-[var(--bb-bar)]">
          <th className="border border-[#3a3a3a] p-2 font-bold">Answer</th>
          <th className="border border-[#3a3a3a] p-2 font-bold">Acceptable ways to enter answer</th>
          <th className="border border-[#3a3a3a] p-2 font-bold">Unacceptable: will NOT receive credit</th>
        </tr>
      </thead>
      <tbody>
        {EXAMPLES.map(([answer, ok, bad]) => (
          <tr key={answer}>
            <td className="border border-[#3a3a3a] p-2 text-center font-bold">{answer}</td>
            <td className="border border-[#3a3a3a] p-2 text-center whitespace-pre-line">{ok}</td>
            <td className="border border-[#3a3a3a] p-2 text-center whitespace-pre-line">{bad}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Cột trái của câu tự điền
export function SprDirections() {
  return (
    <div className="text-[15px] leading-relaxed" style={{ fontFamily: 'var(--bb-serif)' }}>
      <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'var(--bb-sans)' }}>Student-produced response directions</h2>
      <SprRules />
      <SprExamples />
    </div>
  );
}

export function SectionDirections({ math }: { math: boolean }) {
  if (!math) {
    return (
      <div className="space-y-3">
        <p>The questions in this section cover a range of important reading and writing skills. Each question comes with one or more passages, which may include a table or graph.</p>
        <p>Read each passage and question carefully, then choose the best answer based on the passage(s). Every question is multiple-choice with four answer choices and a single best answer.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p>The questions in this section cover a range of important math skills. You may use a calculator on every question, and you can open the reference sheet, the calculator, and these directions at any time.</p>
      <p><strong>Unless otherwise indicated:</strong></p>
      <ul className="list-disc pl-6 space-y-1">
        <li>All variables and expressions represent real numbers.</li>
        <li>Figures provided are drawn to scale.</li>
        <li>All figures lie in a plane.</li>
        <li>The domain of a given function <i>f</i> is the set of all real numbers <i>x</i> for which <i>f</i>(<i>x</i>) is a real number.</li>
      </ul>
      <p>For <strong>multiple-choice questions</strong>, solve each problem and choose the correct answer from the choices provided. Each multiple-choice question has a single correct answer.</p>
      <p>For <strong>student-produced response questions</strong>, solve each problem and enter your answer as described below.</p>
      <SprRules />
      <SprExamples />
    </div>
  );
}
