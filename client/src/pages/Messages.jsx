import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { messageService } from '../services/messageService';
import { userService } from '../services/userService';
import { setAuthToken } from '../services/api';
import { Link } from 'react-router-dom';
import { MessageCircle, Search } from 'lucide-react';

export default function Messages() {
  const { getToken } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      // Fetch current user
      const userResponse = await userService.getCurrentUser();
      if (!isMountedRef.current) return;
      setCurrentUser(userResponse.data);

      // Fetch conversations
      const convResponse = await messageService.getConversations();
      if (!isMountedRef.current) return;
      setConversations(convResponse.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const formatTime = (date) => {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation?.participants || !currentUser?._id) return null;
    return conversation.participants.find(p => p?._id !== currentUser._id);
  };

  const filteredConversations = conversations.filter(conv => {
    if (!conv) return false;
    const otherUser = getOtherParticipant(conv);
    if (!otherUser) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser?.firstName?.toLowerCase().includes(searchLower) ||
      otherUser?.lastName?.toLowerCase().includes(searchLower) ||
      conv.job?.title?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            💬 Messages
          </h1>
          <p className="text-xl text-gray-600">
            Chat with clients and freelancers
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Start chatting with clients or freelancers on your active jobs'}
            </p>
            <Link to="/jobs" className="btn-primary inline-block">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {filteredConversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation);
              
              // Skip if missing required data
              if (!otherUser || !conversation.job) {
                return null;
              }
              
              // Handle unreadCount which might be a Map or plain object
              let unreadCount = 0;
              if (conversation.unreadCount) {
                if (typeof conversation.unreadCount.get === 'function') {
                  unreadCount = conversation.unreadCount.get(currentUser._id.toString()) || 0;
                } else if (typeof conversation.unreadCount === 'object') {
                  unreadCount = conversation.unreadCount[currentUser._id.toString()] || 0;
                }
              }

              return (
                <Link
                  key={conversation._id}
                  to={`/messages/${conversation.job._id}/${otherUser._id}`}
                  className="flex items-center p-4 border-b hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  {otherUser.profileImage ? (
                    <img
                      src={otherUser.profileImage}
                      alt={otherUser.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                      {otherUser.firstName?.[0]}{otherUser.lastName?.[0]}
                    </div>
                  )}

                  <div className="flex-1 ml-4 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {otherUser.firstName} {otherUser.lastName}
                      </h3>
                      <span className="text-sm text-gray-500 ml-2">
                        {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-primary-600 mb-1 truncate">
                      {conversation.job?.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm truncate ${
                          unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}