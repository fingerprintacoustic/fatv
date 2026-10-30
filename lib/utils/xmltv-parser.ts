/**
 * XMLTV EPG Parser
 * Parses XMLTV format EPG data and extracts program information
 */

import { Program } from "@/lib/types/epg";
import { ungzip } from "pako";

/**
 * Parse XMLTV content and return array of programs
 * XMLTV format: XML with <programme> elements containing channel and time info
 *
 * Runs in chunks with periodic yields back to the JS event loop, rather
 * than one uninterrupted synchronous pass — a full country's multi-day
 * guide can be large enough (tens of thousands of <programme> entries)
 * that running straight through in one tight loop blocks the entire app,
 * not just this function, since React Native's UI updates and touch
 * handling also run on the JS thread.
 *
 * @param content Raw XMLTV file content
 * @returns Array of parsed programs
 */
export async function parseXMLTV(content: string): Promise<Program[]> {
  const programs: Program[] = [];

  // Only keep a practical window around "now" — a current+upcoming guide
  // display never needs days of past/future listings, and keeping
  // everything (especially across multiple merged country-wide guides) was
  // holding tens of thousands of extra objects in memory permanently.
  const now = Date.now();
  const windowStart = now - 6 * 60 * 60 * 1000; // 6h in the past
  const windowEnd = now + 48 * 60 * 60 * 1000; // 48h ahead

  const CHUNK_SIZE = 300; // matches processed before yielding

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
    let processedInChunk = 0;

    while ((match = programRegex.exec(content)) !== null) {
      const startStr = match[1];
      const stopStr = match[2];
      const channelId = match[3];
      const programContent = match[0];

      // Parse timestamps (XMLTV format: "20240522120000 +0000")
      const startTime = parseXMLTVTimestamp(startStr);
      const endTime = parseXMLTVTimestamp(stopStr);

      if (startTime === null || endTime === null) {
        processedInChunk++;
      } else if (endTime < windowStart || startTime > windowEnd) {
        // Skip anything outside the window — most of a multi-day XMLTV
        // file is for entries we'll never show.
        processedInChunk++;
      } else {
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

        programs.push({
          id: `${channelId}-${programId++}`,
          channelId,
          title,
          description,
          startTime,
          endTime,
          category,
          icon,
        });
        processedInChunk++;
      }

      if (processedInChunk >= CHUNK_SIZE) {
        processedInChunk = 0;
        // Yield back to the JS event loop so pending touches/renders get a
        // chance to run before continuing.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
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
    // 60-second timeout for EPG fetch — the full US guide is a large XML
    // file (often tens of MB); 30s wasn't consistently enough time on
    // anything but fast wifi.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch EPG: ${response.statusText}`);
      }

      let content: string;
      const looksGzipped = url.toLowerCase().endsWith(".gz");

      if (looksGzipped) {
        // Sources like epgshare01 only publish gzip-compressed XMLTV —
        // fetch() doesn't auto-decompress a .gz file's actual contents
        // (that's different from transparent Content-Encoding: gzip), so
        // we pull the raw bytes and decompress with pako ourselves.
        const buffer = await response.arrayBuffer();
        content = ungzip(new Uint8Array(buffer), { to: "string" });
      } else {
        content = await response.text();
      }

      return await parseXMLTV(content);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        throw new Error("EPG fetch timed out (60s). The file may be too large. Try a smaller EPG source.");
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
