/**
 * EPG Context Provider
 * Manages EPG sources, program data, and caching
 */

import React, { createContext, useContext, useEffect, useState } from "react";
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
  DEFAULT_EPG_LOADED: "@fatv_default_epg_loaded",
};

const DEFAULT_EPG_URL = "https://iptv-org.github.io/epg/us.xml";
const DEFAULT_EPG_NAME = "IPTV-Org EPG (US)";

export function EPGProvider({ children }: { children: React.ReactNode }) {
  const [epgSources, setEPGSources] = useState<EPGSource[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
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

  async function loadSavedEPGData() {
    try {
      const [sourcesData, programsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.EPG_SOURCES),
        AsyncStorage.getItem(STORAGE_KEYS.EPG_PROGRAMS),
      ]);

      if (sourcesData) setEPGSources(JSON.parse(sourcesData));
      if (programsData) setPrograms(JSON.parse(programsData));
    } catch (err) {
      console.error("Error loading saved EPG data:", err);
    }
  }

  async function loadDefaultEPGIfNeeded() {
    try {
      const defaultLoaded = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_EPG_LOADED);
      if (defaultLoaded || epgSources.length > 0) return; // Already loaded or user has sources

      // Load default EPG
      console.log("Loading default EPG source...");
      try {
        await addEPGSource(DEFAULT_EPG_URL, DEFAULT_EPG_NAME);
        await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_EPG_LOADED, "true");
      } catch (fetchErr) {
        // If default EPG fails, just mark as attempted and let user add sources manually
        console.warn("Default EPG fetch failed, user can add sources manually:", fetchErr);
        await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_EPG_LOADED, "attempted");
        
        // Retry in background after 30 seconds
        setTimeout(() => {
          retryDefaultEPGLoad();
        }, 30000);
      }
    } catch (err) {
      console.error("Error in loadDefaultEPGIfNeeded:", err);
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
      setPrograms(parsedPrograms);
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

    // Clear programs if no active source
    const activeSource = epgSources.find((s) => s.id !== id && s.isActive);
    if (!activeSource) {
      setPrograms([]);
    }
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

      setPrograms(parsedPrograms);
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
