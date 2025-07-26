import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  MessageCircle, 
  X,
  User,
  Hash
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopNavbarProps {
  onSearch: (query: string) => void;
  onNavigateToNotifications: () => void;
  onNavigateToChat: () => void;
  notificationsCount?: number;
  messagesCount?: number;
  currentView: string;
}

const TopNavbar: React.FC<TopNavbarProps> = ({
  onSearch,
  onNavigateToNotifications,
  onNavigateToChat,
  notificationsCount = 0,
  messagesCount = 0,
  currentView
}) => {
  const { authState } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border"
    >
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search posts, users, or hashtags..."
                  className="w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary focus:border-accent focus:outline-none transition-all duration-300 text-sm sm:text-base"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-background rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4 text-text-secondary" />
                  </button>
                )}
              </div>
              
              {/* Search Suggestions */}
              <AnimatePresence>
                {isSearchFocused && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 backdrop-blur-md"
                  >
                    <div className="p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-text-secondary mb-2">Quick search:</div>
                      <div className="space-y-1 sm:space-y-2">
                        <button
                          type="button"
                          onClick={() => onSearch(`#${searchQuery}`)}
                          className="flex items-center gap-2 w-full p-2 hover:bg-card rounded-lg transition-colors text-left text-sm"
                        >
                          <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                          <span>Search hashtag #{searchQuery}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSearch(`@${searchQuery}`)}
                          className="flex items-center gap-2 w-full p-2 hover:bg-card rounded-lg transition-colors text-left text-sm"
                        >
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                          <span>Search user @{searchQuery}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSearch(searchQuery)}
                          className="flex items-center gap-2 w-full p-2 hover:bg-card rounded-lg transition-colors text-left text-sm"
                        >
                          <Search className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                          <span>Search posts for "{searchQuery}"</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToNotifications}
              className={`relative p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                currentView === 'notifications'
                  ? 'bg-accent text-white'
                  : 'bg-background border border-border hover:border-accent/40 text-text-primary'
              }`}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {notificationsCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold"
                >
                  {notificationsCount > 99 ? '99+' : notificationsCount}
                </motion.div>
              )}
            </motion.button>

            {/* Chat */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToChat}
              className={`relative p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                currentView === 'chat'
                  ? 'bg-accent text-white'
                  : 'bg-background border border-border hover:border-accent/40 text-text-primary'
              }`}
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              {messagesCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold"
                >
                  {messagesCount > 99 ? '99+' : messagesCount}
                </motion.div>
              )}
            </motion.button>

            {/* User Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient overflow-hidden cursor-pointer"
            >
              {authState.principal ? (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                  {authState.principal.slice(0, 2).toUpperCase()}
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TopNavbar; 