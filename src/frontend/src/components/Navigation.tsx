import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UserGroupIcon, 
  HashtagIcon, 
  BellIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  isAuthenticated,
}) => {
  const location = useLocation();
  
  // Don't show navigation on auth pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'explore', icon: UserGroupIcon, label: 'Explore' },
    { id: 'trending', icon: HashtagIcon, label: 'Trending' },
    { id: 'notifications', icon: BellIcon, label: 'Notifications' },
    { id: 'chat', icon: ChatBubbleLeftRightIcon, label: 'Messages' },
    { id: 'profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-gray-200 dark:border-gray-800 md:relative md:border-r md:border-t-0 md:h-screen md:w-20 lg:w-64 md:flex md:flex-col md:justify-between">
      <div className="md:flex-1 md:overflow-y-auto">
        {/* Logo - Desktop */}
        <div className="hidden md:flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">T</div>
            <span className="text-xl font-heading font-bold text-foreground hidden lg:block">ToknTalk</span>
          </div>
        </div>
        
        {/* Navigation Items */}
        <div className="flex md:flex-col items-center justify-around md:justify-start md:space-y-1 p-2 md:p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center justify-center w-full p-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-accent/10 text-accent' 
                    : 'text-foreground-secondary hover:bg-background-accent hover:text-foreground'
                }`}
                aria-label={item.label}
              >
                <Icon className="h-6 w-6" />
                <span className="ml-3 hidden lg:inline-block">{item.label}</span>
                {item.id === 'notifications' && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    3
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Toggle and Logout */}
      <div className="hidden md:flex flex-col p-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-secondary hidden lg:inline-block">Theme</span>
          <ThemeToggle />
        </div>
        
        {isAuthenticated && (
          <button
            onClick={onLogout}
            className="flex items-center justify-center w-full p-3 rounded-lg text-foreground-secondary hover:bg-background-accent hover:text-foreground transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="ml-3 hidden lg:inline-block">Logout</span>
          </button>
        )}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex items-center justify-around bg-card p-2 shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`p-3 rounded-full transition-colors ${
                isActive 
                  ? 'text-accent' 
                  : 'text-foreground-secondary'
              }`}
              aria-label={item.label}
            >
              <Icon className="h-6 w-6" />
              {item.id === 'notifications' && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              )}
            </button>
          );
        })}
        
        <div className="relative">
          <button
            onClick={() => onTabChange('profile')}
            className={`p-1 rounded-full transition-colors ${
              activeTab === 'profile' 
                ? 'ring-2 ring-accent' 
                : ''
            }`}
            aria-label="Profile"
          >
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-accent" />
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
