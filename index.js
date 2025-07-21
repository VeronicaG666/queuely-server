const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const socketIO = require('socket.io');

dotenv.config();

const businessRoutes = require('./routes/businessRoutes');
const queueRoutes = require('./routes/queueRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIO(server, {
  cors: {
    origin: '*', // TODO: In production, set this to your frontend URL (e.g. 'https://queuely.vercel.app')
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Attach io instance to app so controllers can access it
app.set('io', io);

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/business', businessRoutes);
app.use('/api/queue', queueRoutes);

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on('join_queue_room', (queueId) => {
    socket.join(queueId);
    console.log(`➡️ Socket ${socket.id} joined room: ${queueId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Queuely server running on http://localhost:${PORT}`);
});
