import { useEffect, useState, useContext } from 'react'; // <-- Added useContext
import { SocketContext } from './socketUtils';
import { io } from 'socket.io-client';
import { useUser } from '@clerk/clerk-react';

/**
 * SocketProvider component manages the WebSocket connection lifecycle
 * and provides the socket, connection status, and online users to the component tree.
 */
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
        // Include user ID in the handshake query for identification on the server
        query: { userId: user.id }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
        // Server will handle 'user:online' logic based on the query. 
        // No need for a manual 'user:online' emit here if using the query.
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
        // Cleanup on unmount or user change
        newSocket.disconnect();
      };
    } else {
      // Ensure socket is disconnected if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
        setOnlineUsers([]);
      }
    }
    // Added socket to dependency array for cleanup check
  }, [user, socket]); 

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


export const useSocket = () => {
    return useContext(SocketContext);
};