/**
 * Notification Types
 * Defines data structures for program notifications
 */

export interface WatchLaterProgram {
  id: string; // Unique ID for watch-later entry
  programId: string; // Reference to program
  channelId: string;
  channelName: string;
  programTitle: string;
  programDescription?: string;
  startTime: number; // Unix timestamp
  endTime: number;
  notificationScheduled: boolean;
  notificationId?: string; // Platform notification ID
  createdAt: number;
}

export interface NotificationSettings {
  enableNotifications: boolean;
  notifyMinutesBefore: number; // 5, 10, 15, 30, 60 minutes
  quietHoursStart?: number; // Hour (0-23)
  quietHoursEnd?: number; // Hour (0-23)
}
