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
  const [token, setToken] = useState<string | null>(null);

  // Monitor token changes in localStorage
  useEffect(() => {
    const checkToken = () => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      setToken(currentToken);
    };

    // Check initially
    checkToken();

    // Listen for storage changes (e.g., login/logout in same tab or other tabs)
    window.addEventListener('storage', checkToken);
    
    // Custom event for same-tab token changes
    window.addEventListener('tokenChange', checkToken);

    return () => {
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('tokenChange', checkToken);
    };
  }, []);

  useEffect(() => {
    // Check if user is logged in before initializing socket
    if (!token) {
      // Disconnect socket if no token
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

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
      forceNew: true,
      auth: { token }
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
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
