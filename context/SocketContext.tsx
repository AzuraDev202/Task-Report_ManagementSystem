'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if user is logged in before initializing socket
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    // Initialize socket connection with optimizations
    const socketInstance = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      path: '/api/socket',
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true,
      forceNew: false
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
