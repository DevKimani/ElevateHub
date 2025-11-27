import { Server } from 'socket.io';

const onlineUsers = new Map();

export const initializeSocket = (server, corsOptions) => {
    const io = new Server(server, {
        cors: corsOptions,
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 30000,
        maxHttpBufferSize: 1e6,
        allowEIO3: true
    });

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

    return io;
};
