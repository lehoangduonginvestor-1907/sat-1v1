const fs = require('fs');
const path = require('path');
const { topicsOf } = require('./topics');

// Ngân hàng câu hỏi (sinh bởi tools/build_bank.py) + chọn câu + chấm điểm

const RW = 'Reading and Writing';
const MATH = 'Math';
const SUBJECTS = { Verbal: RW, Math: MATH };
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Cấu trúc một module trên Bluebook: số câu, thời gian, số câu mỗi domain,
// và thứ tự dạng câu (R&W luôn đi theo thứ tự này, Math tăng dần độ khó)
const BLUEPRINTS = {
  [RW]: {
    size: 27,
    minutes: 32,
    domains: {
      'Craft and Structure': 7,
      'Information and Ideas': 7,
      'Standard English Conventions': 7,
      'Expression of Ideas': 6,
    },
    skillOrder: [
      'Words in Context', 'Text Structure and Purpose', 'Cross-Text Connections',
      'Central Ideas and Details', 'Command of Evidence', 'Inferences',
      'Boundaries', 'Form, Structure, and Sense',
      'Transitions', 'Rhetorical Synthesis',
    ],
  },
  [MATH]: {
    size: 22,
    minutes: 35,
    domains: {
      'Algebra': 7,
      'Advanced Math': 7,
      'Problem-Solving and Data Analysis': 4,
      'Geometry and Trigonometry': 4,
    },
    sprShare: 0.25,
  },
};

function loadBank(file = path.join(__dirname, '..', 'data', 'questions.json')) {
  if (!fs.existsSync(file)) {
    console.warn(`Warning: question bank not found at ${file}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const bank = loadBank();
// Chủ đề nhỏ cho bài học /learn (vd. Boundaries → nối hai câu / thành phần chen giữa...)
for (const q of bank) q.topics = topicsOf(q);
const byId = new Map(bank.map(q => [q.id, q]));

// Câu gửi cho người chơi: không kèm đáp án / lời giải
function publicQuestion(q) {
  return {
    id: q.id,
    section: q.section,
    domain: q.domain,
    skill: q.skill,
    difficulty: q.difficulty,
    type: q.type,
    stimulus: q.stimulus,
    stem: q.stem,
    options: q.options,
  };
}

function answerKey(q) {
  return q.type === 'spr'
    ? { id: q.id, type: q.type, acceptedAnswers: q.acceptedAnswers, rationale: q.rationale }
    : { id: q.id, type: q.type, correctAnswer: q.correctAnswer, rationale: q.rationale };
}

// Chuyển "3/4", ".75", "-2" thành số; NaN nếu không hợp lệ
function parseNumericAnswer(str) {
  const s = String(str).trim();
  if (/^-?\d+\/\d+$/.test(s)) {
    const [num, den] = s.split('/').map(Number);
    return den === 0 ? NaN : num / den;
  }
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return Number(s);
  return NaN;
}

// answer: chữ cái A-D (trắc nghiệm) hoặc chuỗi người chơi tự nhập (SPR)
function isAnswerCorrect(question, answer) {
  if (!answer) return false;
  if (question.type === 'spr') {
    // So sánh theo giá trị để chấp nhận cả "0.5" lẫn ".5", "2/4" lẫn "1/2"
    const value = parseNumericAnswer(answer);
    if (Number.isNaN(value)) return false;
    return question.acceptedAnswers.some(a => Math.abs(parseNumericAnswer(a) - value) < 1e-9);
  }
  return answer.charCodeAt(0) - 65 === question.correctAnswer;
}

function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const difficultyRank = q => DIFFICULTIES.indexOf(q.difficulty);

// Sắp xếp như một module Bluebook: R&W theo thứ tự dạng câu rồi độ khó;
// Math tăng dần độ khó, câu tự điền rải đều giữa các câu trắc nghiệm (không đứng đầu module)
function bluebookOrder(questions) {
  const byDifficulty = (a, b) => difficultyRank(a) - difficultyRank(b);
  const order = BLUEPRINTS[RW].skillOrder;
  const rw = questions
    .filter(q => q.section === RW)
    .sort((a, b) => order.indexOf(a.skill) - order.indexOf(b.skill) || byDifficulty(a, b));

  const math = questions.filter(q => q.section === MATH);
  const mcq = math.filter(q => q.type !== 'spr').sort(byDifficulty);
  const spr = math.filter(q => q.type === 'spr').sort(byDifficulty);
  const mixed = [...mcq];
  spr.forEach((q, k) => {
    const at = Math.round(((k + 1) * math.length) / (spr.length + 1));
    mixed.splice(Math.min(at, mixed.length), 0, q);
  });
  return [...rw, ...mixed];
}

// Lấy `count` câu, chia đều theo độ khó để module không bị lệch về một mức
function takeBalanced(pool, count) {
  const byDifficulty = DIFFICULTIES.map(d => shuffle(pool.filter(q => q.difficulty === d)));
  const picked = [];
  // Bắt đầu ở mức ngẫu nhiên: lấy ít câu (1-2) thì không phải lúc nào cũng là Easy
  const offset = Math.floor(Math.random() * 3);
  for (let i = offset; picked.length < count && byDifficulty.some(list => list.length); i++) {
    const list = byDifficulty[i % 3];
    if (list.length) picked.push(list.pop());
  }
  return picked;
}

// Module theo blueprint: đúng tỉ lệ domain (co giãn theo số câu yêu cầu), Math có ~25% câu tự điền
function composeModule(pool, section, count) {
  const blueprint = BLUEPRINTS[section];
  const domains = Object.entries(blueprint.domains);
  const quotas = domains.map(([domain, n]) => [domain, Math.round((n * count) / blueprint.size)]);
  let diff = count - quotas.reduce((s, [, n]) => s + n, 0);
  for (let i = 0; diff !== 0; i = (i + 1) % quotas.length) {
    quotas[i][1] += Math.sign(diff);
    diff -= Math.sign(diff);
  }

  let picked = [];
  for (const [domain, quota] of quotas) {
    const domainPool = pool.filter(q => q.domain === domain);
    if (blueprint.sprShare) {
      const sprCount = Math.round(quota * blueprint.sprShare);
      const spr = takeBalanced(domainPool.filter(q => q.type === 'spr'), sprCount);
      picked.push(...spr, ...takeBalanced(domainPool.filter(q => q.type !== 'spr'), quota - spr.length));
    } else {
      picked.push(...takeBalanced(domainPool, quota));
    }
  }
  // Domain nào thiếu câu (do bộ lọc) thì bù bằng câu còn lại trong pool
  if (picked.length < count) {
    const chosen = new Set(picked.map(q => q.id));
    picked.push(...takeBalanced(pool.filter(q => !chosen.has(q.id)), count - picked.length));
  }
  return picked;
}

/**
 * settings: { subject: 'Verbal' | 'Math' | 'Any' (chỉ khi có onlyIds), domains?: [], skills?: [], difficulties?: [],
 *             topics?: [], includeBluebook?: bool, exam?: string, excludeIds?: [], onlyIds?: [], count, format?: 'module' | 'random' }
 * topics chỉ là ưu tiên: thiếu câu đúng chủ đề thì bù bằng câu cùng skill.
 */
function selectQuestions(settings) {
  const has = list => Array.isArray(list) && list.length > 0;
  const only = has(settings.onlyIds) ? new Set(settings.onlyIds) : null;
  // Mở câu theo danh sách id (link chia sẻ) thì không giới hạn section
  const section = only && settings.subject === 'Any' ? null : SUBJECTS[settings.subject] || RW;
  const exclude = new Set(settings.excludeIds || []);

  let pool = bank.filter(q =>
    (!section || q.section === section) &&
    (!q.bluebook || settings.includeBluebook) &&
    // Câu đề thi thật chỉ có khi chọn đúng đề đó (hoặc mở theo id); chọn đề thì chỉ lấy câu của đề
    (only ? !settings.exam || q.exam === settings.exam : (q.exam || '') === (settings.exam || '')) &&
    // Câu đề thật chưa được gắn domain/skill chính xác nên bỏ qua bộ lọc này
    (settings.exam || !has(settings.domains) || settings.domains.includes(q.domain)) &&
    (settings.exam || !has(settings.skills) || settings.skills.includes(q.skill)) &&
    (!has(settings.difficulties) || settings.difficulties.includes(q.difficulty)) &&
    (!only || only.has(q.id)));
  const count = Math.max(1, Math.min(Number(settings.count) || BLUEPRINTS[section || RW].size, 100));
  if (has(settings.topics)) {
    // Thứ tự ưu tiên: đúng chủ đề & chưa làm → đúng chủ đề → cùng skill & chưa làm → còn lại
    const focused = q => q.topics.some(t => settings.topics.includes(t));
    const tiers = [
      pool.filter(q => focused(q) && !exclude.has(q.id)),
      pool.filter(q => focused(q) && exclude.has(q.id)),
      pool.filter(q => !focused(q) && !exclude.has(q.id)),
      pool.filter(q => !focused(q) && exclude.has(q.id)),
    ];
    return bluebookOrder(tiers.flatMap(shuffle).slice(0, count));
  }
  // "Chưa làm" mà không đủ câu thì vẫn lấy thêm câu đã làm
  const fresh = pool.filter(q => !exclude.has(q.id));
  if (fresh.length >= count) pool = fresh;

  const picked = section && settings.format === 'module' && !settings.exam && !has(settings.domains) && !has(settings.skills)
    ? composeModule(pool, section, count)
    : shuffle(pool).slice(0, count);
  return bluebookOrder(picked);
}

// Số câu theo section/domain/skill/độ khó cho màn hình chọn bài luyện tập
function bankStats() {
  const stats = {};
  for (const q of bank) {
    const s = (stats[q.section] ||= { total: 0, bluebook: 0, exams: {}, domains: {} });
    if (q.exam) {
      s.exams[q.exam] = (s.exams[q.exam] || 0) + 1;
      continue;
    }
    if (q.bluebook) {
      s.bluebook++;
      continue;
    }
    s.total++;
    const d = (s.domains[q.domain] ||= { total: 0, skills: {} });
    d.total++;
    const k = (d.skills[q.skill] ||= { total: 0, Easy: 0, Medium: 0, Hard: 0, topics: {} });
    k.total++;
    k[q.difficulty]++;
    for (const t of q.topics) k.topics[t] = (k.topics[t] || 0) + 1;
  }
  return stats;
}

module.exports = {
  RW, MATH, SUBJECTS, BLUEPRINTS,
  bank, byId,
  publicQuestion, answerKey, parseNumericAnswer, isAnswerCorrect,
  selectQuestions, bluebookOrder, bankStats,
};
