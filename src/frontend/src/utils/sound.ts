// Sound utility for notifications and messages
class SoundManager {
  private notificationAudio: HTMLAudioElement | null = null;
  private messageAudio: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds() {
    try {
      this.notificationAudio = new Audio();
      this.notificationAudio.src = '/sounds/notification.mp3'; // Use your file name
  
      this.messageAudio = new Audio();
      this.messageAudio.src = '/sounds/message.mp3'; // Or another file if you have it
  
      this.notificationAudio.load();
      this.messageAudio.load();
    } catch (error) {
      console.warn('Sound initialization failed:', error);
      this.isEnabled = false;
    }
  }

  public playNotificationSound() {
    if (!this.isEnabled || !this.notificationAudio) return;
    
    try {
      this.notificationAudio.currentTime = 0;
      this.notificationAudio.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  public playMessageSound() {
    if (!this.isEnabled || !this.messageAudio) return;
    
    try {
      this.messageAudio.currentTime = 0;
      this.messageAudio.play().catch(error => {
        console.warn('Failed to play message sound:', error);
      });
    } catch (error) {
      console.warn('Error playing message sound:', error);
    }
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public isSoundEnabled() {
    return this.isEnabled;
  }
}

// Create a singleton instance
export const soundManager = new SoundManager();

// Export individual functions for easier use
export const playNotificationSound = () => soundManager.playNotificationSound();
export const playMessageSound = () => soundManager.playMessageSound();
export const enableSound = () => soundManager.enable();
export const disableSound = () => soundManager.disable();
export const isSoundEnabled = () => soundManager.isSoundEnabled(); 