import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Hash, 
  Bell, 
  MessageCircle, 
  User, 
  RefreshCw, 
  Share2, 
  LogOut,
  Sun,
  Moon,
  Sparkles,
  Wallet,
  Bot,
  Cpu,
  Menu,
  X
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { playNotificationSound, playMessageSound } from './utils/sound';
import { notificationService } from './services/notificationService';
import { 
  LoginView, 
  ProfileView, 
  FeedView, 
  ExploreView, 
  ProfileDetailsView, 
  TrendingView, 
  NotificationsView, 
  ChatView 
} from './views';
import WalletView from './views/WalletView';
import LandingPage from './views/LandingPage';
import ProfileCheck from './components/ProfileCheck';
import { TopNavbar } from './components';

// ToknTalk Logo Component
const ToknTalkLogo = () => (
  <motion.div 
    className="flex items-center space-x-3"
    whileHover={{ scale: 1.05 }}
  >
    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient rounded-xl flex items-center justify-center glow">
      <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
    </div>
    <span className="text-lg sm:text-xl font-bold gradient-text">
      ToknTalk
    </span>
  </motion.div>
);

// Theme Toggle Component
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={toggleTheme}
      className="p-2 sm:p-3 rounded-xl bg-card border border-border hover:border-accent/40 transition-all duration-300 text-text hover:text-accent"
    >
      <AnimatePresence mode="wait">
        {theme === 'dark' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Navigation Item Component
const NavItem = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick, 
  badge 
}: {
  icon: any;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative flex items-center space-x-3 w-full p-3 sm:p-4 rounded-xl transition-all duration-300 ${
      isActive 
        ? 'bg-accent text-white shadow-lg' 
        : 'text-text hover:text-text bg-card hover:bg-card/80 border border-border hover:border-accent/40'
    }`}
  >
    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    <span className="font-medium text-sm sm:text-base">{label}</span>
    {badge && badge > 0 && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-error text-white rounded-full text-xs flex items-center justify-center font-bold"
      >
        {badge > 99 ? '99+' : badge}
      </motion.div>
    )}
  </motion.button>
);

// Mobile Navigation Menu
const MobileNavMenu = ({ 
  isOpen, 
  onClose, 
  currentView, 
  onNavigate,
  onLogout,
  notificationsCount = 0,
  messagesCount = 0
}: {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: 'feed' | 'explore' | 'trending' | 'notifications' | 'chat' | 'profile' | 'wallet') => void;
  onLogout: () => void;
  notificationsCount?: number;
  messagesCount?: number;
}) => {
  const navigationItems = [
    { icon: Home, label: 'Home', view: 'feed' as const },
    { icon: Hash, label: 'Trending', view: 'trending' as const },
    { icon: Wallet, label: 'Wallet', view: 'wallet' as const },
    { icon: User, label: 'Profile', view: 'profile' as const },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Mobile Menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="fixed left-0 top-0 h-full w-80 bg-card/95 backdrop-blur-md border-r border-border z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <ToknTalkLogo />
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-background hover:bg-background/80 transition-colors"
                >
                  <X className="w-5 h-5 text-text" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-3">
              {navigationItems.map((item) => (
                <NavItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentView === item.view}
                  onClick={() => {
                    onNavigate(item.view);
                    onClose();
                  }}
                />
              ))}
              
              {/* Additional Mobile Actions */}
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onNavigate('notifications');
                      onClose();
                    }}
                    className={`relative flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                      currentView === 'notifications'
                        ? 'bg-accent text-white'
                        : 'text-text hover:text-text bg-card hover:bg-card/80 border border-border hover:border-accent/40'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span className="font-medium text-sm">Notifications</span>
                    {notificationsCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white rounded-full text-xs flex items-center justify-center font-bold"
                      >
                        {notificationsCount > 99 ? '99+' : notificationsCount}
                      </motion.div>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onNavigate('chat');
                      onClose();
                    }}
                    className={`relative flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                      currentView === 'chat'
                        ? 'bg-accent text-white'
                        : 'text-text hover:text-text bg-card hover:bg-card/80 border border-border hover:border-accent/40'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium text-sm">Chat</span>
                    {messagesCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white rounded-full text-xs flex items-center justify-center font-bold"
                      >
                        {messagesCount > 99 ? '99+' : messagesCount}
                      </motion.div>
                    )}
                  </motion.button>
                </div>
              </div>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border space-y-3">
              <ThemeToggle />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center space-x-3 w-full p-3 rounded-xl text-error hover:bg-error/10 transition-all duration-300 bg-card border border-error/20 hover:border-error/40"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium text-sm">Logout</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Main App Content
const AppContent = () => {
  const { authState, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'feed' | 'explore' | 'trending' | 'notifications' | 'chat' | 'profile' | 'wallet'>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatTargetUserId, setChatTargetUserId] = useState<string | null>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [profileComplete, setProfileComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Start polling for notifications and messages
  useEffect(() => {
    if (authState.isAuthenticated && profileComplete) {
      notificationService.startPolling(
        (count) => setNotificationsCount(count),
        (count) => setMessagesCount(count),
        10000 // 10 seconds
      );

      return () => {
        notificationService.stopPolling();
      };
    }
  }, [authState.isAuthenticated, profileComplete]);

  const handleLogout = () => {
    // Clear profile ID from localStorage on logout
    localStorage.removeItem('tokntalk_profile_id');
    logout();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Navigate to explore for search results
    setCurrentView('explore');
  };

  const handleNavigateToNotifications = () => {
    setCurrentView('notifications');
    // Reset notification count when user navigates to notifications
    notificationService.resetNotificationCount();
    setNotificationsCount(0);
  };

  const handleNavigateToChat = () => {
    // Store the current selected user as the chat target
    if (selectedUserId) {
      setChatTargetUserId(selectedUserId);
    }
    setCurrentView('chat');
    setSelectedUserId(null); // Close the profile modal
    // Reset message count when user navigates to chat
    notificationService.resetMessageCount();
    setMessagesCount(0);
  };

  // If not authenticated, show landing page
  if (!authState.isAuthenticated) {
    return <LandingPage />;
  }

  // If authenticated but profile not complete, show profile check
  if (!profileComplete) {
    return <ProfileCheck onProfileComplete={() => setProfileComplete(true)} />;
  }

  const navigationItems = [
    { icon: Home, label: 'Home', view: 'feed' as const },
    { icon: Hash, label: 'Trending', view: 'trending' as const },
    { icon: Wallet, label: 'Wallet', view: 'wallet' as const },
    { icon: User, label: 'Profile', view: 'profile' as const },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'feed':
        return <FeedView searchQuery={searchQuery} onViewProfile={setSelectedUserId} />;
      case 'explore':
        return <ExploreView onViewProfile={setSelectedUserId} searchQuery={searchQuery} />;
      case 'trending':
        return <TrendingView />;
      case 'notifications':
        return <NotificationsView />;
      case 'chat':
        return <ChatView initialUserId={chatTargetUserId || undefined} />;
      case 'wallet':
        return <WalletView onNavigateToUserProfile={setSelectedUserId} />;
      case 'profile':
        return <ProfileView />;
      default:
        return <FeedView searchQuery={searchQuery} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <ToknTalkLogo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-background hover:bg-background/80 transition-colors"
            >
              <Menu className="w-5 h-5 text-text" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="hidden lg:flex w-80 bg-card border-r border-border p-6 flex-col sticky top-0 h-screen overflow-y-auto"
        >
          {/* Logo */}
          <div className="mb-8">
            <ToknTalkLogo />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-3">
            {navigationItems.map((item) => (
              <NavItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                isActive={currentView === item.view}
                onClick={() => {
                  setCurrentView(item.view);
                }}
              />
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="space-y-3 pt-6 border-t border-border">
            <ThemeToggle />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full p-4 rounded-xl text-error hover:bg-error/10 transition-all duration-300 bg-card border border-error/20 hover:border-error/40"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </motion.button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen lg:ml-0">
          {/* Top Navbar - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <TopNavbar
              onSearch={handleSearch}
              onNavigateToNotifications={handleNavigateToNotifications}
              onNavigateToChat={handleNavigateToChat}
              notificationsCount={notificationsCount}
              messagesCount={messagesCount}
              currentView={currentView}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Navigation Menu */}
      <MobileNavMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        notificationsCount={notificationsCount}
        messagesCount={messagesCount}
      />

      {/* Profile Details Modal */}
      <AnimatePresence>
        {selectedUserId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <ProfileDetailsView
              userId={selectedUserId}
              onClose={() => setSelectedUserId(null)}
              onNavigateToChat={handleNavigateToChat}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
