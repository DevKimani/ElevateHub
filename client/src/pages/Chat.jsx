import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useSocket } from '../context/SocketContext';
import { messageService } from '../services/messageService';
import { userService } from '../services/userService';
import { setAuthToken } from '../services/api';
import { ArrowLeft, Send, Circle } from 'lucide-react';

export default function Chat() {
  const { jobId, otherUserId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      // Fetch current user
      const userResponse = await userService.getCurrentUser();
      if (!isMountedRef.current) return;
      setCurrentUser(userResponse.data);

      // Fetch other user
      const otherUserResponse = await userService.getUserById(otherUserId);
      if (!isMountedRef.current) return;
      setOtherUser(otherUserResponse.data);

      // Fetch messages and conversation identifier
      const messagesResponse = await messageService.getMessages(jobId, otherUserId);
      if (!isMountedRef.current) return;
      setMessages(messagesResponse.data);
      setConversationId(messagesResponse.conversationId); // store the conversation ID

      scrollToBottom();
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [jobId, otherUserId, getToken, scrollToBottom]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // socket setup omitted for brevity …

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // clear input

    try {
      const token = await getToken();
      setAuthToken(token);

      // Send conversationId and content as expected by the server
      const messageData = {
        conversationId,
        content: messageContent,
      };

      const response = await messageService.sendMessage(messageData);

      // Send via API
      const response = await messageService.sendMessage(messageData);

      // Only emit via socket, don't add to state here
      // The socket listener will handle adding it
      socket.emit('message:send', {
        ...response.data,
        senderId: currentUser._id,
        receiverId: otherUserId,
        jobId,
      })

       scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // restore message on error
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isOnline = onlineUsers.includes(otherUserId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center shadow-sm">
        <button
          onClick={() => navigate('/messages')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        
        {otherUser?.profileImage ? (
          <img
            src={otherUser.profileImage}
            alt={otherUser.firstName}
            className="w-10 h-10 rounded-full mr-3"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold mr-3">
            {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
          </div>
        )}
        
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">
            {otherUser?.firstName} {otherUser?.lastName}
          </h2>
          <div className="flex items-center text-sm">
            <Circle
              size={8}
              className={`mr-1 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`}
            />
            <span className={isOnline ? 'text-green-600' : 'text-gray-500'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.sender._id === currentUser._id;
          
          return (
            <div
              key={message._id || index}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isOwn
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwn ? 'text-primary-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary-600 text-white p-3 rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}