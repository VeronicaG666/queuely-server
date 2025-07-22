const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const helmet = require("helmet");
const socketIO = require("socket.io");

const businessRoutes = require("./routes/businessRoutes");
const queueRoutes = require("./routes/queueRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Environment-aware setup
const isDev = process.env.NODE_ENV !== "production";

// ✅ Allowlisted frontends
const allowedOrigins = [
  "http://localhost:5173",
  "https://queuely.vercel.app",
];

// ✅ Helmet CSP setup
if (!isDev) {
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
            ...allowedOrigins,
            "https://queuely-server.onrender.com",
            "wss://queuely-server.onrender.com",
          ],
        },
      },
    })
  );
} else {
  app.use(helmet()); // fallback minimal helmet in dev
}

// ✅ CORS setup
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS Not Allowed"));
      }
    },
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  })
);

// ✅ Body parser
app.use(express.json());

// ✅ API Routes
app.use("/api/business", businessRoutes);
app.use("/api/queue", queueRoutes);

// ✅ Catch-all 404
app.use((req, res) => {
  res.status(404).json({ message: "❌ Not found" });
});

// ✅ WebSockets
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH"],
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on("join_queue_room", (queueId) => {
    socket.join(queueId);
    console.log(`➡️ Socket ${socket.id} joined room: ${queueId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// ✅ Server start
const PORT = process.env.PORT || 10000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Queuely backend running on port ${PORT}`);
});

