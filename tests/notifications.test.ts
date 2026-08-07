import { describe, it, expect } from "vitest";
import { WatchLaterProgram, NotificationSettings } from "@/lib/types/notifications";

describe("Notifications", () => {
  describe("WatchLaterProgram", () => {
    it("should create a watch later program", () => {
      const program: WatchLaterProgram = {
        id: "wl-123",
        programId: "prog-1",
        channelId: "ch-1",
        channelName: "Test Channel",
        programTitle: "Test Program",
        startTime: Date.now() + 3600000,
        endTime: Date.now() + 7200000,
        notificationScheduled: false,
        createdAt: Date.now(),
      };

      expect(program.id).toBe("wl-123");
      expect(program.programTitle).toBe("Test Program");
      expect(program.notificationScheduled).toBe(false);
    });

    it("should have optional notification ID", () => {
      const program: WatchLaterProgram = {
        id: "wl-123",
        programId: "prog-1",
        channelId: "ch-1",
        channelName: "Test Channel",
        programTitle: "Test Program",
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        notificationScheduled: true,
        notificationId: "notif-456",
        createdAt: Date.now(),
      };

      expect(program.notificationId).toBe("notif-456");
    });
  });

  describe("NotificationSettings", () => {
    it("should create notification settings with defaults", () => {
      const settings: NotificationSettings = {
        enableNotifications: true,
        notifyMinutesBefore: 15,
      };

      expect(settings.enableNotifications).toBe(true);
      expect(settings.notifyMinutesBefore).toBe(15);
    });

    it("should support quiet hours", () => {
      const settings: NotificationSettings = {
        enableNotifications: true,
        notifyMinutesBefore: 10,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      };

      expect(settings.quietHoursStart).toBe(22);
      expect(settings.quietHoursEnd).toBe(8);
    });

    it("should support different notification lead times", () => {
      const leadTimes = [5, 10, 15, 30, 60];

      for (const minutes of leadTimes) {
        const settings: NotificationSettings = {
          enableNotifications: true,
          notifyMinutesBefore: minutes,
        };
        expect(settings.notifyMinutesBefore).toBe(minutes);
      }
    });
  });
});
