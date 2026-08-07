const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();

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

  // Tham gia phòng
  socket.on('joinRoom', (roomCode) => {
    socket.join(roomCode);
    console.log(`User ${socket.id} joined room ${roomCode}`);
    
    // Nếu phòng chưa tồn tại, tạo mới
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: [],
        state: 'waiting' // waiting, playing, finished
      };
    }
    
    rooms[roomCode].players.push(socket.id);
    
    // Báo cho các client trong phòng biết có người mới vào
    io.to(roomCode).emit('playerJoined', {
      players: rooms[roomCode].players
    });
  });

  // Bắt đầu trận đấu
  socket.on('startMatch', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].state = 'playing';
      io.to(roomCode).emit('matchStarted');
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
    // TODO: Xử lý xoá user khỏi phòng nếu bị disconnect
  });
});

app.get('/', (req, res) => {
  res.send('SAT Challenge Backend is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
