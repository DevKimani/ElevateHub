import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  // Return default values if context is not available
  if (!context) {
    return { socket: null, onlineUsers: [] };
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Only connect if user is signed in
    if (!isSignedIn || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to socket server
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    console.log('Attempting socket connection to:', socketUrl);
    
    let newSocket;
    
    try {
      newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000,
        autoConnect: true,
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        newSocket.emit('user:online', user.id);
      });

      newSocket.on('users:online', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('connect_error', (error) => {
        console.warn('⚠️ Socket connection error:', error.message);
        // Don't crash the app, just log the error
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      // App continues to work without socket
    }

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      setSocket(null);
    };
  }, [isSignedIn, user?.id]);

  const value = {
    socket,
    onlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;