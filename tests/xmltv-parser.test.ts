import { describe, it, expect } from "vitest";
import { parseXMLTV, getChannelPrograms, formatProgramTime, getProgramDuration } from "../lib/utils/xmltv-parser";

describe("XMLTV Parser", () => {
  describe("parseXMLTV", () => {
    it("should parse a simple XMLTV EPG", () => {
      const xmltvContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<tv>
  <programme start="20240522120000 +0000" stop="20240522130000 +0000" channel="ch1">
    <title>Test Program 1</title>
    <desc>This is a test program</desc>
    <category>Sports</category>
  </programme>
  <programme start="20240522130000 +0000" stop="20240522140000 +0000" channel="ch1">
    <title>Test Program 2</title>
    <desc>Another test program</desc>
    <category>News</category>
  </programme>
</tv>`;

      const programs = parseXMLTV(xmltvContent);

      expect(programs).toHaveLength(2);
      expect(programs[0].title).toBe("Test Program 1");
      expect(programs[0].channelId).toBe("ch1");
      expect(programs[0].description).toBe("This is a test program");
      expect(programs[0].category).toBe("Sports");

      expect(programs[1].title).toBe("Test Program 2");
      expect(programs[1].category).toBe("News");
    });

    it("should handle programs without optional fields", () => {
      const xmltvContent = `<?xml version="1.0" encoding="UTF-8"?>
<tv>
  <programme start="20240522120000 +0000" stop="20240522130000 +0000" channel="ch1">
    <title>Minimal Program</title>
  </programme>
</tv>`;

      const programs = parseXMLTV(xmltvContent);

      expect(programs).toHaveLength(1);
      expect(programs[0].title).toBe("Minimal Program");
      expect(programs[0].description).toBeUndefined();
      expect(programs[0].category).toBeUndefined();
    });

    it("should parse program with icon", () => {
      const xmltvContent = `<?xml version="1.0" encoding="UTF-8"?>
<tv>
  <programme start="20240522120000 +0000" stop="20240522130000 +0000" channel="ch1">
    <title>Program with Icon</title>
    <icon src="http://example.com/icon.png" />
  </programme>
</tv>`;

      const programs = parseXMLTV(xmltvContent);

      expect(programs[0].icon).toBe("http://example.com/icon.png");
    });
  });

  describe("getChannelPrograms", () => {
    it("should get current and upcoming programs for a channel", () => {
      const now = Date.now();
      const programs = [
        {
          id: "1",
          channelId: "ch1",
          title: "Current Program",
          startTime: now - 600000, // 10 minutes ago
          endTime: now + 600000, // 10 minutes from now
          description: "",
        },
        {
          id: "2",
          channelId: "ch1",
          title: "Next Program",
          startTime: now + 600000,
          endTime: now + 1200000,
          description: "",
        },
        {
          id: "3",
          channelId: "ch1",
          title: "Later Program",
          startTime: now + 1200000,
          endTime: now + 1800000,
          description: "",
        },
      ];

      const result = getChannelPrograms(programs, "ch1", 2);

      expect(result.current?.title).toBe("Current Program");
      expect(result.upcoming).toHaveLength(2);
      expect(result.upcoming[0].title).toBe("Next Program");
      expect(result.upcoming[1].title).toBe("Later Program");
    });

    it("should return empty if no programs for channel", () => {
      const programs = [
        {
          id: "1",
          channelId: "ch1",
          title: "Program",
          startTime: Date.now(),
          endTime: Date.now() + 3600000,
          description: "",
        },
      ];

      const result = getChannelPrograms(programs, "ch2", 5);

      expect(result.current).toBeUndefined();
      expect(result.upcoming).toHaveLength(0);
    });
  });

  describe("formatProgramTime", () => {
    it("should format program time correctly", () => {
      const start = new Date("2024-05-22T12:00:00").getTime();
      const end = new Date("2024-05-22T13:30:00").getTime();

      const formatted = formatProgramTime(start, end);

      expect(formatted).toContain("12:00");
      expect(formatted).toContain("01:30"); // 13:30 in 12-hour format
      expect(formatted).toContain("-");
    });
  });

  describe("getProgramDuration", () => {
    it("should calculate program duration in minutes", () => {
      const program = {
        id: "1",
        channelId: "ch1",
        title: "Test",
        startTime: Date.now(),
        endTime: Date.now() + 3600000, // 1 hour
        description: "",
      };

      const duration = getProgramDuration(program);

      expect(duration).toBe(60);
    });

    it("should handle partial hour durations", () => {
      const program = {
        id: "1",
        channelId: "ch1",
        title: "Test",
        startTime: Date.now(),
        endTime: Date.now() + 1800000, // 30 minutes
        description: "",
      };

      const duration = getProgramDuration(program);

      expect(duration).toBe(30);
    });
  });
});
