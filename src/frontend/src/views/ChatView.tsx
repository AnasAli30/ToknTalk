import { useEffect, useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { backendService } from '../services/backendService';
import { Button, InputField } from '../components';
import { useAuth } from '../context/AuthContext';
import { principalToString } from '../utils/principal';
import { MessageCircle } from 'lucide-react'; // Added for new icon
import { AnimatePresence, motion } from 'framer-motion'; // Added for new animations

// Import types from backend declarations
// Use any for now since the types might not be generated yet
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
  // Add any other properties as needed
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

  // Fetch messages when a thread is selected
  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      
      // Clear existing message polling interval
      if (messagePollingIntervalRef.current) {
        clearInterval(messagePollingIntervalRef.current);
      }
      
      // Start polling for new messages
      messagePollingIntervalRef.current = setInterval(() => {
        fetchMessages(false); // Don't set loading state for polling
      }, MESSAGE_POLLING_INTERVAL);
    } else {
      // Clear message polling when no user is selected
      if (messagePollingIntervalRef.current) {
        clearInterval(messagePollingIntervalRef.current);
      }
    }
    
    return () => {
      if (messagePollingIntervalRef.current) {
        clearInterval(messagePollingIntervalRef.current);
      }
    };
  }, [selectedUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatThreads = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const result = await backendService.getChatThreads();
      
      // Convert principals to strings with null checks
      const threads: ChatThread[] = (result as BackendChatThread[]).map((thread: BackendChatThread) => {
        try {
          return {
            ...thread,
            participants: thread.participants.map(p => p ? principalToString(p) : 'unknown'),
            last_message: thread.last_message ? {
              ...thread.last_message,
              from: thread.last_message.from ? principalToString(thread.last_message.from) : 'unknown',
              to: thread.last_message.to ? principalToString(thread.last_message.to) : 'unknown'
            } : null
          };
        } catch (err) {
          console.error("Error processing chat thread:", err, thread);
          // Return a fallback thread object
          return {
            id: thread.id || 'unknown',
            participants: ['unknown'],
            last_message: null,
            updated_at: thread.updated_at || BigInt(0)
          };
        }
      });
      
      // Sort threads by most recent message
      threads.sort((a, b) => Number(b.updated_at - a.updated_at));
      
      setChatThreads(threads);
      
      // Fetch user profiles for all participants
      const uniqueUsers = new Set<string>();
      threads.forEach(thread => {
        thread.participants.forEach(p => {
          if (p !== 'unknown' && p !== authState.principal) {
            uniqueUsers.add(p);
          }
        });
      });
      
      // Only fetch profiles if we have new users
      const newUsers = Array.from(uniqueUsers).filter(userId => !userProfiles[userId]);
      if (newUsers.length > 0) {
        await fetchUserProfiles(newUsers);
      }
      
    } catch (err) {
      console.error('Error fetching chat threads:', err);
      if (showLoading) {
        setError('Failed to load chat threads');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const fetchUserProfiles = async (userIds: string[]) => {
    const profiles: Record<string, UserProfile> = {};
    
    for (const userId of userIds) {
      try {
        const profileResult = await backendService.getUserProfile(userId);
        if ('Ok' in profileResult) {
          const profile = profileResult.Ok;
          // Only extract the properties we need
          profiles[userId] = {
            id: principalToString(profile.id),
            username: profile.username,
            bio: profile.bio || [],
            avatar_url: profile.avatar_url || []
          };
        }
      } catch (err) {
        console.error(`Failed to fetch profile for ${userId}:`, err);
      }
    }
    
    setUserProfiles(prev => ({...prev, ...profiles}));
  };

  const fetchMessages = async (showLoading = true) => {
    if (!selectedUser) return;
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const result = await backendService.getMessages(selectedUser);
      
      // Convert principals to strings with null checks
      const fetchedMessages: Message[] = (result as BackendMessage[]).map((message: BackendMessage) => {
        try {
          return {
            ...message,
            from: message.from ? principalToString(message.from) : 'unknown',
            to: message.to ? principalToString(message.to) : 'unknown'
          };
        } catch (err) {
          console.error("Error processing message:", err, message);
          // Return a fallback message object
          return {
            id: message.id || BigInt(0),
            from: 'unknown',
            to: 'unknown',
            content: message.content || '',
            created_at: message.created_at || BigInt(0),
            read: message.read || false
          };
        }
      });
      
      // Sort messages by creation time
      fetchedMessages.sort((a, b) => Number(a.created_at - b.created_at));
      
      // Check if we have new messages
      let hasNewMessages = false;
      if (fetchedMessages.length !== messages.length) {
        hasNewMessages = true;
      } else if (fetchedMessages.length > 0) {
        const lastFetchedMessage = fetchedMessages[fetchedMessages.length - 1];
        if (lastMessageTime < lastFetchedMessage.created_at) {
          hasNewMessages = true;
          setLastMessageTime(lastFetchedMessage.created_at);
        }
      }
      
      // Only update state if we have new messages to avoid unnecessary re-renders
      if (hasNewMessages) {
        setMessages(fetchedMessages);
        
        // Mark messages as read if there are unread messages from the selected user
        const unreadMessages = fetchedMessages.filter(m => 
          m.from === selectedUser && !m.read
        );
        
        if (unreadMessages.length > 0) {
          await backendService.markMessagesAsRead(selectedUser);
          
          // Update the threads to reflect read status
          fetchChatThreads(false);
        }
      }
      
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (showLoading) {
        setError('Failed to load messages');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim() || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      setError(null);
      
      // Optimistically add the message to the UI
      const optimisticMessage: Message = {
        id: BigInt(Date.now()),
        from: authState.principal || 'unknown',
        to: selectedUser,
        content: newMessage.trim(),
        created_at: BigInt(Date.now() * 1000000),
        read: false
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      
      // Actually send the message
      await backendService.sendMessage(selectedUser, optimisticMessage.content);
      
      // Refresh messages to get the real message ID
      await fetchMessages(false);
      
      // Also refresh threads to update the last message
      await fetchChatThreads(false);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== BigInt(Date.now())));
      setNewMessage(newMessage.trim());
    } finally {
      setSendingMessage(false);
    }
  };

  const selectThread = (threadId: string, userId: string) => {
    setSelectedThread(threadId);
    setSelectedUser(userId);
    setError(null);
    setLastMessageTime(BigInt(0)); // Reset last message time
  };

  const formatDate = (timestamp: bigint) => {
    try {
      const date = new Date(Number(timestamp) / 1000000);
      const now = new Date();
      
      // If the message is from today, just show the time
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // If the message is from this week, show the day name and time
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Otherwise show the full date
      return date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch (err) {
      console.error("Error formatting date:", err, timestamp);
      return "Unknown date";
    }
  };

  const getOtherParticipant = (thread: ChatThread) => {
    try {
      const otherParticipant = thread.participants.find(p => p !== authState.principal);
      return otherParticipant || '';
    } catch (err) {
      console.error("Error getting other participant:", err, thread);
      return '';
    }
  };

  const getUsernameForId = (userId: string) => {
    try {
      return userProfiles[userId]?.username || userId.slice(0, 8) + '...';
    } catch (err) {
      console.error("Error getting username for ID:", err, userId);
      return "Unknown user";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAvatarUrl = (userId: string) => {
    if (userProfiles[userId]?.avatar_url && userProfiles[userId].avatar_url.length > 0) {
      return userProfiles[userId].avatar_url[0];
    }
    // Return a default avatar
    return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
          <p className="text-text-secondary">Please log in to use chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient rounded-xl flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
          <p className="text-text-secondary">Connect with your community</p>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <span className="text-red-700">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex h-[600px] gap-6">
        {/* Chat threads list */}
        <div className="w-1/3 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="p-4 bg-background border-b border-border font-semibold text-text-primary">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && chatThreads.length === 0 ? (
              <div className="p-4 text-text-secondary">Loading conversations...</div>
            ) : chatThreads.length === 0 ? (
              <div className="p-4 text-text-secondary">No conversations yet</div>
            ) : (
              chatThreads.map(thread => {
                try {
                  const otherUser = getOtherParticipant(thread);
                  const hasUnreadMessages = thread.last_message && 
                    thread.last_message.from !== authState.principal && 
                    !thread.last_message.read;
                    
                  return (
                    <motion.div 
                      key={thread.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-accent/5 transition-all duration-200 ${
                        selectedThread === thread.id ? 'bg-accent/10 border-accent/20' : ''
                      } ${hasUnreadMessages ? 'bg-accent/5' : ''}`}
                      onClick={() => selectThread(thread.id, otherUser)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient overflow-hidden flex-shrink-0">
                          <img 
                            src={getAvatarUrl(otherUser)} 
                            alt={getUsernameForId(otherUser)} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold flex items-center justify-between">
                            <span className="truncate text-text-primary">{getUsernameForId(otherUser)}</span>
                            {hasUnreadMessages && (
                              <span className="w-3 h-3 bg-accent rounded-full flex-shrink-0 ml-2"></span>
                            )}
                          </div>
                          {thread.last_message && (
                            <div className="text-sm text-text-secondary truncate">
                              {thread.last_message.from === authState.principal ? 'You: ' : ''}
                              {thread.last_message.content}
                            </div>
                          )}
                          <div className="text-xs text-text-muted mt-1">
                            {formatDate(thread.updated_at)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                } catch (err) {
                  console.error("Error rendering chat thread:", err, thread);
                  return null; // Skip rendering this thread
                }
              }).filter(Boolean) // Filter out null values
            )}
          </div>
        </div>
        
        {/* Chat messages */}
        <div className="w-2/3 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
          {selectedUser ? (
            <>
              <div className="p-4 bg-background border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient overflow-hidden">
                  <img 
                    src={getAvatarUrl(selectedUser)} 
                    alt={getUsernameForId(selectedUser)} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-semibold text-text-primary">{getUsernameForId(selectedUser)}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-text-secondary py-8">
                    {loading ? 'Loading messages...' : 'No messages yet. Say hello!'}
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isLastInGroup = index === messages.length - 1 || 
                      messages[index + 1].from !== message.from;
                    
                    return (
                      <motion.div 
                        key={message.id.toString()}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${
                          message.from === authState.principal
                            ? 'ml-auto'
                            : ''
                        } max-w-[80%]`}
                      >
                        {/* Message bubble */}
                        <div className={`p-3 rounded-xl ${
                          message.from === authState.principal
                            ? 'bg-accent text-white rounded-br-md'
                            : 'bg-background border border-border rounded-bl-md'
                        }`}>
                          <div className="text-sm">{message.content}</div>
                        </div>
                        
                        {/* Timestamp and read status */}
                        {isLastInGroup && (
                          <div className={`text-xs text-text-muted mt-1 flex ${
                            message.from === authState.principal ? 'justify-end' : ''
                          }`}>
                            <span>{formatDate(message.created_at)}</span>
                            {message.from === authState.principal && (
                              <span className="ml-2">
                                {message.read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 bg-background border-t border-border flex gap-3">
                <InputField
                  value={newMessage}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyDown={handleKeyDown}
                  disabled={sendingMessage}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={loading || sendingMessage || !newMessage.trim()}
                  className="bg-accent hover:bg-accent/90 text-white px-6"
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-8">
              <div className="w-20 h-20 mb-6 text-6xl">💬</div>
              <div className="text-xl font-semibold mb-3 text-text-primary">Your Messages</div>
              <p className="text-center text-sm max-w-md">
                Select a conversation to start chatting or find new people to message in the Explore tab.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatView; 