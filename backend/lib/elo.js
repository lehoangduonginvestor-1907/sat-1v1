// Elo chung cho mọi chế độ 1v1. Chế độ classic là chính; các chế độ giải trí đổi điểm ít hơn.

const START_ELO = 1000;
const MODE_WEIGHT = { classic: 1, finish: 0.5 };
const PROVISIONAL_GAMES = 10; // vài trận đầu đổi điểm mạnh hơn để nhanh về đúng trình
const K_PROVISIONAL = 48;
const K_REGULAR = 32;

const kFactor = games => (games < PROVISIONAL_GAMES ? K_PROVISIONAL : K_REGULAR);
const modeWeight = mode => MODE_WEIGHT[mode] ?? MODE_WEIGHT.classic;

// Xác suất thắng kỳ vọng của người có elo a trước người có elo b
const expected = (a, b) => 1 / (1 + 10 ** ((b - a) / 400));

// a, b: { elo, games }; scoreA: 1 = a thắng, 0.5 = hoà, 0 = a thua
function rate(a, b, scoreA, mode) {
  const w = modeWeight(mode);
  const ea = expected(a.elo, b.elo);
  const deltaA = Math.round(kFactor(a.games) * w * (scoreA - ea));
  const deltaB = Math.round(kFactor(b.games) * w * ((1 - scoreA) - (1 - ea)));
  return { a: a.elo + deltaA, b: b.elo + deltaB, deltaA, deltaB };
}

module.exports = { START_ELO, MODE_WEIGHT, kFactor, modeWeight, expected, rate };
