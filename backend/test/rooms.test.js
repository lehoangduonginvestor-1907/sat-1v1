const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { Server } = require('socket.io');
const { io: connect } = require('socket.io-client');
const { registerRoomHandlers, rooms } = require('../lib/rooms');
const { byId, isAnswerCorrect } = require('../lib/bank');

function startServer() {
  const server = http.createServer();
  const io = new Server(server);
  registerRoomHandlers(io);
  return new Promise(resolve => server.listen(0, () => resolve({ server, io, url: `http://localhost:${server.address().port}` })));
}

const once = (socket, event) => new Promise(resolve => socket.once(event, resolve));
const emit = (socket, event, data) => new Promise(resolve => socket.emit(event, data, resolve));

test('a full 1v1 match: join, answer, reconnect, finish, rematch', async () => {
  const { server, io, url } = await startServer();
  const a = connect(url, { forceNew: true });
  const b = connect(url, { forceNew: true });
  try {
    const created = await emit(a, 'room:create', {
      name: 'Alice', playerId: 'pa', settings: { subject: 'Math', questionCount: 5, timeLimit: 10 },
    });
    assert.ok(created.ok);
    const code = created.room.code;

    const startA = once(a, 'match:start');
    const joined = await emit(b, 'room:join', { code, name: 'Bob', playerId: 'pb' });
    assert.ok(joined.ok);
    const match = await startA;
    assert.equal(match.questions.length, 5);
    assert.ok(match.questions.every(q => !('correctAnswer' in q) && !('acceptedAnswers' in q)), 'no answers leaked');

    // Không ai khác được vào phòng đã đủ người
    const c = connect(url, { forceNew: true });
    const full = await emit(c, 'room:join', { code, name: 'Eve', playerId: 'pe' });
    assert.ok(full.error);
    c.close();

    // Bỏ qua đếm ngược để trả lời ngay
    const room = rooms.get(code);
    room.startedAt = Date.now() - 1000;
    const full0 = byId.get(room.questions[0].id);
    const right = full0.type === 'spr' ? full0.acceptedAnswers[0] : 'ABCD'[full0.correctAnswer];
    a.emit('match:answer', { index: 0, answer: right });
    b.emit('match:answer', { index: 0, answer: 'zzz' });
    await new Promise(r => setTimeout(r, 100));
    assert.equal(room.players[0].answers[0], right);

    // Alice tải lại trang: vào lại phòng với cùng playerId, bài làm còn nguyên
    a.close();
    const a2 = connect(url, { forceNew: true });
    const resumed = once(a2, 'match:start');
    await emit(a2, 'room:join', { code, name: 'Alice', playerId: 'pa' });
    assert.equal((await resumed).answers[0], right);

    const ended = once(b, 'match:end');
    a2.emit('match:finish');
    b.emit('match:finish');
    const result = await ended;
    const alice = result.results.find(r => r.playerId === 'pa');
    const bob = result.results.find(r => r.playerId === 'pb');
    assert.equal(alice.correct[0], true);
    assert.equal(bob.correct[0], isAnswerCorrect(full0, 'zzz'));
    assert.equal(result.review.length, 5);
    assert.ok('rationale' in result.review[0]);
    assert.equal(result.winnerId, 'pa');

    const restart = once(b, 'match:start');
    a2.emit('match:rematch');
    b.emit('match:rematch');
    const second = await restart;
    assert.equal(second.questions.length, 5);
    assert.deepEqual(second.answers, {});
    a2.close();
  } finally {
    a.close();
    b.close();
    io.close();
    server.close();
    for (const room of rooms.values()) clearTimeout(room.timer);
  }
});
