import { backendService } from './backendService';
import { playNotificationSound, playMessageSound } from '../utils/sound';

export interface NotificationCounts {
  notifications: number;
  messages: number;
}

class NotificationService {
  private lastNotificationCount: number = 0;
  private lastMessageCount: number = 0;
  private pollingInterval: NodeJS.Timeout | null = null;

  async getNotificationCounts(): Promise<NotificationCounts> {
    try {
      // Get notifications count
      const notifications = await backendService.getNotifications();
      const unreadNotifications = Array.isArray(notifications) 
        ? notifications.filter((n: any) => {
            if (n.read) return false;
            // Filter out unknown notification types
            const t = n.notification_type;
            return 'Like' in t || 'Comment' in t || 'Follow' in t || 'Mention' in t;
          }).length 
        : 0;

      // Get chat threads count (as a proxy for new messages)
      const chatThreads = await backendService.getChatThreads();
      const messageCount = Array.isArray(chatThreads) ? chatThreads.length : 0;

      return {
        notifications: unreadNotifications,
        messages: messageCount
      };
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      return {
        notifications: 0,
        messages: 0
      };
    }
  }

  startPolling(
    onNotificationCountChange: (count: number) => void,
    onMessageCountChange: (count: number) => void,
    interval: number = 10000 // 10 seconds
  ) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const counts = await this.getNotificationCounts();
        
        // Check if notification count increased
        if (counts.notifications > this.lastNotificationCount) {
          const newNotifications = counts.notifications - this.lastNotificationCount;
          if (newNotifications > 0) {
            playNotificationSound();
          }
          onNotificationCountChange(counts.notifications);
        }
        
        // Check if message count increased
        if (counts.messages > this.lastMessageCount) {
          const newMessages = counts.messages - this.lastMessageCount;
          if (newMessages > 0) {
            playMessageSound();
          }
          onMessageCountChange(counts.messages);
        }

        this.lastNotificationCount = counts.notifications;
        this.lastMessageCount = counts.messages;
      } catch (error) {
        console.error('Error in notification polling:', error);
      }
    }, interval);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Reset counts when user views notifications or messages
  resetNotificationCount() {
    this.lastNotificationCount = 0;
  }

  resetMessageCount() {
    this.lastMessageCount = 0;
  }
}

export const notificationService = new NotificationService(); 