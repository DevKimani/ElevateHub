import api from './api';

export const messageService = {
  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Get messages for a conversation
  getMessages: async (jobId, otherUserId) => {
    const response = await api.get(`/messages/conversation/${jobId}/${otherUserId}`);
    return response.data;
  },

  // Send a message
  sendMessage: async (messageData) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  // Mark conversation as read
  markAsRead: async (conversationId) => {
    const response = await api.put(`/messages/read/${conversationId}`);
    return response.data;
  },
};