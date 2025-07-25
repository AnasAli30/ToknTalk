import { useState } from 'react';
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
  Cpu
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
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
import LandingPage from './views/LandingPage';
import ProfileCheck from './components/ProfileCheck';

// ToknTalk Logo Component
const ToknTalkLogo = () => (
  <motion.div 
    className="flex items-center space-x-3"
    whileHover={{ scale: 1.05 }}
  >
    <div className="w-10 h-10 bg-gradient rounded-xl flex items-center justify-center glow">
      <Sparkles className="w-6 h-6 text-white" />
    </div>
    <span className="text-xl font-bold gradient-text">
      ToknTalk
    </span>
  </motion.div>
);

// Theme Toggle Component
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-3 rounded-xl modern-card border border-accent/20 hover:border-accent/40 transition-all duration-300"
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
            <Sun className="w-5 h-5 text-warning" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5 text-accent" />
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
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`relative flex items-center space-x-3 w-full p-4 rounded-xl transition-all duration-300 ${
      isActive 
        ? 'bg-gradient text-white glow' 
        : 'text-text-secondary hover:text-text hover:modern-card border border-transparent hover:border-accent/20'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
    {badge && badge > 0 && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-1 -right-1 w-5 h-5 bg-error text-error-foreground rounded-full text-xs flex items-center justify-center font-bold"
      >
        {badge > 99 ? '99+' : badge}
      </motion.div>
    )}
  </motion.button>
);

// Main App Content
const AppContent = () => {
  const { authState, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'feed' | 'explore' | 'trending' | 'notifications' | 'chat' | 'profile'>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [profileComplete, setProfileComplete] = useState(false);

  const handleNavigateToChat = () => {
    setCurrentView('chat');
  };

  const handleLogout = () => {
    // Clear profile ID from localStorage on logout
    localStorage.removeItem('tokntalk_profile_id');
    logout();
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
    { icon: Users, label: 'Explore', view: 'explore' as const },
    { icon: Hash, label: 'Trending', view: 'trending' as const },
    { icon: Bell, label: 'Notifications', view: 'notifications' as const, badge: notificationsCount },
    { icon: MessageCircle, label: 'Chat', view: 'chat' as const },
    { icon: User, label: 'Profile', view: 'profile' as const },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'feed':
        return <FeedView />;
      case 'explore':
        return <ExploreView onViewProfile={setSelectedUserId} />;
      case 'trending':
        return <TrendingView />;
      case 'notifications':
        return <NotificationsView />;
      case 'chat':
        return <ChatView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <FeedView />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex">
      {/* Sidebar Navigation */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-80 modern-card border-r border-accent/20 p-6 flex flex-col"
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
              onClick={() => setCurrentView(item.view)}
              badge={item.badge}
            />
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="space-y-3 pt-6 border-t border-accent/20">
          <ThemeToggle />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full p-4 rounded-xl text-error hover:bg-error/10 transition-all duration-300 modern-card border border-error/20 hover:border-error/40"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-y-auto"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

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
