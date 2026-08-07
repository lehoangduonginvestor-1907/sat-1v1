const io = require('socket.io-client');

const roomCode = process.argv[2];

if (!roomCode) {
  console.log('Please provide a room PIN. Example: node bot.js 1234');
  process.exit(1);
}

console.log(`🤖 AI Bot is connecting to room ${roomCode}...`);
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Bot connected to server.');
  socket.emit('joinRoom', roomCode);
  console.log('⏳ Waiting for match to start...');
});

socket.on('matchStarted', () => {
  console.log('🚀 Match started! AI is reading questions...');
  
  let questionsAnswered = 0;
  const totalQuestions = 3;

  const answerInterval = setInterval(() => {
    if (questionsAnswered >= totalQuestions) {
      clearInterval(answerInterval);
      console.log('🏆 AI has finished all questions!');
      return;
    }

    // Submit answer
    console.log(`📝 AI answered question ${questionsAnswered + 1}`);
    socket.emit('submitAnswer', {
      roomCode: roomCode,
      questionIdx: questionsAnswered,
      isCorrect: true
    });

    questionsAnswered++;
  }, 7000); // AI answers a question every 7 seconds
});

socket.on('disconnect', () => {
  console.log('❌ Bot disconnected.');
});
