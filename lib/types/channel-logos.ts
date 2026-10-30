/**
 * Channel Logo Types
 * Extends channel data with logo/thumbnail support
 */

export interface ChannelLogo {
  channelId: string;
  logoUrl?: string;
  cachedPath?: string; // Local cache path
  lastUpdated: number;
  fallbackIcon?: string; // Fallback icon name
}

export interface ChannelWithLogo {
  channelId: string;
  channelName: string;
  logo?: ChannelLogo;
  group?: string;
}
