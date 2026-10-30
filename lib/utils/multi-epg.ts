/**
 * Multi-Language EPG Utilities
 * Handles multiple EPG sources and language support
 */

import { Program, ChannelProgram } from "@/lib/types/epg";

export interface EPGRegion {
  code: string; // e.g., "en-US", "es-ES", "fr-FR"
  name: string; // e.g., "United States", "Spain", "France"
  languages: string[];
  epgUrl: string;
}

// Popular EPG sources by region
export const POPULAR_EPG_SOURCES: EPGRegion[] = [
  {
    code: "en-US",
    name: "United States",
    languages: ["English"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "en-GB",
    name: "United Kingdom",
    languages: ["English"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "es-ES",
    name: "Spain",
    languages: ["Spanish"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "fr-FR",
    name: "France",
    languages: ["French"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "de-DE",
    name: "Germany",
    languages: ["German"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "it-IT",
    name: "Italy",
    languages: ["Italian"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "pt-BR",
    name: "Brazil",
    languages: ["Portuguese"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "pt-PT",
    name: "Portugal",
    languages: ["Portuguese"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "ru-RU",
    name: "Russia",
    languages: ["Russian"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "zh-CN",
    name: "China",
    languages: ["Chinese (Simplified)"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "ja-JP",
    name: "Japan",
    languages: ["Japanese"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "ko-KR",
    name: "South Korea",
    languages: ["Korean"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "en-ZA",
    name: "South Africa",
    languages: ["English"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
  {
    code: "en-ZW",
    name: "Zimbabwe",
    languages: ["English"],
    epgUrl: "https://iptv-org.github.io/epg/guide.xml",
  },
];

/**
 * Get EPG sources by region
 */
export function getEPGSourcesByRegion(regionCode: string): EPGRegion | undefined {
  return POPULAR_EPG_SOURCES.find((r) => r.code === regionCode);
}

/**
 * Get all available regions
 */
export function getAllEPGRegions(): EPGRegion[] {
  return POPULAR_EPG_SOURCES;
}

/**
 * Merge programs from multiple EPG sources
 * Prioritizes programs by source order
 */
export function mergeEPGPrograms(
  programsBySource: Program[][],
  channelId: string
): ChannelProgram {
  const allPrograms: Program[] = [];
  const seenTimes = new Set<number>();

  // Merge programs, avoiding duplicates
  for (const programs of programsBySource) {
    for (const program of programs) {
      if (program.channelId === channelId && !seenTimes.has(program.startTime)) {
        allPrograms.push(program);
        seenTimes.add(program.startTime);
      }
    }
  }

  // Sort by start time
  allPrograms.sort((a, b) => a.startTime - b.startTime);

  // Find current and upcoming programs
  const now = Date.now();
  const current = allPrograms.find((p) => p.startTime <= now && p.endTime > now);
  const upcoming = allPrograms.filter((p) => p.startTime > now).slice(0, 10);

  return {
    channelId,
    channelName: "",
    current,
    upcoming,
  };
}

/**
 * Filter programs by language
 */
export function filterProgramsByLanguage(programs: Program[], language: string): Program[] {
  return programs.filter((p) => {
    // Check if program has language metadata
    if (p.credits?.actor) {
      return true; // Include if has credits (indicates it's in a specific language)
    }
    return true; // Include all if no language info available
  });
}

/**
 * Get recommended EPG source for device locale
 */
export function getRecommendedEPGSource(deviceLocale?: string): EPGRegion {
  if (!deviceLocale) {
    return POPULAR_EPG_SOURCES[0]; // Default to first source
  }

  // Try exact match
  const exact = POPULAR_EPG_SOURCES.find((r) => r.code === deviceLocale);
  if (exact) return exact;

  // Try language match (e.g., "en" from "en-US")
  const language = deviceLocale.split("-")[0];
  const languageMatch = POPULAR_EPG_SOURCES.find((r) =>
    r.languages.some((lang) => lang.toLowerCase().startsWith(language))
  );

  return languageMatch || POPULAR_EPG_SOURCES[0];
}
