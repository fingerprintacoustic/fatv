/**
 * Notifications Context Provider
 * Manages program notifications and watch-later functionality
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { WatchLaterProgram, NotificationSettings } from "@/lib/types/notifications";

interface NotificationsContextType {
  // Watch Later
  watchLaterPrograms: WatchLaterProgram[];
  addToWatchLater: (program: Omit<WatchLaterProgram, "id" | "createdAt" | "notificationScheduled">) => Promise<void>;
  removeFromWatchLater: (id: string) => Promise<void>;
  isInWatchLater: (programId: string) => boolean;

  // Notifications
  settings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  scheduleNotification: (program: WatchLaterProgram) => Promise<void>;
  cancelNotification: (id: string) => Promise<void>;

  // Status
  isLoading: boolean;
  error: string | null;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WATCH_LATER: "@fatv_watch_later",
  NOTIFICATION_SETTINGS: "@fatv_notification_settings",
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enableNotifications: true,
  notifyMinutesBefore: 15,
};

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [watchLaterPrograms, setWatchLaterPrograms] = useState<WatchLaterProgram[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize notifications
  useEffect(() => {
    initializeNotifications();
  }, []);

  // Load saved data
  useEffect(() => {
    loadSavedData();
  }, []);

  // Save watch later programs
  useEffect(() => {
    saveWatchLaterPrograms();
  }, [watchLaterPrograms]);

  // Save settings
  useEffect(() => {
    saveNotificationSettings();
  }, [settings]);

  async function initializeNotifications() {
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Notification permissions not granted");
      }

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch (err) {
      console.error("Error initializing notifications:", err);
    }
  }

  async function loadSavedData() {
    try {
      const [watchLaterData, settingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WATCH_LATER),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS),
      ]);

      if (watchLaterData) {
        setWatchLaterPrograms(JSON.parse(watchLaterData));
      }

      if (settingsData) {
        setSettings(JSON.parse(settingsData));
      }
    } catch (err) {
      console.error("Error loading saved notification data:", err);
    }
  }

  async function saveWatchLaterPrograms() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WATCH_LATER, JSON.stringify(watchLaterPrograms));
    } catch (err) {
      console.error("Error saving watch later programs:", err);
    }
  }

  async function saveNotificationSettings() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error("Error saving notification settings:", err);
    }
  }

  async function addToWatchLater(program: Omit<WatchLaterProgram, "id" | "createdAt" | "notificationScheduled">) {
    try {
      const newProgram: WatchLaterProgram = {
        ...program,
        id: `wl-${Date.now()}`,
        createdAt: Date.now(),
        notificationScheduled: false,
      };

      setWatchLaterPrograms((prev) => [...prev, newProgram]);

      // Schedule notification if enabled
      if (settings.enableNotifications) {
        await scheduleNotification(newProgram);
      }
    } catch (err) {
      setError(`Failed to add to watch later: ${err}`);
      console.error("Error adding to watch later:", err);
    }
  }

  async function removeFromWatchLater(id: string) {
    try {
      const program = watchLaterPrograms.find((p) => p.id === id);
      if (program?.notificationId) {
        await cancelNotification(id);
      }

      setWatchLaterPrograms((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(`Failed to remove from watch later: ${err}`);
      console.error("Error removing from watch later:", err);
    }
  }

  function isInWatchLater(programId: string): boolean {
    return watchLaterPrograms.some((p) => p.programId === programId);
  }

  async function scheduleNotification(program: WatchLaterProgram) {
    try {
      if (!settings.enableNotifications) return;

      const notificationTimeMs = program.startTime - settings.notifyMinutesBefore * 60 * 1000;
      const now = Date.now();

      // Don't schedule if notification time is in the past
      if (notificationTimeMs <= now) {
        return;
      }

      // Schedule notification with delay in seconds
      const delaySeconds = Math.floor((notificationTimeMs - now) / 1000);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming: ${program.programTitle}`,
          body: `${program.channelName} starts in ${settings.notifyMinutesBefore} minutes`,
          data: {
            programId: program.programId,
            channelId: program.channelId,
            programTitle: program.programTitle,
          },
        },
        trigger: delaySeconds as any,
      });

      // Update program with notification ID
      setWatchLaterPrograms((prev) =>
        prev.map((p) =>
          p.id === program.id
            ? { ...p, notificationId, notificationScheduled: true }
            : p
        )
      );
    } catch (err) {
      console.error("Error scheduling notification:", err);
    }
  }

  async function cancelNotification(id: string) {
    try {
      const program = watchLaterPrograms.find((p) => p.id === id);
      if (program?.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(program.notificationId);
      }
    } catch (err) {
      console.error("Error canceling notification:", err);
    }
  }

  async function updateNotificationSettings(newSettings: Partial<NotificationSettings>) {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Reschedule all notifications if notify minutes changed
      if (newSettings.notifyMinutesBefore !== undefined) {
        for (const program of watchLaterPrograms) {
          if (program.notificationScheduled && program.notificationId) {
            await cancelNotification(program.id);
            await scheduleNotification(program);
          }
        }
      }
    } catch (err) {
      setError(`Failed to update notification settings: ${err}`);
      console.error("Error updating notification settings:", err);
    }
  }

  const value: NotificationsContextType = {
    watchLaterPrograms,
    addToWatchLater,
    removeFromWatchLater,
    isInWatchLater,
    settings,
    updateNotificationSettings,
    scheduleNotification,
    cancelNotification,
    isLoading,
    error,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
