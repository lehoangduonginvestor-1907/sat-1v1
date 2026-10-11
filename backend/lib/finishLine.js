const { byId, publicQuestion, answerKey, isAnswerCorrect, selectQuestions } = require('./bank');

// Chế độ "Finish Line" (kiểu phần Về đích của Olympia), chạy theo lượt và do server điều khiển:
// - Mỗi lượt, người chơi chọn gói 3 câu: Easy 10 / Medium 20 / Hard 30 điểm.
// - Trước mỗi câu có thể đặt Ngôi sao hy vọng (1 lần / lượt): đúng nhân đôi điểm, sai bị trừ đúng số điểm câu đó.
// - Trả lời sai hoặc hết giờ: đối thủ có vài giây để bấm cướp điểm. Cướp đúng: lấy điểm câu từ người đang thi;
//   cướp sai: bị trừ một nửa số điểm câu.
// - Hết các lượt mà bằng điểm: câu hỏi phụ, ai trả lời đúng trước thắng (trả lời sai bị khóa).
// Mọi pha đều có hạn giờ trên server nên trận vẫn chạy tiếp khi một người mất kết nối.

const VALUES = { Easy: 10, Medium: 20, Hard: 30 };
const SECONDS = {
  Verbal: { Easy: 60, Medium: 75, Hard: 90 },
  Math: { Easy: 75, Medium: 95, Hard: 115 },
};
const PACKAGE_SIZE = 3;
const COUNTDOWN_MS = 3000;
const PICK_MS = 30_000;
const READY_MS = 12_000;
const STEAL_WINDOW_MS = 5_000;
const STEAL_ANSWER_MS = 20_000;
const REVEAL_MS = 25_000;
const TIEBREAK_MS = 90_000;
const GRACE_MS = 1_500; // bù trễ mạng

const DIFFICULTIES = Object.keys(VALUES);

function pickQuestion(room, difficulty) {
  const s = room.settings;
  const [q] = selectQuestions({
    subject: s.subject,
    domains: s.domain !== 'All' ? [s.domain] : [],
    difficulties: [difficulty],
    includeBluebook: s.includeBluebook,
    excludeIds: [...room.game.usedIds],
    count: 1,
    format: 'random',
  });
  if (q) room.game.usedIds.add(q.id);
  return q;
}

const other = (room, playerId) => room.players.find(p => p.playerId !== playerId);
const nameOf = (room, playerId) => room.players.find(p => p.playerId === playerId)?.name || 'Player';

// Trạng thái gửi cho client: không bao giờ kèm đáp án của câu đang làm
function publicState(room) {
  const g = room.game;
  const item = g.pkg?.[g.q];
  return {
    phase: g.phase,
    activeId: g.activeId,
    turn: g.turnIndex,
    totalTurns: g.turns.length,
    turns: g.turns,
    pkg: g.pkg ? g.pkg.map(x => ({ difficulty: x.difficulty, value: x.value })) : null,
    q: g.q,
    star: g.star,
    starUsed: g.starUsed,
    deadline: g.deadline,
    startsAt: room.startedAt,
    serverNow: Date.now(),
    scores: g.scores,
    question: g.current ? publicQuestion(g.current) : null,
    seconds: g.seconds,
    value: item?.value ?? null,
    difficulty: item?.difficulty ?? null,
    attempt: g.attempt, // { answer, correct } của người đang thi (khi đã trả lời sai / hết giờ)
    steal: g.steal, // { playerId, answer?, correct? }
    reveal: g.phase === 'reveal' ? { key: answerKey(g.current), entry: g.log[g.log.length - 1] } : null,
    continued: [...g.continued],
    tiebreak: g.tiebreak ? { locked: g.tiebreak.locked, winnerId: g.tiebreak.winnerId } : null,
    log: g.log,
  };
}

function emitState(io, room) {
  room.lastActivity = Date.now();
  io.to(room.code).emit('fl:state', publicState(room));
}

function schedule(io, room, ms, onTimeout) {
  clearTimeout(room.timer);
  room.game.deadline = Date.now() + ms;
  room.timer = setTimeout(() => onTimeout(io, room), ms + GRACE_MS);
}

function start(io, room) {
  const ids = room.players.map(p => p.playerId);
  if (Math.random() < 0.5) ids.reverse(); // ai đi trước: ngẫu nhiên
  const turns = [];
  for (let t = 0; t < room.settings.turns; t++) turns.push(...ids);
  room.state = 'playing';
  room.result = null;
  room.startedAt = Date.now() + COUNTDOWN_MS;
  room.game = {
    phase: 'pick', turns, turnIndex: 0, activeId: turns[0],
    pkg: null, q: 0, star: false, starUsed: false, current: null, seconds: 0,
    attempt: null, steal: null, continued: new Set(), tiebreak: null,
    scores: Object.fromEntries(ids.map(id => [id, 0])),
    usedIds: new Set(), log: [], deadline: 0,
  };
  schedule(io, room, COUNTDOWN_MS + PICK_MS, onPickTimeout);
  emitState(io, room);
  console.log(`Finish Line started in room ${room.code}: ${turns.length} turns`);
}

function beginTurn(io, room) {
  const g = room.game;
  Object.assign(g, { phase: 'pick', activeId: g.turns[g.turnIndex], pkg: null, q: 0, star: false, starUsed: false, current: null, attempt: null, steal: null });
  schedule(io, room, PICK_MS, onPickTimeout);
  emitState(io, room);
}

function choosePackage(io, room, difficulties) {
  const g = room.game;
  const list = Array.isArray(difficulties) ? difficulties.slice(0, PACKAGE_SIZE) : [];
  while (list.length < PACKAGE_SIZE) list.push('Medium');
  g.pkg = list.map(d => (DIFFICULTIES.includes(d) ? d : 'Medium')).map(difficulty => {
    const q = pickQuestion(room, difficulty);
    return { id: q?.id, difficulty, value: VALUES[difficulty] };
  }).filter(x => x.id);
  if (!g.pkg.length) return finish(io, room);
  toReady(io, room, 0);
}

function onPickTimeout(io, room) {
  if (room.game?.phase === 'pick') choosePackage(io, room, ['Medium', 'Medium', 'Medium']);
}

function toReady(io, room, i) {
  const g = room.game;
  Object.assign(g, { phase: 'ready', q: i, star: false, current: null, attempt: null, steal: null, continued: new Set() });
  schedule(io, room, READY_MS, (io2, r) => r.game?.phase === 'ready' && toQuestion(io2, r));
  emitState(io, room);
}

function toQuestion(io, room) {
  const g = room.game;
  const item = g.pkg[g.q];
  g.phase = 'question';
  g.current = byId.get(item.id);
  g.seconds = SECONDS[room.settings.subject][item.difficulty];
  schedule(io, room, g.seconds * 1000, (io2, r) => r.game?.phase === 'question' && activeAnswer(io2, r, ''));
  emitState(io, room);
}

function record(room, patch) {
  const g = room.game;
  const item = g.pkg[g.q];
  const entry = {
    turn: g.turnIndex, q: g.q, activeId: g.activeId, questionId: item.id,
    difficulty: item.difficulty, value: item.value, star: g.star,
    answer: '', correct: false, steal: null, deltas: {}, ...patch,
  };
  for (const [id, d] of Object.entries(entry.deltas)) g.scores[id] += d;
  g.log.push(entry);
}

function activeAnswer(io, room, answer) {
  const g = room.game;
  const item = g.pkg[g.q];
  const correct = Boolean(answer) && isAnswerCorrect(g.current, answer);
  if (correct) {
    record(room, { answer, correct, deltas: { [g.activeId]: item.value * (g.star ? 2 : 1) } });
    return toReveal(io, room);
  }
  g.attempt = { answer, correct: false };
  // Đối thủ đã rời phòng thì không có ai cướp điểm
  const rival = other(room, g.activeId);
  if (!rival || !rival.connected) {
    record(room, { answer, deltas: g.star ? { [g.activeId]: -item.value } : {} });
    return toReveal(io, room);
  }
  g.phase = 'steal';
  schedule(io, room, STEAL_WINDOW_MS, (io2, r) => {
    if (r.game?.phase !== 'steal') return;
    record(r, { answer, deltas: r.game.star ? { [r.game.activeId]: -item.value } : {} });
    toReveal(io2, r);
  });
  emitState(io, room);
}

function stealAnswer(io, room, answer) {
  const g = room.game;
  const item = g.pkg[g.q];
  const thiefId = g.steal.playerId;
  const correct = Boolean(answer) && isAnswerCorrect(g.current, answer);
  const deltas = { [g.activeId]: g.star ? -item.value : 0, [thiefId]: 0 };
  if (correct) {
    deltas[thiefId] += item.value;
    deltas[g.activeId] -= item.value; // điểm bị "cướp" từ người đang thi
  } else {
    deltas[thiefId] -= Math.round(item.value / 2);
  }
  g.steal = { playerId: thiefId, answer, correct };
  record(room, { answer: g.attempt?.answer || '', steal: { playerId: thiefId, answer, correct }, deltas });
  toReveal(io, room);
}

function toReveal(io, room) {
  const g = room.game;
  g.phase = 'reveal';
  g.continued = new Set();
  schedule(io, room, REVEAL_MS, (io2, r) => r.game?.phase === 'reveal' && advance(io2, r));
  emitState(io, room);
}

function advance(io, room) {
  const g = room.game;
  if (g.q < g.pkg.length - 1) return toReady(io, room, g.q + 1);
  g.turnIndex++;
  if (g.turnIndex < g.turns.length) return beginTurn(io, room);
  const [a, b] = Object.values(g.scores);
  if (a === b && room.players.every(p => p.connected)) return toTiebreak(io, room);
  finish(io, room);
}

function toTiebreak(io, room) {
  const g = room.game;
  const q = pickQuestion(room, 'Medium');
  if (!q) return finish(io, room);
  Object.assign(g, {
    phase: 'tiebreak', activeId: null, pkg: null, star: false, current: q, attempt: null, steal: null,
    seconds: SECONDS[room.settings.subject].Medium, tiebreak: { locked: [], winnerId: null, questionId: q.id },
  });
  schedule(io, room, g.seconds * 1000, (io2, r) => r.game?.phase === 'tiebreak' && finish(io2, r));
  emitState(io, room);
}

function tiebreakAnswer(io, room, playerId, answer) {
  const t = room.game.tiebreak;
  if (t.locked.includes(playerId)) return;
  if (answer && isAnswerCorrect(room.game.current, answer)) {
    t.winnerId = playerId;
    return finish(io, room);
  }
  t.locked.push(playerId);
  if (room.players.every(p => t.locked.includes(p.playerId))) return finish(io, room);
  emitState(io, room);
}

function finish(io, room, forfeitId = null) {
  const g = room.game;
  if (!g || room.state !== 'playing') return;
  clearTimeout(room.timer);
  g.phase = 'done';
  room.state = 'ended';
  const results = room.players.map(p => ({ playerId: p.playerId, name: p.name, score: g.scores[p.playerId] ?? 0 }));
  let winnerId = g.tiebreak?.winnerId || null;
  if (forfeitId) winnerId = other(room, forfeitId)?.playerId || null;
  else if (!winnerId) {
    const [a, b] = results;
    if (a && b && a.score !== b.score) winnerId = a.score > b.score ? a.playerId : b.playerId;
  }
  const ids = [...g.log.map(e => e.questionId), ...(g.tiebreak ? [g.tiebreak.questionId] : [])];
  room.result = {
    mode: 'finish',
    results,
    winnerId,
    forfeitId,
    log: g.log,
    tiebreak: g.tiebreak ? { ...g.tiebreak } : null,
    questions: Object.fromEntries(ids.map(id => [id, publicQuestion(byId.get(id))])),
    keys: Object.fromEntries(ids.map(id => [id, answerKey(byId.get(id))])),
  };
  emitState(io, room);
  io.to(room.code).emit('match:end', room.result);
  console.log(`Finish Line ended in room ${room.code}: ${results.map(r => `${r.name} ${r.score}`).join(' vs ')}`);
}

// Hành động của người chơi: fl:pick / fl:star / fl:answer / fl:steal / fl:continue
function handle(io, room, player, action, data) {
  data = data && typeof data === 'object' ? data : {};
  const g = room.game;
  if (!g || room.state !== 'playing') return;
  const id = player.playerId;
  const isActive = id === g.activeId;
  const value = typeof data.answer === 'string' ? data.answer.trim().slice(0, 8) : '';

  if (action === 'pick' && g.phase === 'pick' && isActive && Date.now() >= room.startedAt) {
    choosePackage(io, room, data.difficulties);
  } else if (action === 'star' && g.phase === 'ready' && isActive) {
    if (data.use && !g.starUsed) g.star = g.starUsed = true;
    toQuestion(io, room);
  } else if (action === 'answer' && g.phase === 'question' && isActive && value) {
    activeAnswer(io, room, value);
  } else if (action === 'answer' && g.phase === 'stealAnswer' && g.steal?.playerId === id && value) {
    stealAnswer(io, room, value);
  } else if (action === 'answer' && g.phase === 'tiebreak' && value) {
    tiebreakAnswer(io, room, id, value);
  } else if (action === 'steal' && g.phase === 'steal' && !isActive) {
    g.phase = 'stealAnswer';
    g.steal = { playerId: id };
    schedule(io, room, STEAL_ANSWER_MS, (io2, r) => r.game?.phase === 'stealAnswer' && stealAnswer(io2, r, ''));
    emitState(io, room);
  } else if (action === 'continue' && g.phase === 'reveal') {
    g.continued.add(id);
    if (room.players.filter(p => p.connected).every(p => g.continued.has(p.playerId))) advance(io, room);
    else emitState(io, room);
  }
}

module.exports = { start, handle, finish, publicState, VALUES, SECONDS, PACKAGE_SIZE };
