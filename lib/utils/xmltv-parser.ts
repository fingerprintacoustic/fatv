/**
 * XMLTV EPG Parser
 * Parses XMLTV format EPG data and extracts program information
 */

import { Program } from "@/lib/types/epg";

/**
 * Parse XMLTV content and return array of programs
 * XMLTV format: XML with <programme> elements containing channel and time info
 * @param content Raw XMLTV file content
 * @returns Array of parsed programs
 */
export function parseXMLTV(content: string): Program[] {
  const programs: Program[] = [];

  try {
    // Simple XML parsing using regex (for better performance than full XML parser)
    // Match <programme> tags
    const programRegex = /<programme[^>]*start="([^"]*)"[^>]*stop="([^"]*)"[^>]*channel="([^"]*)">[\s\S]*?<\/programme>/g;
    const titleRegex = /<title[^>]*>([^<]*)<\/title>/;
    const descRegex = /<desc[^>]*>([^<]*)<\/desc>/;
    const categoryRegex = /<category[^>]*>([^<]*)<\/category>/;
    const iconRegex = /<icon[^>]*src="([^"]*)"/;

    let match;
    let programId = 0;

    while ((match = programRegex.exec(content)) !== null) {
      const startStr = match[1];
      const stopStr = match[2];
      const channelId = match[3];
      const programContent = match[0];

      // Parse timestamps (XMLTV format: "20240522120000 +0000")
      const startTime = parseXMLTVTimestamp(startStr);
      const endTime = parseXMLTVTimestamp(stopStr);

      if (startTime === null || endTime === null) {
        continue;
      }

      // Extract title
      const titleMatch = titleRegex.exec(programContent);
      const title = titleMatch ? titleMatch[1].trim() : "Unknown";

      // Extract description
      const descMatch = descRegex.exec(programContent);
      const description = descMatch ? descMatch[1].trim() : undefined;

      // Extract category
      const categoryMatch = categoryRegex.exec(programContent);
      const category = categoryMatch ? categoryMatch[1].trim() : undefined;

      // Extract icon
      const iconMatch = iconRegex.exec(programContent);
      const icon = iconMatch ? iconMatch[1] : undefined;

      const program: Program = {
        id: `${channelId}-${programId++}`,
        channelId,
        title,
        description,
        startTime,
        endTime,
        category,
        icon,
      };

      programs.push(program);
    }
  } catch (error) {
    console.error("Error parsing XMLTV:", error);
  }

  return programs;
}

/**
 * Parse XMLTV timestamp format to Unix timestamp
 * Format: "20240522120000 +0000" or "20240522120000"
 */
function parseXMLTVTimestamp(timestamp: string): number | null {
  try {
    // Extract just the datetime part (first 14 characters: YYYYMMDDHHMMSS)
    const dateTimeStr = timestamp.substring(0, 14);

    if (dateTimeStr.length !== 14) {
      return null;
    }

    const year = parseInt(dateTimeStr.substring(0, 4), 10);
    const month = parseInt(dateTimeStr.substring(4, 6), 10) - 1; // JS months are 0-indexed
    const day = parseInt(dateTimeStr.substring(6, 8), 10);
    const hour = parseInt(dateTimeStr.substring(8, 10), 10);
    const minute = parseInt(dateTimeStr.substring(10, 12), 10);
    const second = parseInt(dateTimeStr.substring(12, 14), 10);

    const date = new Date(year, month, day, hour, minute, second);
    return date.getTime();
  } catch (error) {
    console.error("Error parsing XMLTV timestamp:", timestamp, error);
    return null;
  }
}

/**
 * Fetch and parse XMLTV EPG from URL
 * @param url XMLTV EPG URL
 * @returns Array of parsed programs
 */
export async function fetchAndParseXMLTV(url: string): Promise<Program[]> {
  try {
    // Add 30-second timeout for EPG fetch to prevent hangs on large files
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch EPG: ${response.statusText}`);
      }

      const content = await response.text();
      return parseXMLTV(content);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        throw new Error("EPG fetch timed out (30s). The file may be too large. Try a smaller EPG source.");
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching XMLTV EPG:", error);
    throw error;
  }
}

/**
 * Get current and upcoming programs for a channel
 */
export function getChannelPrograms(
  programs: Program[],
  channelId: string,
  upcomingCount: number = 5
) {
  const now = Date.now();

  const channelPrograms = programs
    .filter((p) => p.channelId === channelId)
    .sort((a, b) => a.startTime - b.startTime);

  const current = channelPrograms.find((p) => p.startTime <= now && p.endTime > now);
  const upcoming = channelPrograms
    .filter((p) => p.startTime > now)
    .slice(0, upcomingCount);

  return { current, upcoming };
}

/**
 * Format time for display
 */
export function formatProgramTime(startTime: number, endTime: number): string {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const startStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endStr = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return `${startStr} - ${endStr}`;
}

/**
 * Format program duration in minutes
 */
export function getProgramDuration(program: Program): number {
  return Math.round((program.endTime - program.startTime) / (1000 * 60));
}
