import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const conversations = await Conversation.find({
      participants: user._id,
    })
      .populate('participants', 'firstName lastName profileImage')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      job: jobId,
      participants: { $all: [user._id, otherUserId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        job: jobId,
        participants: [user._id, otherUserId],
      });
    }

    // Get messages
    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'firstName lastName profileImage')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
      conversationId: conversation._id,
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
    const { conversationId, content } = req.body;
    const user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Validate required fields
    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide conversation ID and message content',
      });
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: user._id,
      content,
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    // Populate sender info
    await message.populate('sender', 'firstName lastName profileImage');

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Mark all messages in conversation as read for this user
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: user._id },
        readBy: { $ne: user._id },
      },
      {
        $push: { readBy: user._id },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message,
    });
  }
};
