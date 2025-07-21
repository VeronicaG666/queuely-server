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

// ✅ Allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://queuely.vercel.app',
];

// ✅ Helmet with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "font-src": ["'self'", "data:"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "connect-src": [
          "'self'",
          "https://queuely.vercel.app",
          "https://queuely-server.onrender.com",
          "ws://localhost:5000",
          "wss://queuely-server.onrender.com"
        ],
      },
    },
  })
);

// ✅ CORS
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // allow all origins
  },
  methods: ['GET', 'POST', 'PATCH'],
  credentials: true,
}));

// ✅ Parse JSON body
app.use(express.json());

// ✅ Routes
app.use('/api/business', businessRoutes);
app.use('/api/queue', queueRoutes);

// ✅ Catch-all 404 (must come last)
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// ✅ Socket.io
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.set('io', io);

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
