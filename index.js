const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const socketIO = require('socket.io');
const businessRoutes = require('./routes/businessRoutes');
const queueRoutes = require('./routes/queueRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Allow only your frontend domain in production
const allowedOrigins = [
  'http://localhost:5173', // Dev
  'https://queuely.vercel.app', // 🔒 Your deployed frontend (change if needed)
];

// ✅ Setup CORS securely
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH'],
  credentials: true,
}));

// ✅ JSON middleware
app.use(express.json());

// ✅ Routes
app.use('/api/business', businessRoutes);
app.use('/api/queue', queueRoutes);

// ✅ Attach socket.io and pass to controllers
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.set('io', io);

// ✅ Socket logic
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

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Queuely backend running at http://localhost:${PORT}`);
});
