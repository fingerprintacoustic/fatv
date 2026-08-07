import { describe, it, expect } from "vitest";
import { parseM3U, groupChannelsByCategory } from "../lib/utils/m3u-parser";

describe("M3U Parser", () => {
  describe("parseM3U", () => {
    it("should parse a simple M3U playlist", () => {
      const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-id="ch1" tvg-name="Channel 1" tvg-logo="http://example.com/logo.png" group-title="Sports",Channel 1
http://example.com/stream1.m3u8
#EXTINF:-1 tvg-id="ch2" tvg-name="Channel 2" group-title="News",Channel 2
http://example.com/stream2.m3u8`;

      const channels = parseM3U(m3uContent);

      expect(channels).toHaveLength(2);
      expect(channels[0].name).toBe("Channel 1");
      expect(channels[0].url).toBe("http://example.com/stream1.m3u8");
      expect(channels[0].group).toBe("Sports");
      expect(channels[0].tvgId).toBe("ch1");
      expect(channels[0].logo).toBe("http://example.com/logo.png");

      expect(channels[1].name).toBe("Channel 2");
      expect(channels[1].url).toBe("http://example.com/stream2.m3u8");
      expect(channels[1].group).toBe("News");
    });

    it("should handle channels without metadata", () => {
      const m3uContent = `#EXTM3U
#EXTINF:-1,Simple Channel
http://example.com/stream.m3u8`;

      const channels = parseM3U(m3uContent);

      expect(channels).toHaveLength(1);
      expect(channels[0].name).toBe("Simple Channel");
      expect(channels[0].url).toBe("http://example.com/stream.m3u8");
      expect(channels[0].group).toBeUndefined();
    });

    it("should skip empty lines and comments", () => {
      const m3uContent = `#EXTM3U
# This is a comment

#EXTINF:-1,Channel 1
http://example.com/stream1.m3u8

#EXTINF:-1,Channel 2
http://example.com/stream2.m3u8`;

      const channels = parseM3U(m3uContent);

      expect(channels).toHaveLength(2);
    });

    it("should handle URLs with special characters", () => {
      const m3uContent = `#EXTM3U
#EXTINF:-1,Test Channel
http://example.com/stream?id=123&token=abc%20def`;

      const channels = parseM3U(m3uContent);

      expect(channels[0].url).toBe("http://example.com/stream?id=123&token=abc%20def");
    });
  });

  describe("groupChannelsByCategory", () => {
    it("should group channels by category", () => {
      const channels = [
        {
          id: "1",
          name: "Sports 1",
          url: "http://example.com/1",
          group: "Sports",
        },
        {
          id: "2",
          name: "Sports 2",
          url: "http://example.com/2",
          group: "Sports",
        },
        {
          id: "3",
          name: "News 1",
          url: "http://example.com/3",
          group: "News",
        },
      ];

      const grouped = groupChannelsByCategory(channels as any);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped["Sports"]).toHaveLength(2);
      expect(grouped["News"]).toHaveLength(1);
    });

    it("should group uncategorized channels", () => {
      const channels = [
        {
          id: "1",
          name: "Channel 1",
          url: "http://example.com/1",
        },
        {
          id: "2",
          name: "Channel 2",
          url: "http://example.com/2",
          group: "Sports",
        },
      ];

      const grouped = groupChannelsByCategory(channels as any);

      expect(grouped["Uncategorized"]).toHaveLength(1);
      expect(grouped["Sports"]).toHaveLength(1);
    });
  });
});
