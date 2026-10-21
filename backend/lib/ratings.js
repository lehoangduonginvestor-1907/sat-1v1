const db = require('./db');
const { rate } = require('./elo');

// Tính Elo khi một trận 1v1 kết thúc. Chỉ tính khi cả hai đều đã đăng nhập (có userId do server xác thực).
// Các lần ghi được xếp hàng tuần tự để hai trận kết thúc cùng lúc không đọc Elo cũ của nhau.

let queue = Promise.resolve();

function recordMatch(io, room) {
  const result = room.result;
  if (!db.enabled || !result || room.players.length !== 2) return;
  const [p1, p2] = room.players;
  if (!p1.userId || !p2.userId || p1.userId === p2.userId) return;
  const mode = room.settings.mode === 'finish' ? 'finish' : 'classic';
  const scoreOf = p => result.results.find(r => r.playerId === p.playerId)?.score ?? 0;
  const scoreA = result.winnerId == null ? 0.5 : result.winnerId === p1.playerId ? 1 : 0;

  queue = queue
    .then(async () => {
      const profiles = await db.getProfiles([p1.userId, p2.userId]);
      const a = profiles.find(p => p.id === p1.userId);
      const b = profiles.find(p => p.id === p2.userId);
      if (!a || !b) throw new Error('Missing profile');
      const r = rate(a, b, scoreA, mode);
      await db.recordMatch({
        p_mode: mode,
        p1: p1.userId,
        p2: p2.userId,
        s1: scoreOf(p1),
        s2: scoreOf(p2),
        p_winner: scoreA === 1 ? p1.userId : scoreA === 0 ? p2.userId : null,
        e1_before: a.elo,
        e1_after: r.a,
        e2_before: b.elo,
        e2_after: r.b,
        p_settings: room.settings,
      });
      const rating = {
        [p1.playerId]: { before: a.elo, after: r.a, delta: r.deltaA },
        [p2.playerId]: { before: b.elo, after: r.b, delta: r.deltaB },
      };
      if (room.result === result) result.rating = rating; // người vào lại phòng vẫn thấy
      io.to(room.code).emit('match:rating', rating);
      console.log(`Elo (${mode}) room ${room.code}: ${p1.name} ${a.elo}->${r.a}, ${p2.name} ${b.elo}->${r.b}`);
    })
    .catch(err => console.error('Elo update failed:', err.message));
}

module.exports = { recordMatch };
