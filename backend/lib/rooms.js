const { publicQuestion, answerKey, isAnswerCorrect, selectQuestions } = require('./bank');
const finishLine = require('./finishLine');

// Phòng đấu 1v1. Server giữ câu hỏi, đáp án và đồng hồ: client chỉ nhận đề (không kèm đáp án),
// gửi từng câu trả lời lên, và nhận đáp án + lời giải khi trận kết thúc.

const COUNTDOWN_MS = 3000;
const GRACE_MS = 3000; // bù trễ mạng khi hết giờ
const IDLE_ROOM_MS = 30 * 60 * 1000;
const EMOTE_GAP_MS = 1200; // chống spam emote / trashtalk
const EMOTE_MAX_LENGTH = 60;

const rooms = new Map();

function makeCode() {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

function cleanSettings(raw = {}) {
  const subject = raw.subject === 'Math' ? 'Math' : 'Verbal';
  return {
    subject,
    domain: typeof raw.domain === 'string' ? raw.domain : 'All',
    difficulty: ['Easy', 'Medium', 'Hard'].includes(raw.difficulty) ? raw.difficulty : 'All',
    questionCount: Math.min(Math.max(Number(raw.questionCount) || 10, 1), 54),
    timeLimit: Math.min(Math.max(Number(raw.timeLimit) || 15, 1), 120),
    includeBluebook: Boolean(raw.includeBluebook),
    mode: raw.mode === 'finish' ? 'finish' : 'classic', // classic = đua cùng bộ đề; finish = kiểu Về đích Olympia
    turns: Math.min(Math.max(Math.round(Number(raw.turns)) || 2, 1), 3), // số lượt mỗi người (chế độ finish)
  };
}

const answeredCount = player => Object.values(player.answers).filter(Boolean).length;

function snapshot(room) {
  return {
    code: room.code,
    state: room.state,
    settings: room.settings,
    hostId: room.hostId,
    total: room.questions.length,
    players: room.players.map(p => ({
      playerId: p.playerId,
      name: p.name,
      connected: p.connected,
      answered: answeredCount(p),
      finished: p.finished,
      rematch: p.rematch,
    })),
  };
}

function matchPayload(room, player) {
  return {
    questions: room.questions.map(publicQuestion),
    startedAt: room.startedAt,
    endsAt: room.endsAt,
    serverNow: Date.now(),
    settings: room.settings,
    answers: player ? player.answers : {},
    finished: player ? player.finished : false,
  };
}

function broadcast(io, room) {
  room.lastActivity = Date.now();
  io.to(room.code).emit('room:update', snapshot(room));
}

function startMatch(io, room) {
  for (const p of room.players) Object.assign(p, { answers: {}, finished: false, finishedAt: null, rematch: false });
  if (room.settings.mode === 'finish') {
    finishLine.start(io, room);
    broadcast(io, room);
    return;
  }
  room.game = null;
  const s = room.settings;
  room.questions = selectQuestions({
    subject: s.subject,
    domains: s.domain !== 'All' ? [s.domain] : [],
    difficulties: s.difficulty !== 'All' ? [s.difficulty] : [],
    includeBluebook: s.includeBluebook,
    count: s.questionCount,
    format: 'module',
  });
  room.state = 'playing';
  room.result = null;
  room.startedAt = Date.now() + COUNTDOWN_MS;
  room.endsAt = room.startedAt + s.timeLimit * 60 * 1000;
  clearTimeout(room.timer);
  room.timer = setTimeout(() => endMatch(io, room), room.endsAt - Date.now() + GRACE_MS);

  for (const p of room.players) {
    if (p.socketId) io.to(p.socketId).emit('match:start', matchPayload(room, p));
  }
  broadcast(io, room);
  console.log(`Match started in room ${room.code}: ${room.questions.length} questions, ${s.timeLimit} min`);
}

function endMatch(io, room) {
  if (room.state !== 'playing') return;
  clearTimeout(room.timer);
  room.state = 'ended';

  const results = room.players.map(p => {
    const correct = room.questions.map((q, i) => isAnswerCorrect(q, p.answers[i]));
    const end = Math.min(p.finishedAt || room.endsAt, room.endsAt);
    return {
      playerId: p.playerId,
      name: p.name,
      score: correct.filter(Boolean).length,
      correct,
      answers: p.answers,
      timeUsed: Math.max(0, Math.round((end - room.startedAt) / 1000)),
    };
  });
  // Bằng điểm thì ai nộp bài nhanh hơn thắng
  const ranked = [...results].sort((a, b) => b.score - a.score || a.timeUsed - b.timeUsed);
  const tie = ranked.length < 2 || (ranked[0].score === ranked[1].score && ranked[0].timeUsed === ranked[1].timeUsed);

  room.result = {
    results,
    winnerId: tie ? null : ranked[0].playerId,
    review: room.questions.map(answerKey),
  };
  io.to(room.code).emit('match:end', room.result);
  broadcast(io, room);
  console.log(`Match ended in room ${room.code}: ${results.map(r => `${r.name} ${r.score}`).join(' vs ')}`);
}

function registerRoomHandlers(io) {
  io.on('connection', socket => {
    // Client gửi sự kiện không kèm dữ liệu thì socket.io truyền null: đổi về undefined để tham số mặc định hoạt động
    socket.use((packet, next) => {
      for (let i = 1; i < packet.length; i++) if (packet[i] === null) packet[i] = undefined;
      next();
    });

    const context = () => {
      const room = rooms.get(socket.data.code);
      const player = room && room.players.find(p => p.playerId === socket.data.playerId);
      return { room, player };
    };

    const join = (room, { name, playerId }) => {
      let player = room.players.find(p => p.playerId === playerId);
      if (!player) {
        if (room.players.length >= 2) return { error: 'This room is full.' };
        if (room.state !== 'waiting') return { error: 'This match has already started.' };
        player = { playerId, answers: {}, finished: false, finishedAt: null, rematch: false };
        room.players.push(player);
      }
      // Cùng playerId (vd. tải lại trang): nhận lại chỗ cũ, giữ nguyên bài đang làm
      Object.assign(player, { name: String(name || 'Player').slice(0, 20), socketId: socket.id, connected: true });
      socket.join(room.code);
      socket.data = { code: room.code, playerId };

      if (room.game) socket.emit('fl:state', finishLine.publicState(room));
      else if (room.state === 'playing') socket.emit('match:start', matchPayload(room, player));
      if (room.state === 'ended' && room.result) socket.emit('match:end', room.result);
      broadcast(io, room);
      if (room.state === 'waiting' && room.players.length === 2 && room.players.every(p => p.connected)) {
        startMatch(io, room);
      }
      return { ok: true, room: snapshot(room) };
    };

    socket.on('room:create', (data = {}, ack = () => {}) => {
      if (!data.playerId) return ack({ error: 'Missing player id.' });
      const room = {
        code: makeCode(),
        state: 'waiting',
        settings: cleanSettings(data.settings),
        hostId: data.playerId,
        players: [],
        questions: [],
        lastActivity: Date.now(),
      };
      rooms.set(room.code, room);
      ack(join(room, data));
    });

    socket.on('room:join', (data = {}, ack = () => {}) => {
      const room = rooms.get(String(data.code));
      if (!room) return ack({ error: 'Room not found. Check the code or ask for a new invite link.' });
      if (!data.playerId) return ack({ error: 'Missing player id.' });
      ack(join(room, data));
    });

    for (const action of ['pick', 'star', 'answer', 'steal', 'continue']) {
      socket.on(`fl:${action}`, (data = {}) => {
        const { room, player } = context();
        if (room && player && room.game) finishLine.handle(io, room, player, action, data);
      });
    }

    // Emote / trashtalk: phát cho cả phòng (người gửi cũng thấy bong bóng của mình)
    socket.on('room:emote', ({ text } = {}) => {
      const { room, player } = context();
      if (!room || !player || typeof text !== 'string') return;
      const clean = text.replace(/\s+/g, ' ').trim().slice(0, EMOTE_MAX_LENGTH);
      const now = Date.now();
      if (!clean || now - (player.lastEmote || 0) < EMOTE_GAP_MS) return;
      player.lastEmote = now;
      io.to(room.code).emit('room:emote', { id: `${now}-${player.playerId}`, playerId: player.playerId, name: player.name, text: clean });
    });

    socket.on('match:answer', ({ index, answer } = {}) => {
      const { room, player } = context();
      if (!room || !player || room.state !== 'playing' || player.finished || room.game) return;
      if (Date.now() < room.startedAt || Date.now() > room.endsAt + GRACE_MS) return;
      if (!Number.isInteger(index) || index < 0 || index >= room.questions.length) return;
      const value = typeof answer === 'string' ? answer.slice(0, 8) : '';
      if (value) player.answers[index] = value;
      else delete player.answers[index];
      broadcast(io, room);
    });

    socket.on('match:finish', () => {
      const { room, player } = context();
      if (!room || !player || room.state !== 'playing' || player.finished || room.game) return;
      player.finished = true;
      player.finishedAt = Date.now();
      broadcast(io, room);
      if (room.players.every(p => p.finished)) endMatch(io, room);
    });

    socket.on('match:rematch', () => {
      const { room, player } = context();
      if (!room || !player || room.state !== 'ended') return;
      player.rematch = true;
      broadcast(io, room);
      if (room.players.length === 2 && room.players.every(p => p.rematch && p.connected)) startMatch(io, room);
    });

    socket.on('room:leave', () => {
      const { room, player } = context();
      if (!room || !player) return;
      socket.leave(room.code);
      socket.data = {};
      if (room.state === 'playing' && room.game) {
        // Rời trận Finish Line = xử thua
        player.connected = false;
        finishLine.finish(io, room, player.playerId);
      } else if (room.state === 'playing') {
        // Bỏ cuộc giữa trận = nộp bài với những câu đã làm
        player.connected = false;
        if (!player.finished) {
          player.finished = true;
          player.finishedAt = Date.now();
        }
        if (room.players.every(p => p.finished)) endMatch(io, room);
      } else {
        room.players = room.players.filter(p => p !== player);
      }
      broadcast(io, room);
    });

    socket.on('disconnect', () => {
      const { room, player } = context();
      if (!room || !player || player.socketId !== socket.id) return;
      player.connected = false;
      broadcast(io, room);
    });
  });

  // Dọn phòng không còn ai
  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (room.players.every(p => !p.connected) && now - room.lastActivity > IDLE_ROOM_MS) {
        clearTimeout(room.timer);
        rooms.delete(code);
      }
    }
  }, 5 * 60 * 1000).unref();
}

module.exports = { registerRoomHandlers, rooms, cleanSettings };
