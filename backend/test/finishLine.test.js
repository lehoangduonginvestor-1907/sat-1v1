const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { Server } = require('socket.io');
const { io: connect } = require('socket.io-client');
const { registerRoomHandlers, rooms } = require('../lib/rooms');
const { byId } = require('../lib/bank');

function startServer() {
  const server = http.createServer();
  const io = new Server(server);
  registerRoomHandlers(io);
  return new Promise(resolve => server.listen(0, () => resolve({ server, io, url: `http://localhost:${server.address().port}` })));
}

const emit = (socket, event, data) => new Promise(resolve => socket.emit(event, data, resolve));
// Đợi tới khi nhận trạng thái thỏa điều kiện
const waitState = (socket, pred) => new Promise(resolve => {
  const on = s => { if (pred(s)) { socket.off('fl:state', on); resolve(s); } };
  socket.on('fl:state', on);
});
const once = (socket, event) => new Promise(resolve => socket.once(event, resolve));

const right = id => { const q = byId.get(id); return q.type === 'spr' ? q.acceptedAnswers[0] : 'ABCD'[q.correctAnswer]; };
const wrong = id => { const q = byId.get(id); return q.type === 'spr' ? '99999' : 'ABCD'[(q.correctAnswer + 1) % 4]; };

test('finish line: package, star of hope, steal, scores, emotes', async () => {
  const { server, io, url } = await startServer();
  const a = connect(url, { forceNew: true });
  const b = connect(url, { forceNew: true });
  try {
    const created = await emit(a, 'room:create', { name: 'Alice', playerId: 'pa', settings: { subject: 'Math', mode: 'finish', turns: 1 } });
    assert.equal(created.room.settings.mode, 'finish');
    const code = created.room.code;
    const firstA = waitState(a, s => s.phase === 'pick');
    await emit(b, 'room:join', { code, name: 'Bob', playerId: 'pb' });
    let s = await firstA;
    const room = rooms.get(code);
    room.startedAt = Date.now() - 1; // bỏ qua đếm ngược

    const sock = { pa: a, pb: b };
    const active = s.activeId;
    const rivalId = active === 'pa' ? 'pb' : 'pa';
    const me = sock[active];
    const rival = sock[rivalId];

    // Người không đến lượt không chọn gói được
    rival.emit('fl:pick', { difficulties: ['Hard', 'Hard', 'Hard'] });
    me.emit('fl:pick', { difficulties: ['Easy', 'Hard', 'Medium'] });
    s = await waitState(a, x => x.phase === 'ready');
    assert.deepEqual(s.pkg.map(x => x.value), [10, 30, 20]);
    assert.equal(s.question, null, 'question hidden before it starts');
    // Quỹ giờ của lượt = tổng thời gian chuẩn của gói (Math: 75 + 115 + 95 giây)
    assert.equal(s.bankTotal, 285_000);
    assert.equal(s.bank, 285_000);

    // Câu 1 (Easy 10đ) với ngôi sao hy vọng, trả lời đúng: +20
    me.emit('fl:star', { use: true });
    s = await waitState(a, x => x.phase === 'question' && x.q === 0);
    assert.ok(s.star && s.question && !('correctAnswer' in s.question), 'no answer leaked');
    me.emit('fl:answer', { answer: right(s.question.id) });
    s = await waitState(a, x => x.phase === 'reveal' && x.q === 0);
    assert.equal(s.scores[active], 20);
    assert.ok(s.bank < 285_000 && s.bank > 280_000, 'time spent comes out of the bank');
    assert.ok(s.reveal.key.rationale !== undefined);

    a.emit('fl:continue');
    b.emit('fl:continue');
    s = await waitState(a, x => x.phase === 'ready' && x.q === 1);
    assert.equal(s.starUsed, true);

    // Câu 2 (Hard 30đ): ngôi sao đã dùng; trả lời sai, đối thủ cướp đúng: chuyển 30đ
    me.emit('fl:star', { use: true });
    s = await waitState(a, x => x.phase === 'question' && x.q === 1);
    assert.equal(s.star, false);
    const q2 = s.question.id;
    me.emit('fl:answer', { answer: wrong(q2) });
    await waitState(a, x => x.phase === 'steal');
    me.emit('fl:steal'); // người đang thi không tự cướp được
    rival.emit('fl:steal');
    await waitState(a, x => x.phase === 'stealAnswer');
    rival.emit('fl:answer', { answer: right(q2) });
    s = await waitState(a, x => x.phase === 'reveal' && x.q === 1);
    assert.equal(s.scores[active], -10);
    assert.equal(s.scores[rivalId], 30);

    // Emote: phát cho cả phòng, chặn spam
    const got = once(rival, 'room:emote');
    me.emit('room:emote', { text: '  Too   easy!  ' });
    me.emit('room:emote', { text: 'spam' });
    const emote = await got;
    assert.equal(emote.text, 'Too easy!');
    assert.equal(emote.playerId, active);


    // Câu 3 (Medium 20đ): hết quỹ giờ thì tính hết giờ ngay, bỏ qua bước đặt ngôi sao.
    // Đối thủ cướp nhưng sai → đối thủ bị trừ 10đ (một nửa)
    room.game.bank = 0;
    a.emit('fl:continue');
    b.emit('fl:continue');
    s = await waitState(a, x => x.phase === 'steal' && x.q === 2);
    assert.equal(s.attempt.answer, '');
    const q3 = s.question.id;
    rival.emit('fl:steal');
    await waitState(a, x => x.phase === 'stealAnswer');
    rival.emit('fl:answer', { answer: wrong(q3) });
    s = await waitState(a, x => x.phase === 'reveal' && x.q === 2);
    assert.equal(s.scores[active], -10);
    assert.equal(s.scores[rivalId], 20);
    assert.equal(s.log.length, 3);

    // Lượt của đối thủ
    a.emit('fl:continue');
    b.emit('fl:continue');
    s = await waitState(a, x => x.phase === 'pick' && x.turn === 1);
    assert.equal(s.activeId, rivalId);

    // Người đang thi rời trận = thua
    const ended = once(me, 'match:end');
    rival.emit('room:leave');
    const end = await ended;
    assert.equal(end.mode, 'finish');
    assert.equal(end.winnerId, active);
    assert.ok(Object.keys(end.keys).length >= 3);
  } finally {
    a.close();
    b.close();
    io.close();
    server.close();
    for (const room of rooms.values()) clearTimeout(room.timer);
  }
});

test('events sent with no payload or junk payloads never crash the server', async () => {
  const { server, io, url } = await startServer();
  const a = connect(url, { forceNew: true });
  const b = connect(url, { forceNew: true });
  try {
    const created = await emit(a, 'room:create', { name: 'A', playerId: 'ja', settings: { mode: 'finish' } });
    const started = waitState(a, s => s.phase === 'pick');
    await emit(b, 'room:join', { code: created.room.code, name: 'B', playerId: 'jb' });
    await started;
    for (const ev of ['fl:pick', 'fl:star', 'fl:answer', 'fl:steal', 'fl:continue', 'room:emote', 'match:answer', 'match:finish']) {
      a.emit(ev);
      a.emit(ev, null);
      a.emit(ev, 'junk');
      a.emit(ev, { answer: 42, difficulties: 'x', text: 7 });
    }
    await new Promise(r => setTimeout(r, 200));
    const ok = await emit(b, 'room:join', { code: created.room.code, name: 'B', playerId: 'jb' });
    assert.ok(ok.ok, 'server still answering');
  } finally {
    a.close();
    b.close();
    io.close();
    server.close();
    for (const room of rooms.values()) clearTimeout(room.timer);
  }
});

test('a tie goes to sudden death: a wrong answer locks you out, first correct answer wins', async () => {
  const { server, io, url } = await startServer();
  const a = connect(url, { forceNew: true });
  const b = connect(url, { forceNew: true });
  try {
    const created = await emit(a, 'room:create', { name: 'A', playerId: 'ta', settings: { subject: 'Verbal', mode: 'finish', turns: 1 } });
    const code = created.room.code;
    const started = waitState(a, s => s.phase === 'pick');
    await emit(b, 'room:join', { code, name: 'B', playerId: 'tb' });
    const s = await started;
    const room = rooms.get(code);
    room.startedAt = Date.now() - 1;
    ({ ta: a, tb: b })[s.activeId].emit('fl:pick', { difficulties: ['Easy'] });
    await waitState(a, x => x.phase === 'ready');

    // Dựng thẳng tình huống: câu cuối của lượt cuối vừa công bố, hai bên bằng điểm
    Object.assign(room.game, { current: byId.get(room.game.pkg[0].id), phase: 'reveal', turnIndex: room.game.turns.length - 1, q: room.game.pkg.length - 1, scores: { ta: 20, tb: 20 } });
    const tb = waitState(a, x => x.phase === 'tiebreak');
    a.emit('fl:continue');
    b.emit('fl:continue');
    const t = await tb;
    assert.equal(t.activeId, null);
    const qid = t.question.id;

    const ended = once(a, 'match:end');
    a.emit('fl:answer', { answer: wrong(qid) });
    await waitState(a, x => x.tiebreak?.locked.includes('ta'));
    a.emit('fl:answer', { answer: right(qid) }); // đã bị khóa, không tính
    b.emit('fl:answer', { answer: right(qid) });
    const end = await ended;
    assert.equal(end.winnerId, 'tb');
    assert.equal(end.tiebreak.winnerId, 'tb');
    assert.ok(end.keys[qid].rationale !== undefined);
  } finally {
    a.close();
    b.close();
    io.close();
    server.close();
    for (const room of rooms.values()) clearTimeout(room.timer);
  }
});
