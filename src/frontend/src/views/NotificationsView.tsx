import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Check, CheckCheck } from 'lucide-react';
import { backendService } from '../services/backendService';
import { Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { principalToString } from '../utils/principal';
import type { Notification as BackendNotification, UserProfile as BackendUserProfile } from '../../../declarations/backend/backend.did';

interface Notification extends Omit<BackendNotification, 'recipient'> {
  recipient: string;
}
interface UserProfile extends Omit<BackendUserProfile, 'id'> {
  id: string;
}

const NotificationsView = () => {
  const { authState } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchNotifications();
    }
  }, [authState.isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await backendService.getNotifications() as BackendNotification[];
      // Convert recipient Principal to string
      const notifications: Notification[] = result.map((n: BackendNotification) => ({
        ...n,
        recipient: principalToString(n.recipient),
      }));
      setNotifications(notifications);
      // Extract all user IDs from notifications
      const userIds = new Set<string>();
      notifications.forEach(notification => {
        const t = notification.notification_type;
        if ('Like' in t) userIds.add(principalToString(t.Like.user_id));
        if ('Comment' in t) userIds.add(principalToString(t.Comment.user_id));
        if ('Follow' in t) userIds.add(principalToString(t.Follow.user_id));
        if ('Mention' in t) userIds.add(principalToString(t.Mention.user_id));
      });
      // Fetch profiles for all users
      const profiles: Record<string, UserProfile> = {};
      for (const userId of userIds) {
        try {
          const profileResult = await backendService.getUserProfile(userId);
          if ('Ok' in profileResult) {
            const profile = profileResult.Ok;
            profiles[userId] = { ...profile, id: principalToString(profile.id) };
          }
        } catch (err) {
          // ignore
        }
      }
      setUserProfiles(profiles);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await backendService.markAllNotificationsAsRead();
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true
      })));
    } catch (err) {
      setError('Failed to mark notifications as read');
    }
  };

  const markAsRead = async (notificationId: bigint) => {
    try {
      await backendService.markNotificationAsRead(notificationId);
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
    } catch (err) {
      setError('Failed to mark notification as read');
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString();
  };

  const getUsernameForId = (userId: string) => {
    return userProfiles[userId]?.username || userId.slice(0, 8) + '...';
  };

  const getNotificationIcon = (notification: Notification) => {
    const t = notification.notification_type;
    if ('Like' in t) {
      return <Heart className="w-5 h-5 text-red-500" />;
    } else if ('Comment' in t) {
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    } else if ('Follow' in t) {
      return <UserPlus className="w-5 h-5 text-green-500" />;
    } else if ('Mention' in t) {
      return <AtSign className="w-5 h-5 text-purple-500" />;
    }
    return <Bell className="w-5 h-5 text-text-secondary" />;
  };

  const renderNotificationContent = (notification: Notification) => {
    const t = notification.notification_type;
    if ('Like' in t) {
      return (
        <div>
          <span className="font-semibold text-text-primary">{getUsernameForId(principalToString(t.Like.user_id))}</span>
          <span className="text-text-secondary"> liked your post</span>
        </div>
      );
    } else if ('Comment' in t) {
      return (
        <div>
          <span className="font-semibold text-text-primary">{getUsernameForId(principalToString(t.Comment.user_id))}</span>
          <span className="text-text-secondary"> commented on your post</span>
        </div>
      );
    } else if ('Follow' in t) {
      return (
        <div>
          <span className="font-semibold text-text-primary">{getUsernameForId(principalToString(t.Follow.user_id))}</span>
          <span className="text-text-secondary"> started following you</span>
        </div>
      );
    } else if ('Mention' in t) {
      return (
        <div>
          <span className="font-semibold text-text-primary">{getUsernameForId(principalToString(t.Mention.user_id))}</span>
          <span className="text-text-secondary"> mentioned you in a post</span>
        </div>
      );
    }
    return <div className="text-text-secondary">Unknown notification type</div>;
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
          <p className="text-text-secondary">Please log in to view notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
            <p className="text-text-secondary">Stay updated with your activity</p>
          </div>
        </div>
        {notifications.length > 0 && (
          <Button 
            onClick={markAllAsRead} 
            className="flex items-center space-x-2 bg-accent hover:bg-accent/90 text-white"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </Button>
        )}
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

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-3 text-text-secondary">Loading notifications...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
              <p className="text-text-secondary">No notifications yet</p>
              <p className="text-sm text-text-muted mt-2">Start interacting with others to see notifications here!</p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.id.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-card rounded-xl p-4 border border-border hover:border-accent/20 transition-all duration-300 ${
                  !notification.read ? 'border-l-4 border-l-accent bg-accent/5' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-left">
                      {renderNotificationContent(notification)}
                      <div className="text-sm text-text-muted mt-1">
                        {formatDate(notification.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  {!notification.read && (
                    <Button 
                      onClick={() => markAsRead(notification.id)} 
                      className="flex-shrink-0 bg-background border border-border hover:bg-accent/10 text-sm"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsView; 