const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const helmet = require('helmet');
const socketIO = require('socket.io');

const businessRoutes = require('./routes/businessRoutes');
const queueRoutes = require('./routes/queueRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Allow only your frontend domain in production
const allowedOrigins = [
  'http://localhost:5173', // Dev
  'https://queuely.vercel.app', // 🔒 Your deployed frontend
];

// Prevent render from trying to serve unknown static files like fonts
app.get('*', (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// ✅ Secure headers (including CSP for fonts)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "font-src": ["'self'", "data:"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "script-src": ["'self'"],
      },
    },
  })
);

// ✅ CORS setup
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

// ✅ Body parsing
app.use(express.json());

// ✅ API routes
app.use('/api/business', businessRoutes);
app.use('/api/queue', queueRoutes);

// ✅ Socket.io setup
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Attach io for global usage
app.set('io', io);

// ✅ Socket connection logic
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

// ✅ Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Queuely backend running at http://localhost:${PORT}`);
});
