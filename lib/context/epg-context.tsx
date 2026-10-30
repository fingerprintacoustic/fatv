/**
 * EPG Context Provider
 * Manages EPG sources, program data, and caching
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Program, EPGSource, ChannelProgram } from "@/lib/types/epg";
import { fetchAndParseXMLTV, getChannelPrograms, formatProgramTime } from "@/lib/utils/xmltv-parser";

interface EPGContextType {
  // EPG Sources
  epgSources: EPGSource[];
  addEPGSource: (url: string, name: string) => Promise<void>;
  removeEPGSource: (id: string) => Promise<void>;
  setActiveEPGSource: (id: string) => Promise<void>;
  refreshEPG: (id: string) => Promise<void>;

  // Programs
  programs: Program[];
  getChannelPrograms: (channelId: string) => ChannelProgram | null;
  searchPrograms: (query: string) => Program[];
  getProgramsByTime: (startTime: number, endTime: number) => Program[];

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const EPGContext = createContext<EPGContextType | undefined>(undefined);

const STORAGE_KEYS = {
  EPG_SOURCES: "@fatv_epg_sources",
  EPG_PROGRAMS: "@fatv_epg_programs",
  EPG_LAST_UPDATED: "@fatv_epg_last_updated",
  DEFAULT_EPG_LOADED: "@fatv_default_epg_loaded_v4",
  REGIONAL_EPG_ADDED: "@fatv_regional_epg_added_v2",
  EPG_RESET_DONE: "@fatv_epg_reset_done_v1",
};

// iptv-org.github.io/epg/us.xml (the original default) turned out to be a
// broken/non-existent URL — not something this migration introduced, it
// was already wrong in the original app scaffold. Using the same reliable
// epgshare01 source as the UK/South Africa guides instead.
const DEFAULT_EPG_URL = "https://epgshare01.online/epgshare01/epg_ripper_US2.xml.gz";
const DEFAULT_EPG_NAME = "EPGShare: United States";

// Additional guides beyond the US default. epgshare01 only publishes these
// gzip-compressed (.xml.gz) — fetchAndParseXMLTV decompresses automatically
// based on the .gz extension. There's no dedicated Zimbabwe guide available
// anywhere free/public as of writing — South Africa (ZA) is the closest
// regional coverage epgshare01 offers.
const REGIONAL_EPG_SOURCES = [
  { url: "https://epgshare01.online/epgshare01/epg_ripper_UK1.xml.gz", name: "EPGShare: United Kingdom" },
  { url: "https://epgshare01.online/epgshare01/epg_ripper_ZA1.xml.gz", name: "EPGShare: South Africa" },
];

export function EPGProvider({ children }: { children: React.ReactNode }) {
  const [epgSources, setEPGSources] = useState<EPGSource[]>([]);
  // Programs keyed by EPG source id, so adding/refreshing one source's
  // guide doesn't wipe out every other source's programs — previously
  // addEPGSource/refreshEPG both called setPrograms(parsedPrograms)
  // directly, which replaced the *entire* programs array with just that
  // one call's result every time.
  const [programsBySource, setProgramsBySource] = useState<Record<string, Program[]>>({});
  const programs = useMemo(() => Object.values(programsBySource).flat(), [programsBySource]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved EPG sources and programs on mount
  useEffect(() => {
    loadSavedEPGData();
  }, []);

  // Load default EPG on first launch
  useEffect(() => {
    loadDefaultEPGIfNeeded();
  }, [epgSources]);

  // DISABLED: auto-adding UK/South Africa guides was freezing the whole
  // app — parseXMLTV runs its regex loop synchronously on the JS thread,
  // and a full country's multi-day guide is large enough that this blocked
  // everything, not just made it slow. Re-enable once parseXMLTV is
  // confirmed non-blocking (see the chunked/yielding rewrite). Sources can
  // still be added manually from the EPG settings screen in the meantime.
  // useEffect(() => {
  //   addRegionalEPGIfNeeded();
  // }, []);

  async function loadSavedEPGData() {
    try {
      // One-time reset: earlier builds cached every program from
      // multi-day XMLTV files with no time filtering, and the source list
      // alongside it. Rather than trying to patch a mix of old
      // untrimmed/legacy state with the new time-windowed, per-source
      // tracking, wipe both and let the normal load flow below rebuild
      // everything fresh and consistent.
      const resetDone = await AsyncStorage.getItem(STORAGE_KEYS.EPG_RESET_DONE);
      if (resetDone !== "true") {
        await AsyncStorage.multiRemove([STORAGE_KEYS.EPG_SOURCES, STORAGE_KEYS.EPG_PROGRAMS]);
        await AsyncStorage.setItem(STORAGE_KEYS.EPG_RESET_DONE, "true");
        return;
      }

      const [sourcesData] = await Promise.all([AsyncStorage.getItem(STORAGE_KEYS.EPG_SOURCES)]);

      if (sourcesData) setEPGSources(JSON.parse(sourcesData));
    } catch (err) {
      console.error("Error loading saved EPG data:", err);
    }
  }

  async function loadDefaultEPGIfNeeded() {
    try {
      const defaultLoaded = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_EPG_LOADED);
      // "true" means it already succeeded — don't reload. Anything else
      // (missing, or "attempted" from a prior failed try) means we should
      // try again — a single failed fetch shouldn't permanently give up.
      if (defaultLoaded === "true" || epgSources.length > 0) return;

      console.log("Loading default EPG source...");
      try {
        await addEPGSource(DEFAULT_EPG_URL, DEFAULT_EPG_NAME);
        await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_EPG_LOADED, "true");
      } catch (fetchErr) {
        // Mark as attempted (not permanently failed) — loadDefaultEPGIfNeeded
        // will try again the next time the app opens, and we also try once
        // more later in this same session below.
        console.warn("Default EPG fetch failed, will retry:", fetchErr);
        await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_EPG_LOADED, "attempted");

        // Quick retry in background after 30 seconds, in case it was a
        // transient network blip rather than something that needs a fresh
        // app launch (e.g. connectivity just coming back).
        setTimeout(() => {
          retryDefaultEPGLoad();
        }, 30000);
      }
    } catch (err) {
      console.error("Error in loadDefaultEPGIfNeeded:", err);
    }
  }

  async function addRegionalEPGIfNeeded() {
    try {
      const added = await AsyncStorage.getItem(STORAGE_KEYS.REGIONAL_EPG_ADDED);
      if (added === "true") return;

      for (const source of REGIONAL_EPG_SOURCES) {
        try {
          await addEPGSource(source.url, source.name);
        } catch (err) {
          console.warn(`Failed to add regional EPG source ${source.name}:`, err);
        }
      }

      await AsyncStorage.setItem(STORAGE_KEYS.REGIONAL_EPG_ADDED, "true");
    } catch (err) {
      console.error("Error adding regional EPG sources:", err);
    }
  }

  async function retryDefaultEPGLoad() {
    try {
      const defaultLoaded = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_EPG_LOADED);
      // Only retry if it was marked as "attempted" (not "true")
      if (defaultLoaded === "attempted") {
        console.log("Retrying default EPG load...");
        await addEPGSource(DEFAULT_EPG_URL, DEFAULT_EPG_NAME);
        await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_EPG_LOADED, "true");
      }
    } catch (err) {
      console.warn("Retry failed, user will need to add EPG source manually", err);
    }
  }

  async function saveEPGSources() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EPG_SOURCES, JSON.stringify(epgSources));
    } catch (err) {
      console.error("Error saving EPG sources:", err);
    }
  }

  async function savePrograms() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EPG_PROGRAMS, JSON.stringify(programs));
      await AsyncStorage.setItem(STORAGE_KEYS.EPG_LAST_UPDATED, Date.now().toString());
    } catch (err) {
      console.error("Error saving programs:", err);
    }
  }

  useEffect(() => {
    saveEPGSources();
  }, [epgSources]);

  useEffect(() => {
    savePrograms();
  }, [programs]);

  async function addEPGSource(url: string, name: string) {
    setIsLoading(true);
    setError(null);
    try {
      const parsedPrograms = await fetchAndParseXMLTV(url);

      const newSource: EPGSource = {
        id: `epg-${Date.now()}`,
        name,
        url,
        lastUpdated: Date.now(),
        isActive: epgSources.length === 0, // First source is active by default
      };

      setEPGSources((prev) => [...prev, newSource]);
      setProgramsBySource((prev) => ({ ...prev, [newSource.id]: parsedPrograms }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load EPG";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function removeEPGSource(id: string) {
    setEPGSources((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      // If removed source was active, activate another one
      if (updated.length > 0 && !updated.some((s) => s.isActive)) {
        updated[0].isActive = true;
      }
      return updated;
    });

    setProgramsBySource((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }

  async function setActiveEPGSource(id: string) {
    setEPGSources((prev) =>
      prev.map((s) => ({
        ...s,
        isActive: s.id === id,
      }))
    );
  }

  async function refreshEPG(id: string) {
    setIsLoading(true);
    setError(null);
    try {
      const source = epgSources.find((s) => s.id === id);
      if (!source) throw new Error("EPG source not found");

      const parsedPrograms = await fetchAndParseXMLTV(source.url);

      setEPGSources((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                lastUpdated: Date.now(),
              }
            : s
        )
      );

      setProgramsBySource((prev) => ({ ...prev, [id]: parsedPrograms }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to refresh EPG";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function getChannelProgramsData(channelId: string): ChannelProgram | null {
    const { current, upcoming } = getChannelPrograms(programs, channelId, 5);

    if (!current && upcoming.length === 0) {
      return null;
    }

    return {
      channelId,
      channelName: "", // Will be filled by caller if needed
      current,
      upcoming,
    };
  }

  function searchPrograms(query: string): Program[] {
    const lowerQuery = query.toLowerCase();
    return programs.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery)
    );
  }

  function getProgramsByTime(startTime: number, endTime: number): Program[] {
    return programs.filter((p) => p.startTime >= startTime && p.endTime <= endTime);
  }

  const value: EPGContextType = {
    epgSources,
    addEPGSource,
    removeEPGSource,
    setActiveEPGSource,
    refreshEPG,
    programs,
    getChannelPrograms: getChannelProgramsData,
    searchPrograms,
    getProgramsByTime,
    isLoading,
    error,
  };

  return <EPGContext.Provider value={value}>{children}</EPGContext.Provider>;
}

export function useEPG() {
  const context = useContext(EPGContext);
  if (!context) {
    throw new Error("useEPG must be used within EPGProvider");
  }
  return context;
}
