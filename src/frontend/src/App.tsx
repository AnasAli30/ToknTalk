import { useState } from "react";
import { Loader, ErrorDisplay } from "./components";
import { 
  GreetingView, 
  CounterView, 
  LlmPromptView, 
  TodoListView, 
  LoginView, 
  ProfileView,
  FeedView,
  ExploreView,
  ProfileDetailsView,
  TrendingView,
  NotificationsView,
  ChatView
} from "./views";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Import icons
import { 
  HomeIcon, 
  UserGroupIcon, 
  HashtagIcon, 
  BellIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon,
  ArrowPathIcon,
  ShareIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

// ToknTalk logo component
const ToknTalkLogo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">T</div>
    <span className="text-xl font-display font-bold bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">ToknTalk</span>
  </div>
);

type Tab = 'home' | 'explore' | 'trending' | 'notifications' | 'profile' | 'chat' | 'demo';

function AppContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { authState, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  const handleCloseProfile = () => {
    setSelectedUserId(null);
  };

  const handleNavigateToChat = () => {
    setSelectedUserId(null);
    setActiveTab('chat');
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <HomeIcon className="w-6 h-6" /> },
    { id: 'explore', label: 'Explore', icon: <UserGroupIcon className="w-6 h-6" /> },
    { id: 'trending', label: 'Trending', icon: <HashtagIcon className="w-6 h-6" /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon className="w-6 h-6" /> },
    { id: 'chat', label: 'Messages', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-6 h-6" /> },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      {/* Header */}
      <header className="bg-background-light border-b border-secondary-800 p-4 shadow-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <ToknTalkLogo />
          
          {authState.isAuthenticated && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary hidden md:block">
                {authState.principal?.slice(0, 8)}...
              </span>
              <button 
                onClick={logout}
                className="p-2 rounded-full hover:bg-secondary-800 text-text-secondary"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-4 p-4">
        {/* Sidebar Navigation */}
        {authState.isAuthenticated && (
          <nav className="hidden w-64 flex-shrink-0 md:block">
            <div className="rounded-xl bg-background-card p-4 shadow-md sticky top-20">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={`w-full rounded-lg p-3 text-left flex items-center gap-3 transition-colors ${
                        activeTab === item.id 
                          ? 'bg-primary text-white font-medium' 
                          : 'text-text-secondary hover:bg-background-light'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  </li>
                ))}
                
                <li className="pt-4">
                  <button
                    onClick={() => setActiveTab('demo')}
                    className={`w-full rounded-lg p-3 text-left flex items-center gap-3 transition-colors ${
                      activeTab === 'demo' 
                        ? 'bg-primary text-white font-medium' 
                        : 'text-text-secondary hover:bg-background-light'
                    }`}
                  >
                    <ArrowPathIcon className="w-6 h-6" />
                    Demo Components
                  </button>
                </li>
              </ul>
              
              {/* Create Post Button */}
              <div className="mt-6">
                <button 
                  className="w-full bg-primary hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-glow"
                  onClick={() => setActiveTab('home')}
                >
                  <ShareIcon className="w-5 h-5" />
                  Create Post
                </button>
              </div>
            </div>
          </nav>
        )}
        
        {/* Mobile Navigation (Bottom) */}
        {authState.isAuthenticated && (
          <div className="fixed bottom-0 left-0 right-0 bg-background-light border-t border-secondary-800 p-2 md:hidden z-10">
            <div className="flex justify-around">
              {navItems.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`p-3 rounded-lg ${
                    activeTab === item.id 
                      ? 'text-primary' 
                      : 'text-text-secondary'
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-0">
          {!authState.isAuthenticated ? (
            <div className="bg-background-card rounded-xl overflow-hidden shadow-md">
              <LoginView />
            </div>
          ) : selectedUserId ? (
            <div className="bg-background-card rounded-xl overflow-hidden shadow-md">
              <ProfileDetailsView 
                userId={selectedUserId} 
                onClose={handleCloseProfile} 
                onNavigateToChat={handleNavigateToChat}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'home' && <FeedView />}
              {activeTab === 'explore' && <ExploreView onViewProfile={setSelectedUserId} />}
              {activeTab === 'trending' && <TrendingView />}
              {activeTab === 'notifications' && <NotificationsView />}
              {activeTab === 'chat' && <ChatView />}
              {activeTab === 'profile' && <ProfileView />}
              
              {activeTab === 'demo' && (
                <>
                  <GreetingView onError={handleError} setLoading={setLoading} />
                  <CounterView onError={handleError} setLoading={setLoading} />
                  <LlmPromptView onError={handleError} setLoading={setLoading} />
                  <TodoListView />
                </>
              )}
            </div>
          )}

          {loading && !error && <Loader />}
          {!!error && <ErrorDisplay message={error} />}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
