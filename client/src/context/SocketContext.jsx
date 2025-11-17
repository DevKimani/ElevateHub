import { useEffect, useState } from 'react';
import { SocketContext } from './socketUtils';
import { io } from 'socket.io-client';
import { useUser } from '@clerk/clerk-react';


export const SocketProvider = ({ children }) => {
  const { user } = useUser();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (user) {
      // Connect to socket server
      const socketURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const newSocket = io(socketURL, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
        // Emit user online event
        newSocket.emit('user:online', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('users:online', (users) => {
        setOnlineUsers(users);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const value = {
    socket,
    connected,
    onlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};