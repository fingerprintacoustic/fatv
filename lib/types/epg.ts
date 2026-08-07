/**
 * EPG (Electronic Program Guide) Types
 * Defines data structures for XMLTV EPG data
 */

export interface Program {
  id: string; // Unique program ID
  channelId: string; // Reference to channel
  title: string;
  description?: string;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  category?: string;
  rating?: string;
  icon?: string;
  credits?: {
    director?: string[];
    actor?: string[];
    writer?: string[];
  };
}

export interface EPGSource {
  id: string;
  name: string;
  url: string;
  lastUpdated: number;
  isActive: boolean;
}

export interface EPGData {
  programs: Program[];
  lastUpdated: number;
}

export interface ChannelProgram {
  channelId: string;
  channelName: string;
  current?: Program;
  upcoming: Program[];
}
