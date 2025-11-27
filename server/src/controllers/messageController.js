import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.userId });

    const conversations = await Conversation.find({
      participants: user._id,
    })
      .populate('participants', 'firstName lastName profileImage')
      .populate('job', 'title')
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message,
    });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/conversation/:jobId/:otherUserId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { jobId, otherUserId } = req.params;
    const user = await User.findOne({ clerkId: req.userId });

    const messages = await Message.find({
      job: jobId,
      $or: [
        { sender: user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: user._id },
      ],
    })
      .populate('sender', 'firstName lastName profileImage')
      .populate('receiver', 'firstName lastName profileImage')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        job: jobId,
        sender: otherUserId,
        receiver: user._id,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message,
    });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, jobId, content } = req.body;
    const user = await User.findOne({ clerkId: req.userId });

    if (!receiverId || !jobId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide receiver, job, and content',
      });
    }

    // Create message
    const message = await Message.create({
      sender: user._id,
      receiver: receiverId,
      job: jobId,
      content,
    });

    await message.populate('sender', 'firstName lastName profileImage');
    await message.populate('receiver', 'firstName lastName profileImage');

    // Update or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [user._id, receiverId] },
      job: jobId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [user._id, receiverId],
        job: jobId,
        lastMessage: content,
        lastMessageAt: new Date(),
        unreadCount: {
          [receiverId]: 1,
        },
      });
    } else {
      conversation.lastMessage = content;
      conversation.lastMessageAt = new Date();
      
      // Increment unread count for receiver
      const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
      conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
      
      await conversation.save();
    }

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message,
    });
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/messages/read/:conversationId
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const user = await User.findOne({ clerkId: req.userId });

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Reset unread count for current user
    conversation.unreadCount.set(user._id.toString(), 0);
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking as read',
      error: error.message,
    });
  }
};