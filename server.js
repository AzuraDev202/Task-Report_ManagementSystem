const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    pingTimeout: 30000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6,
    perMessageDeflate: {
      threshold: 1024
    },
    httpCompression: {
      threshold: 1024
    }
  });

  // Store online users
  const onlineUsers = new Map(); // userId -> { socketId, lastSeen }

  io.on('connection', (socket) => {
    let currentUserId = null;

    // Join user's personal room and mark as online
    socket.on('join', (userId) => {
      currentUserId = userId;
      socket.join(`user:${userId}`);
      
      // Mark user as online
      onlineUsers.set(userId, {
        socketId: socket.id,
        lastSeen: new Date(),
        status: 'online'
      });
      
      // Broadcast online status to all users
      io.emit('userOnline', { userId, status: 'online' });
    });

    // Join group room
    socket.on('joinGroup', (groupId) => {
      socket.join(`group:${groupId}`);
    });

    // Leave group room
    socket.on('leaveGroup', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    // Typing indicators (throttled on client)
    socket.on('typing', ({ userId, conversationId, isGroup }) => {
      const room = isGroup ? `group:${conversationId}` : `user:${conversationId}`;
      socket.to(room).emit('userTyping', { userId, conversationId });
    });

    socket.on('stopTyping', ({ userId, conversationId, isGroup }) => {
      const room = isGroup ? `group:${conversationId}` : `user:${conversationId}`;
      socket.to(room).emit('userStoppedTyping', { userId, conversationId });
    });

    // Message reactions
    socket.on('addReaction', ({ messageId, userId, reactionType, conversationId, isGroup }) => {
      const room = isGroup ? `group:${conversationId}` : `user:${conversationId}`;
      io.to(room).emit('reactionAdded', { messageId, userId, reactionType });
    });

    socket.on('removeReaction', ({ messageId, userId, conversationId, isGroup }) => {
      const room = isGroup ? `group:${conversationId}` : `user:${conversationId}`;
      io.to(room).emit('reactionRemoved', { messageId, userId });
    });

    // Message seen status
    socket.on('messageSeen', ({ messageId, userId, conversationId, isGroup }) => {
      const room = isGroup ? `group:${conversationId}` : `user:${conversationId}`;
      socket.to(room).emit('messageSeenBy', { messageId, userId, seenAt: new Date() });
    });

    // Optimistic message delivery confirmation
    socket.on('messageDelivered', ({ messageId, userId }) => {
      io.to(`user:${userId}`).emit('messageDeliveredConfirm', { messageId });
    });

    socket.on('disconnect', () => {
      if (currentUserId) {
        // Mark user as offline with last seen
        onlineUsers.set(currentUserId, {
          socketId: null,
          lastSeen: new Date(),
          status: 'offline'
        });
        
        // Broadcast offline status
        io.emit('userOffline', { 
          userId: currentUserId, 
          status: 'offline',
          lastSeen: new Date()
        });
      }
    });
  });

  // Store io and onlineUsers instance globally for API routes to access
  global.io = io;
  global.onlineUsers = onlineUsers;
  global.httpServer = httpServer;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.io ready on path /api/socket`);
    });
});
