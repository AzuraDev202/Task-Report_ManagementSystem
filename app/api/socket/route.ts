import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer;

export async function GET(req: NextRequest) {
  if (!io) {
    // Initialize Socket.io server
    const httpServer = (global as any).httpServer;
    
    if (!httpServer) {
      return new Response(JSON.stringify({ error: 'HTTP server not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Join user's personal room
      socket.on('join', (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Join group room
      socket.on('joinGroup', (groupId: string) => {
        socket.join(`group:${groupId}`);
        console.log(`Socket ${socket.id} joined group:${groupId}`);
      });

      // Leave group room
      socket.on('leaveGroup', (groupId: string) => {
        socket.leave(`group:${groupId}`);
        console.log(`Socket ${socket.id} left group:${groupId}`);
      });

      // Typing indicators
      socket.on('typing', ({ userId, conversationId, isGroup }: { userId: string; conversationId: string; isGroup: boolean }) => {
        const room = isGroup ? `group:${conversationId}` : `user:${conversationId}`;
        socket.to(room).emit('userTyping', { userId, conversationId });
      });

      socket.on('stopTyping', ({ userId, conversationId, isGroup }: { userId: string; conversationId: string; isGroup: boolean }) => {
        const room = isGroup ? `group:${conversationId}` : `user:${conversationId}`;
        socket.to(room).emit('userStoppedTyping', { userId, conversationId });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    (global as any).io = io;
  }

  return new Response(JSON.stringify({ message: 'Socket.io initialized' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
