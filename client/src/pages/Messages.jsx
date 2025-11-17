import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      // Fetch current user
      const userResponse = await userService.getCurrentUser();
      setCurrentUser(userResponse.data);

      // Fetch conversations
      const convResponse = await messageService.getConversations();
      setConversations(convResponse.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
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
    return conversation.participants.find(p => p._id !== currentUser._id);
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = getOtherParticipant(conv);
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
  const unreadCount = conversation.unreadCount?.get?.(currentUser._id.toString()) || 0;

  return (
    <Link
      key={conversation._id}
      to={`/messages/${conversation.job._id}/${otherUser._id}`}
      className="flex items-center p-4 border-b hover:bg-gray-50 transition-colors"
    >
      {/* Avatar omitted for brevity */}

      <div className="flex-1 ml-4 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 truncate">
            {otherUser.firstName} {otherUser.lastName}
          </h3>
          {(() => {
            // Use last message’s createdAt if present, otherwise fall back to updatedAt
            const timestamp =
              conversation.lastMessage?.createdAt ?? conversation.updatedAt;
            return (
              <span className="text-sm text-gray-500 ml-2">
                {formatTime(timestamp)}
              </span>
            );
          })()}
        </div>
        <p className="text-sm text-primary-600 mb-1 truncate">
          {conversation.job?.title}
        </p>
        <p
          className={`text-sm truncate ${
            unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
          }`}
        >
          {conversation.lastMessage?.content || 'No messages yet'}
        </p>
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