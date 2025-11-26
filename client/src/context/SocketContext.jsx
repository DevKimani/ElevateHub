// client/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth, useUser } from '@clerk/clerk-react';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isSignedIn || !user) {
      // Disconnect socket if user signs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Socket.IO server URL
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 
                       'http://localhost:5000';

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      auth: {
        userId: user.id
      }
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      
      // Emit user-online event with Clerk user ID
      newSocket.emit('user-online', user.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      // Automatically reconnect unless disconnected by server
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
      
      // Fallback to polling if websocket fails
      if (newSocket.io.opts.transports.indexOf('polling') === -1) {
        newSocket.io.opts.transports = ['polling', 'websocket'];
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      newSocket.emit('user-online', user.id);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after max attempts');
      setIsConnected(false);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error.message);
    });

    // User status change handler
    newSocket.on('user-status-change', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const updated = new Map(prev);
        if (status === 'online') {
          updated.set(userId, true);
        } else {
          updated.delete(userId);
        }
        return updated;
      });
    });

    // Error handler
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Connect the socket
    newSocket.connect();
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isSignedIn, user]);

  // Helper functions
  const joinConversation = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('join-conversation', conversationId);
    }
  };

  const sendMessage = (data) => {
    if (socket && isConnected) {
      socket.emit('send-message', data);
    } else {
      console.error('Socket not connected. Cannot send message.');
    }
  };

  const emitTyping = (conversationId, userId) => {
    if (socket && isConnected) {
      socket.emit('typing', { conversationId, userId });
    }
  };

  const emitStopTyping = (conversationId, userId) => {
    if (socket && isConnected) {
      socket.emit('stop-typing', { conversationId, userId });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    joinConversation,
    sendMessage,
    emitTyping,
    emitStopTyping,
    isUserOnline
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;