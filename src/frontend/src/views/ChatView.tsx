import { useEffect, useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  User, 
  Calendar,
  Loader2,
  ArrowLeft,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { backendService } from '../services/backendService';
import { Button, InputField } from '../components';
import { useAuth } from '../context/AuthContext';
import { principalToString } from '../utils/principal';

// Import types from backend declarations
interface BackendChatThread {
  id: string;
  participants: any[];
  last_message: any;
  updated_at: bigint;
}

interface BackendMessage {
  id: bigint;
  from: any;
  to: any;
  content: string;
  created_at: bigint;
  read: boolean;
}

interface ChatThread extends Omit<BackendChatThread, 'participants' | 'last_message'> {
  participants: string[];
  last_message: Message | null;
}

interface Message extends Omit<BackendMessage, 'from' | 'to'> {
  from: string;
  to: string;
}

interface UserProfile {
  id: string;
  username: string;
  bio: string[];
  avatar_url: string[];
}

interface ChatViewProps {
  initialUserId?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ initialUserId }) => {
  const { authState } = useAuth();
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState<bigint>(BigInt(0));
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagePollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Constants for polling intervals (in milliseconds)
  const THREAD_POLLING_INTERVAL = 3000; // Poll for new threads every 3 seconds
  const MESSAGE_POLLING_INTERVAL = 1500; // Poll for new messages every 1.5 seconds

  // Fetch chat threads on component mount
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchChatThreads();
      
      // Start polling for new threads
      pollingIntervalRef.current = setInterval(() => {
        if (!selectedUser) {
          fetchChatThreads(false); // Don't set loading state for polling
        }
      }, THREAD_POLLING_INTERVAL);
      
      return () => {
        // Clean up intervals on unmount
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        if (messagePollingIntervalRef.current) {
          clearInterval(messagePollingIntervalRef.current);
        }
      };
    }
  }, [authState.isAuthenticated]);

  // Handle initial user ID when navigating from profile
  useEffect(() => {
    if (initialUserId && authState.isAuthenticated) {
      // Set the selected user to start chatting with them
      setSelectedUser(initialUserId);
    }
  }, [initialUserId, authState.isAuthenticated]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatThreads = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const threads = await backendService.getChatThreads() as BackendChatThread[];
      
      const formattedThreads: ChatThread[] = threads.map(thread => {
        // Handle last_message which might be an array or object
        const lastMsg = Array.isArray(thread.last_message) ? thread.last_message[0] : thread.last_message;
        
        return {
          id: thread.id,
          participants: thread.participants.map(p => {
            // Handle both Principal objects and strings
            if (typeof p === 'string') {
              return p;
            } else if (p && typeof p.toString === 'function') {
              return p.toString();
            } else {
              console.warn('Invalid participant:', p);
              return '';
            }
          }).filter(p => p !== ''),
          last_message: lastMsg ? {
            id: lastMsg.id,
            from: typeof lastMsg.from === 'string' ? lastMsg.from : principalToString(lastMsg.from),
            to: typeof lastMsg.to === 'string' ? lastMsg.to : principalToString(lastMsg.to),
            content: lastMsg.content,
            created_at: lastMsg.created_at,
            read: lastMsg.read
          } : null,
          updated_at: thread.updated_at
        };
      });
      
      setChatThreads(formattedThreads);
      
      // Fetch user profiles for all participants
      const allUserIds = new Set<string>();
      formattedThreads.forEach(thread => {
        thread.participants.forEach(userId => {
          if (userId !== authState.principal) {
            allUserIds.add(userId);
          }
        });
      });
      
      if (allUserIds.size > 0) {
        await fetchUserProfiles(Array.from(allUserIds));
      }
    } catch (err) {
      console.error('Error fetching chat threads:', err);
      setError('Failed to load chat threads');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchUserProfiles = async (userIds: string[]) => {
    try {
      const profiles: Record<string, UserProfile> = {};
      
      for (const userId of userIds) {
        try {
          const result = await backendService.getUserProfile(userId);
          if ('Ok' in result) {
            const profile = result.Ok;
            profiles[userId] = { ...profile, id: typeof profile.id === 'string' ? profile.id : principalToString(profile.id) };
          }
        } catch (err) {
          // Ignore individual profile fetch errors
        }
      }
      
      setUserProfiles(prev => ({ ...prev, ...profiles }));
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    }
  };

  const fetchMessages = async (showLoading = true) => {
    if (!selectedUser) return;
    
    try {
      if (showLoading) setLoading(true);
      
      const messagesData = await backendService.getMessages(selectedUser) as BackendMessage[];
      
      const formattedMessages: Message[] = messagesData.map(msg => ({
        id: msg.id,
        from: typeof msg.from === 'string' ? msg.from : principalToString(msg.from),
        to: typeof msg.to === 'string' ? msg.to : principalToString(msg.to),
        content: msg.content,
        created_at: msg.created_at,
        read: msg.read
      }));
      
      // Sort messages by timestamp (oldest first)
      const sortedMessages = formattedMessages.sort((a, b) => {
        const timeA = typeof a.created_at === 'bigint' ? Number(a.created_at) : a.created_at;
        const timeB = typeof b.created_at === 'bigint' ? Number(b.created_at) : b.created_at;
        return timeA - timeB;
      });
      
      setMessages(sortedMessages);
      
      // Update last message time for polling
      if (formattedMessages.length > 0) {
        const latestMessage = formattedMessages[formattedMessages.length - 1];
        setLastMessageTime(latestMessage.created_at);
      }
      
      // Start polling for new messages
      if (messagePollingIntervalRef.current) {
        clearInterval(messagePollingIntervalRef.current);
      }
      
      messagePollingIntervalRef.current = setInterval(async () => {
        try {
          const newMessagesData = await backendService.getMessages(selectedUser) as BackendMessage[];
          const newFormattedMessages: Message[] = newMessagesData.map(msg => ({
            id: msg.id,
            from: typeof msg.from === 'string' ? msg.from : principalToString(msg.from),
            to: typeof msg.to === 'string' ? msg.to : principalToString(msg.to),
            content: msg.content,
            created_at: msg.created_at,
            read: msg.read
          }));
          
          // Sort new messages by timestamp (oldest first)
          const sortedNewMessages = newFormattedMessages.sort((a, b) => {
            const timeA = typeof a.created_at === 'bigint' ? Number(a.created_at) : a.created_at;
            const timeB = typeof b.created_at === 'bigint' ? Number(b.created_at) : b.created_at;
            return timeA - timeB;
          });
          
          // Only update if there are new messages
          if (sortedNewMessages.length > formattedMessages.length) {
            setMessages(sortedNewMessages);
            setLastMessageTime(sortedNewMessages[sortedNewMessages.length - 1].created_at);
          }
        } catch (err) {
          console.error('Error polling for new messages:', err);
        }
      }, MESSAGE_POLLING_INTERVAL);
      
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !authState.isAuthenticated) return;

    // Debug log for selectedUser and newMessage
    console.log('Sending message to:', selectedUser, 'Message:', newMessage);

    try {
      setSendingMessage(true);
      setError(null);
      
      const result = await backendService.sendMessage(selectedUser, newMessage);
      
      if (result) {
        setNewMessage('');
        // Fetch updated messages
        await fetchMessages(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const selectThread = (threadId: string, userId: string) => {
    setSelectedThread(threadId);
    setSelectedUser(userId);
    setMessages([]);
    setNewMessage('');
    
    // Fetch messages for the selected user
    fetchMessages();
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (thread: ChatThread) => {
    return thread.participants.find(userId => userId !== authState.principal) || '';
  };

  const getUsernameForId = (userId: string) => {
    return userProfiles[userId]?.username || userId.slice(0, 8);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAvatarUrl = (userId: string) => {
    return userProfiles[userId]?.avatar_url[0] || '';
  };

  const filteredThreads = chatThreads.filter(thread => {
    const otherUser = getOtherParticipant(thread);
    const username = getUsernameForId(otherUser);
    return username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading && chatThreads.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="ml-3 text-text-secondary">Loading chats...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex h-[600px] sm:h-[700px]">
          {/* Chat Threads Sidebar */}
          <div className={`w-full sm:w-80 border-r border-border flex flex-col ${selectedUser ? 'hidden sm:flex' : 'flex'}`}>
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold text-text">Messages</h2>
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text focus:border-accent focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="p-6 text-center text-text-secondary">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start a conversation with someone!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredThreads.map((thread) => {
                    const otherUser = getOtherParticipant(thread);
                    const username = getUsernameForId(otherUser);
                    const avatarUrl = getAvatarUrl(otherUser);
                    const isSelected = selectedUser === otherUser;
                    
                    return (
                      <motion.button
                        key={thread.id}
                        onClick={() => selectThread(thread.id, otherUser)}
                        className={`w-full p-4 text-left hover:bg-background transition-colors ${
                          isSelected ? 'bg-background border-r-2 border-accent' : ''
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient overflow-hidden flex-shrink-0">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                {username.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-text truncate">{username}</div>
                            {thread.last_message && (
                              <div className="text-text-secondary text-sm truncate">
                                {thread.last_message.content}
                              </div>
                            )}
                          </div>
                          {thread.last_message && (
                            <div className="text-text-secondary text-xs">
                              {formatDate(thread.last_message.created_at)}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className={`flex-1 flex flex-col ${selectedUser ? 'flex' : 'hidden sm:flex'}`}>
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="sm:hidden p-2 rounded-lg hover:bg-background transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-text-secondary" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient overflow-hidden">
                    {getAvatarUrl(selectedUser) ? (
                      <img src={getAvatarUrl(selectedUser)} alt={getUsernameForId(selectedUser)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                        {getUsernameForId(selectedUser).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-text">{getUsernameForId(selectedUser)}</div>
                    <div className="text-text-secondary text-sm">Active now</div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-background transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.from === authState.principal;
                      
                      return (
                        <motion.div
                          key={message.id.toString()}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs sm:max-w-md lg:max-w-lg ${
                            isOwnMessage ? 'bg-accent text-white' : 'bg-background border border-border'
                          } rounded-lg p-3`}>
                            <div className="text-sm">{message.content}</div>
                            <div className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-white/70' : 'text-text-secondary'
                            }`}>
                              {formatDate(message.created_at)}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-3">
                    <input
                      value={newMessage}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-text focus:border-accent focus:outline-none"
                      disabled={sendingMessage}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      className="bg-accent hover:bg-accent/80 text-white px-4 py-2"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-error text-sm mt-2 p-2 bg-error/10 rounded-lg border border-error/20"
                    >
                      {error}
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-secondary">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a conversation</p>
                  <p className="text-sm mt-1">Choose a chat to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView; 