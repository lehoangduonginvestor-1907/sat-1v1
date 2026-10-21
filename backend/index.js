const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { bank, byId, publicQuestion, answerKey, isAnswerCorrect, selectQuestions, bankStats, BLUEPRINTS } = require('./lib/bank');
const { registerRoomHandlers } = require('./lib/rooms');
const db = require('./lib/db');

console.log(`Loaded ${bank.length} questions from question bank.`);
console.log(db.enabled ? 'Supabase connected: Google sign-in and Elo are on.' : 'Supabase not configured: everyone plays as a guest, no Elo.');

const app = express();

// API chỉ trả dữ liệu công khai, không dùng cookie: cho phép mọi origin (giống socket.io bên dưới).
// Danh sách origin cũ (FRONTEND_URL) chặn nhầm frontend Vercel khi giá trị không khớp tuyệt đối.
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
});

app.use(express.json({ limit: '200kb' }));
app.use('/images', express.static(path.join(__dirname, 'data/images')));
app.use('/explanations', express.static(path.join(__dirname, 'data/explanations')));

// Số câu theo domain/skill/độ khó + cấu trúc module, cho màn hình chọn bài
const stats = bankStats();
app.get('/api/meta', (req, res) => {
  res.json({ stats, blueprints: BLUEPRINTS });
});

// Đề luyện tập tự do (không kèm đáp án)
app.post('/api/questions', (req, res) => {
  const questions = selectQuestions(req.body || {});
  res.json({ questions: questions.map(publicQuestion) });
});

// Chấm một hoặc nhiều câu: [{ id, answer }] -> đúng/sai + đáp án + lời giải
app.post('/api/grade', (req, res) => {
  const items = Array.isArray(req.body?.answers) ? req.body.answers.slice(0, 200) : [];
  const results = items
    .filter(item => byId.has(item?.id))
    .map(({ id, answer }) => {
      const q = byId.get(id);
      return { ...answerKey(q), answer: answer || '', correct: isAnswerCorrect(q, answer) };
    });
  res.json({ results });
});

registerRoomHandlers(io);

// Bảng xếp hạng Elo (chỉ có khi đã cấu hình Supabase)
app.get('/api/leaderboard', async (req, res) => {
  if (!db.enabled) return res.json({ enabled: false, players: [] });
  try {
    res.json({ enabled: true, players: await db.leaderboard() });
  } catch (err) {
    console.error('Leaderboard failed:', err.message);
    res.status(502).json({ error: 'Leaderboard is unavailable right now.' });
  }
});

app.get('/', (req, res) => {
  res.send('SAT Challenge Backend is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
