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
  : ["http://localhost:3000"];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST']
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
    // data có thể là string (code) hoặc object { roomCode, user }
    const roomCode = typeof data === 'string' ? data : data.roomCode;
    const user = typeof data === 'string' ? null : data.user;

    socket.join(roomCode);
    
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [], state: 'waiting' };
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
    }
  });

  // Bắt đầu trận đấu
  socket.on('startMatch', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].state = 'playing';
      
      // Shuffle và chọn 20 câu ngẫu nhiên từ ngân hàng
      // Nếu ngân hàng ít hơn 20 câu, lấy hết
      const shuffled = [...questionBank].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, 20);
      
      rooms[roomCode].questions = selectedQuestions;
      
      io.to(roomCode).emit('matchStarted', {
        questions: selectedQuestions
      });
      console.log(`Match started in room ${roomCode} with ${selectedQuestions.length} questions.`);
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
