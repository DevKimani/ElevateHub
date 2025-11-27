// server/src/server.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import userRoutes from './routes/userRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Trust proxy (required for rate limiting behind proxies like Render)
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://elevatehubportal.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
};

app.use(cors(corsOptions));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Prevent NoSQL injection
app.use(mongoSanitize());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.method === 'GET'
});

app.use('/api/', limiter);

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ElevateHub API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      users: '/api/users',
      jobs: '/api/jobs',
      applications: '/api/applications',
      messages: '/api/messages',
      transactions: '/api/transactions',
      health: '/health'
    }
  });
});

// ✅ CRITICAL: Register routes IN THE CORRECT ORDER
// Specific routes MUST come before parameterized routes

console.log('Registering routes...');

// User routes
app.use('/api/users', userRoutes);
console.log('✓ User routes registered');

// Job routes - REGISTER BEFORE OTHER ROUTES
app.use('/api/jobs', jobRoutes);
console.log('✓ Job routes registered');

// Application routes
app.use('/api/applications', applicationRoutes);
console.log('✓ Application routes registered');

// Message routes
app.use('/api/messages', messageRoutes);
console.log('✓ Message routes registered');

// Transaction routes
app.use('/api/transactions', transactionRoutes);
console.log('✓ Transaction routes registered');

// 404 handler (must be after all routes)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Socket.IO configuration
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
  allowEIO3: true
});

// Store online users
const onlineUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user-online', (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      io.emit('user-status-change', { userId, status: 'online' });
      console.log(`User ${userId} is online`);
    }
  });

  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
  });

  socket.on('send-message', (data) => {
    const { conversationId, receiverId, message } = data;
    
    io.to(conversationId).emit('new-message', message);
    
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message-notification', {
        conversationId,
        message
      });
    }
  });

  socket.on('typing', (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit('user-typing', { userId });
  });

  socket.on('stop-typing', (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit('user-stop-typing', { userId });
  });

  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
    
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('user-status-change', { userId, status: 'offline' });
        console.log(`User ${userId} went offline`);
        break;
      }
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io accessible to routes
app.set('io', io);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});

export default app;
