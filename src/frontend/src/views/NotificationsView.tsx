import { useEffect, useState } from 'react';
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
    return new Date(Number(timestamp) / 1000000).toLocaleString();
  };

  const getUsernameForId = (userId: string) => {
    return userProfiles[userId]?.username || userId.slice(0, 8) + '...';
  };

  const renderNotificationContent = (notification: Notification) => {
    const t = notification.notification_type;
    if ('Like' in t) {
      return (
        <div>
          <span className="font-bold">{getUsernameForId(principalToString(t.Like.user_id))}</span>
          <span> liked your post</span>
        </div>
      );
    } else if ('Comment' in t) {
      return (
        <div>
          <span className="font-bold">{getUsernameForId(principalToString(t.Comment.user_id))}</span>
          <span> commented on your post</span>
        </div>
      );
    } else if ('Follow' in t) {
      return (
        <div>
          <span className="font-bold">{getUsernameForId(principalToString(t.Follow.user_id))}</span>
          <span> started following you</span>
        </div>
      );
    } else if ('Mention' in t) {
      return (
        <div>
          <span className="font-bold">{getUsernameForId(principalToString(t.Mention.user_id))}</span>
          <span> mentioned you in a post</span>
        </div>
      );
    }
    return <div>Unknown notification type</div>;
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="bg-gray-700 rounded-lg p-6 shadow-md">
        <div className="text-center text-gray-400">Please log in to view notifications</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Notifications</h3>
        {notifications.length > 0 && (
          <Button 
            onClick={markAllAsRead} 
            className="bg-blue-600 hover:bg-blue-700 text-sm"
          >
            Mark all as read
          </Button>
        )}
      </div>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {loading ? (
        <div className="text-gray-300">Loading notifications...</div>
      ) : (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-gray-400">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id.toString()} 
                className={`bg-gray-800 rounded-lg p-4 flex justify-between items-center ${!notification.read ? 'border-l-4 border-blue-500' : ''}`}
              >
                <div className="flex-1">
                  <div className="text-left">
                    {renderNotificationContent(notification)}
                    <div className="text-gray-400 text-sm mt-1">
                      {formatDate(notification.created_at)}
                    </div>
                  </div>
                </div>
                {!notification.read && (
                  <Button 
                    onClick={() => markAsRead(notification.id)} 
                    className="ml-3 bg-gray-600 hover:bg-gray-500 text-sm"
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsView; 