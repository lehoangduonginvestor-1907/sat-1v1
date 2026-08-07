const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Tải ngân hàng câu hỏi vào RAM
let questionBank = [];
try {
  const dataPath = path.join(__dirname, 'data', 'questions.json');
  if (fs.existsSync(dataPath)) {
    const data = fs.readFileSync(dataPath, 'utf8');
    questionBank = JSON.parse(data);
    console.log(`Loaded ${questionBank.length} questions from question bank.`);
  } else {
    console.warn(`Warning: Question bank not found at ${dataPath}. Will use empty array.`);
  }
} catch (e) {
  console.error('Error loading question bank:', e);
}

const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',') 
  : ["http://localhost:3000", "https://sat-1v1-cyan.vercel.app", "*"];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST']
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
});

app.use(express.json());

// Lưu trữ các phòng đang active
const rooms = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Tham gia vào phòng
  socket.on('joinRoom', (data) => {
    // data có thể là string (code) hoặc object { roomCode, user, settings }
    const roomCode = typeof data === 'string' ? data : data.roomCode;
    const user = typeof data === 'string' ? null : data.user;
    const settings = typeof data === 'string' ? null : data.settings;

    socket.join(roomCode);
    
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [], state: 'waiting' };
    }
    
    if (settings && !rooms[roomCode].settings) {
      rooms[roomCode].settings = settings;
    }
    
    if (rooms[roomCode].players.length < 2 && !rooms[roomCode].players.find(p => p.id === socket.id)) {
      rooms[roomCode].players.push({ id: socket.id, user });
    }

    // Báo cho các client trong phòng biết có người mới vào
    io.to(roomCode).emit('playerJoined', {
      players: rooms[roomCode].players
    });

    // Nếu trận đấu đã bắt đầu (khi chuyển sang route /arena và connect lại socket)
    if (rooms[roomCode].state === 'playing' && rooms[roomCode].questions) {
      socket.emit('matchStarted', {
        questions: rooms[roomCode].questions
      });
    } else if (rooms[roomCode].players.length === 2 && rooms[roomCode].state === 'waiting') {
      // AUTO START MATCH WHEN 2 PLAYERS JOIN
      rooms[roomCode].state = 'playing';
      
      const settings = rooms[roomCode].settings || { domain: 'All', questionCount: 20, timeLimit: 30 };
      
      let filteredBank = questionBank;
      if (settings.domain && settings.domain !== 'All') {
        filteredBank = questionBank.filter(q => q.domain === settings.domain);
      }
      
      // Nếu số câu hỏi tìm được ít hơn yêu cầu, lấy hết
      const shuffled = [...filteredBank].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, settings.questionCount);
      rooms[roomCode].questions = selectedQuestions;
      
      io.to(roomCode).emit('matchStarted', {
        questions: selectedQuestions,
        timeLimit: settings.timeLimit
      });
      console.log(`Auto Match started in room ${roomCode} with ${selectedQuestions.length} questions, timeLimit: ${settings.timeLimit}.`);
    }
  });

  // Đồng bộ tiến độ làm bài
  socket.on('submitAnswer', ({ roomCode, questionIdx, isCorrect }) => {
    // Phát cho người chơi còn lại (không phát lại cho người gửi)
    socket.to(roomCode).emit('opponentProgress', {
      questionIdx,
      isCorrect
    });
  });

  socket.on('finishMatch', ({ roomCode, answers }) => {
    if (!rooms[roomCode]) return;
    const room = rooms[roomCode];
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    player.answers = answers;
    
    // Tính điểm
    let score = 0;
    const questions = room.questions || [];
    for (const [idx, letter] of Object.entries(answers)) {
      const q = questions[parseInt(idx)];
      if (q) {
        // Chuyển chữ cái sang index (A=0, B=1, C=2, D=3)
        const ansIdx = letter === 'A' ? 0 : letter === 'B' ? 1 : letter === 'C' ? 2 : letter === 'D' ? 3 : -1;
        if (ansIdx === q.correctAnswer) {
          score++;
        }
      }
    }
    player.score = score;
    player.finished = true;
    console.log(`Player ${player.user?.name} finished with score ${score}`);
    
    // Kiểm tra xem cả 2 đã nộp bài chưa
    const allFinished = room.players.every(p => p.finished);
    if (allFinished && room.players.length === 2) {
      room.state = 'ended';
      const results = room.players.map(p => ({
        id: p.id,
        name: p.user?.name || 'Player',
        score: p.score || 0
      }));
      io.to(roomCode).emit('matchEnded', { results });
      console.log(`Match ended in room ${roomCode}`);
    } else {
      socket.to(roomCode).emit('opponentFinished');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Xoá user khỏi phòng nếu bị disconnect
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const index = room.players.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        io.to(roomCode).emit('playerJoined', {
          players: room.players
        });
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('SAT Challenge Backend is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
