import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

let io: SocketIOServer | undefined;

export const initSocket = (server: NetServer): SocketIOServer => {
  if (!io) {
    io = new SocketIOServer(server, {
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
  }

  return io;
};

export const getIO = (): SocketIOServer | undefined => {
  return io;
};
