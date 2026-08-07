/**
 * M3U Playlist Parser
 * Parses M3U format playlists and extracts channel information
 */

import { Channel } from "@/lib/types/iptv";

export interface M3UExtInfo {
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  group?: string;
  [key: string]: string | undefined;
}

/**
 * Parse a single EXTINF line to extract channel metadata
 * Format: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Channel Name
 */
function parseExtInfo(line: string): { info: M3UExtInfo; name: string } {
  const info: M3UExtInfo = {};
  let name = "";

  // Extract attributes
  const attrRegex = /(\w+(?:-\w+)*)="([^"]*)"/g;
  let match;
  while ((match = attrRegex.exec(line)) !== null) {
    const key = match[1].toLowerCase().replace(/-/g, "");
    const value = match[2];

    if (key === "tvgid") info.tvgId = value;
    else if (key === "tvgname") info.tvgName = value;
    else if (key === "tvglogo") info.tvgLogo = value;
    else if (key === "grouptitle") info.group = value;
  }

  // Extract channel name (after the last comma)
  const lastCommaIndex = line.lastIndexOf(",");
  if (lastCommaIndex !== -1) {
    name = line.substring(lastCommaIndex + 1).trim();
  }

  return { info, name };
}

/**
 * Parse M3U playlist content and return array of channels
 * @param content Raw M3U file content
 * @returns Array of parsed channels
 */
export function parseM3U(content: string): Channel[] {
  const lines = content.split("\n").map((line) => line.trim());
  const channels: Channel[] = [];
  let currentInfo: M3UExtInfo | null = null;
  let currentName: string | null = null;

  for (const line of lines) {
    // Skip empty lines and comments (except EXTINF)
    if (!line || (line.startsWith("#") && !line.startsWith("#EXTINF"))) {
      continue;
    }

    // Parse EXTINF metadata line
    if (line.startsWith("#EXTINF")) {
      const parsed = parseExtInfo(line);
      currentInfo = parsed.info;
      currentName = parsed.name;
    } else if (line && !line.startsWith("#") && currentName) {
      // This is the URL line following an EXTINF
      const channel: Channel = {
        id: `${currentName}-${channels.length}`,
        name: currentName,
        url: line,
        logo: currentInfo?.tvgLogo,
        group: currentInfo?.group,
        tvgId: currentInfo?.tvgId,
        tvgName: currentInfo?.tvgName,
      };

      channels.push(channel);

      // Reset for next channel
      currentInfo = null;
      currentName = null;
    }
  }

  return channels;
}

/**
 * Fetch and parse M3U playlist from URL
 * @param url M3U playlist URL
 * @returns Array of parsed channels
 */
export async function fetchAndParseM3U(url: string): Promise<Channel[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.statusText}`);
    }

    const content = await response.text();
    return parseM3U(content);
  } catch (error) {
    console.error("Error fetching M3U playlist:", error);
    throw error;
  }
}

/**
 * Group channels by their group-title attribute
 */
export function groupChannelsByCategory(channels: Channel[]): Record<string, Channel[]> {
  const grouped: Record<string, Channel[]> = {};

  for (const channel of channels) {
    const group = channel.group || "Uncategorized";
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(channel);
  }

  return grouped;
}
