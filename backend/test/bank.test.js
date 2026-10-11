const test = require('node:test');
const assert = require('node:assert');
const { bank, isAnswerCorrect, selectQuestions, publicQuestion, BLUEPRINTS, RW, MATH } = require('../lib/bank');

test('grades multiple-choice answers by letter', () => {
  const q = { type: 'mcq', correctAnswer: 2 };
  assert.equal(isAnswerCorrect(q, 'C'), true);
  assert.equal(isAnswerCorrect(q, 'A'), false);
  assert.equal(isAnswerCorrect(q, ''), false);
  assert.equal(isAnswerCorrect(q, undefined), false);
});

test('grades student-produced responses by value', () => {
  const q = { type: 'spr', acceptedAnswers: ['.6666', '.6667', '2/3'] };
  for (const ok of ['2/3', '4/6', '.6667', '0.6667']) assert.equal(isAnswerCorrect(q, ok), true, ok);
  for (const bad of ['.67', '0.6', 'abc', '1/0', '']) assert.equal(isAnswerCorrect(q, bad), false, bad);
  const multi = { type: 'spr', acceptedAnswers: ['11', '-7'] };
  assert.equal(isAnswerCorrect(multi, '-7'), true);
  assert.equal(isAnswerCorrect(multi, '7'), false);
});

test('every question in the bank is well formed', () => {
  assert.ok(bank.length > 1500);
  for (const q of bank) {
    assert.ok([RW, MATH].includes(q.section), q.id);
    assert.ok(['Easy', 'Medium', 'Hard'].includes(q.difficulty), q.id);
    if (q.type === 'mcq') {
      assert.equal(q.options.length, 4, q.id);
      assert.ok(q.correctAnswer >= 0 && q.correctAnswer <= 3, q.id);
    } else {
      assert.equal(q.type, 'spr', q.id);
      assert.ok(q.acceptedAnswers.length > 0, q.id);
    }
    assert.ok(q.sources.length >= 2, `${q.id} key confirmed by ${q.sources}`);
  }
});

test('public questions never include answers or rationales', () => {
  const pq = publicQuestion(bank[0]);
  for (const key of ['correctAnswer', 'acceptedAnswers', 'rationale', 'sources']) assert.ok(!(key in pq), key);
});

test('a Reading and Writing module follows the Bluebook blueprint and order', () => {
  const qs = selectQuestions({ subject: 'Verbal', count: 27, format: 'module' });
  assert.equal(qs.length, 27);
  assert.equal(new Set(qs.map(q => q.id)).size, 27);
  const byDomain = {};
  for (const q of qs) byDomain[q.domain] = (byDomain[q.domain] || 0) + 1;
  assert.deepEqual(byDomain, BLUEPRINTS[RW].domains);
  const order = BLUEPRINTS[RW].skillOrder;
  const positions = qs.map(q => order.indexOf(q.skill));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.ok(qs.every(q => !q.bluebook));
});

test('a Math module has the blueprint mix with student-produced responses', () => {
  const qs = selectQuestions({ subject: 'Math', count: 22, format: 'module' });
  assert.equal(qs.length, 22);
  const byDomain = {};
  for (const q of qs) byDomain[q.domain] = (byDomain[q.domain] || 0) + 1;
  assert.deepEqual(byDomain, BLUEPRINTS[MATH].domains);
  const spr = qs.filter(q => q.type === 'spr').length;
  assert.ok(spr >= 4 && spr <= 7, `spr=${spr}`);
});

test('filters, exclusions and Bluebook opt-in are respected', () => {
  const hard = selectQuestions({ subject: 'Math', difficulties: ['Hard'], skills: ['Circles'], count: 10 });
  assert.ok(hard.length > 0 && hard.every(q => q.difficulty === 'Hard' && q.skill === 'Circles'));

  const seen = selectQuestions({ subject: 'Verbal', count: 20 }).map(q => q.id);
  const fresh = selectQuestions({ subject: 'Verbal', count: 20, excludeIds: seen });
  assert.ok(fresh.every(q => !seen.includes(q.id)));

  const only = selectQuestions({ subject: 'Verbal', count: 50, onlyIds: seen.slice(0, 3) });
  assert.deepEqual(new Set(only.map(q => q.id)), new Set(seen.slice(0, 3)));

  const withBluebook = selectQuestions({ subject: 'Math', count: 100, includeBluebook: true, onlyIds: bank.filter(q => q.bluebook).map(q => q.id) });
  assert.ok(withBluebook.length > 0 && withBluebook.every(q => q.bluebook));
  assert.equal(selectQuestions({ subject: 'Math', count: 100, onlyIds: withBluebook.map(q => q.id) }).length, 0);
});

test('shared links can open questions from both sections by id', () => {
  const rw = bank.find(q => q.section === RW && !q.bluebook);
  const math = bank.find(q => q.section === MATH && !q.bluebook);
  const qs = selectQuestions({ subject: 'Any', onlyIds: [math.id, rw.id], count: 10 });
  assert.deepEqual(qs.map(q => q.id), [rw.id, math.id]); // R&W trước, Math sau
});

test('student-produced responses are spread out, never first in a Math module', () => {
  for (let i = 0; i < 20; i++) {
    const qs = selectQuestions({ subject: 'Math', count: 22, format: 'module' });
    assert.notEqual(qs[0].type, 'spr');
    const positions = qs.map((q, idx) => (q.type === 'spr' ? idx : -1)).filter(idx => idx >= 0);
    for (let k = 1; k < positions.length; k++) assert.ok(positions[k] - positions[k - 1] >= 2, `spr at ${positions}`);
  }
});

test('lesson practice prefers questions on the lesson topic, then tops up from the same skill', () => {
  const tagged = bank.filter(q => q.skill === 'Boundaries' && !q.bluebook && q.topics.includes('joining'));
  assert.ok(tagged.length >= 10, 'enough sentence-joining questions');
  const picked = selectQuestions({ subject: 'Verbal', skills: ['Boundaries'], topics: ['joining'], count: 10 });
  assert.equal(picked.length, 10);
  assert.ok(picked.every(q => q.topics.includes('joining')));

  const rare = bank.filter(q => q.skill === 'Boundaries' && !q.bluebook && q.topics.includes('colon-dash')).length;
  const topped = selectQuestions({ subject: 'Verbal', skills: ['Boundaries'], topics: ['colon-dash'], count: rare + 3 });
  assert.equal(topped.length, rare + 3);
  assert.equal(topped.filter(q => q.topics.includes('colon-dash')).length, rare);
  assert.ok(topped.every(q => q.skill === 'Boundaries'));
});
