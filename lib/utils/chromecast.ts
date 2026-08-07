/**
 * Chromecast Utilities
 * Handles casting IPTV streams to Chromecast-enabled devices
 */

import { NativeModules, NativeEventEmitter, Platform } from "react-native";

const { RNGoogleCast } = NativeModules;

// Only initialize on native platforms
const isNativePlatform = Platform.OS !== "web";

export interface CastDevice {
  id: string;
  name: string;
  isConnected: boolean;
  isConnecting: boolean;
}

export interface CastMediaInfo {
  contentId: string; // Stream URL
  contentTitle: string; // Channel name
  contentDescription?: string;
  contentType: string; // e.g., "application/x-mpegURL" for HLS
  duration?: number;
  posterUrl?: string;
  customData?: Record<string, any>;
}

class ChromecastManager {
  private eventEmitter: NativeEventEmitter | null = null;
  private isInitialized = false;
  private currentDevice: CastDevice | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.initializeEventEmitter();
  }

  private initializeEventEmitter() {
    try {
      if (RNGoogleCast) {
        this.eventEmitter = new NativeEventEmitter(RNGoogleCast);
        this.setupEventListeners();
        this.isInitialized = true;
      }
    } catch (err) {
      console.warn("Chromecast not available:", err);
    }
  }

  private setupEventListeners() {
    if (!this.eventEmitter) return;

    // Device discovery events
    this.eventEmitter.addListener("RNGoogleCastDeviceAvailable", (device: CastDevice) => {
      this.emit("deviceAvailable", device);
    });

    this.eventEmitter.addListener("RNGoogleCastDeviceUnavailable", (deviceId: string) => {
      this.emit("deviceUnavailable", deviceId);
    });

    // Connection events
    this.eventEmitter.addListener("RNGoogleCastConnected", (device: CastDevice) => {
      this.currentDevice = device;
      this.emit("connected", device);
    });

    this.eventEmitter.addListener("RNGoogleCastDisconnected", () => {
      this.currentDevice = null;
      this.emit("disconnected", null);
    });

    // Playback events
    this.eventEmitter.addListener("RNGoogleCastPlaybackStarted", () => {
      this.emit("playbackStarted", null);
    });

    this.eventEmitter.addListener("RNGoogleCastPlaybackStopped", () => {
      this.emit("playbackStopped", null);
    });

    this.eventEmitter.addListener("RNGoogleCastPlaybackPaused", () => {
      this.emit("playbackPaused", null);
    });

    // Error events
    this.eventEmitter.addListener("RNGoogleCastError", (error: string) => {
      this.emit("error", error);
    });
  }

  /**
   * Start device discovery
   */
  public startDiscovery(): void {
    if (!this.isInitialized || !RNGoogleCast) {
      console.warn("Chromecast not available");
      return;
    }

    try {
      RNGoogleCast.startDiscovery();
    } catch (err) {
      console.error("Error starting Chromecast discovery:", err);
    }
  }

  /**
   * Stop device discovery
   */
  public stopDiscovery(): void {
    if (!this.isInitialized || !RNGoogleCast) return;

    try {
      RNGoogleCast.stopDiscovery();
    } catch (err) {
      console.error("Error stopping Chromecast discovery:", err);
    }
  }

  /**
   * Connect to a Chromecast device
   */
  public connectToDevice(deviceId: string): void {
    if (!this.isInitialized || !RNGoogleCast) {
      console.warn("Chromecast not available");
      return;
    }

    try {
      RNGoogleCast.connectToDevice(deviceId);
    } catch (err) {
      console.error("Error connecting to Chromecast device:", err);
      this.emit("error", `Failed to connect to device: ${err}`);
    }
  }

  /**
   * Disconnect from current device
   */
  public disconnect(): void {
    if (!this.isInitialized || !RNGoogleCast) return;

    try {
      RNGoogleCast.disconnect();
      this.currentDevice = null;
    } catch (err) {
      console.error("Error disconnecting from Chromecast:", err);
    }
  }

  /**
   * Cast a stream to the connected device
   */
  public castStream(mediaInfo: CastMediaInfo): void {
    if (!this.isInitialized || !RNGoogleCast || !this.currentDevice) {
      console.warn("Chromecast not available or not connected");
      return;
    }

    try {
      RNGoogleCast.castMedia({
        contentId: mediaInfo.contentId,
        contentTitle: mediaInfo.contentTitle,
        contentDescription: mediaInfo.contentDescription || "",
        contentType: mediaInfo.contentType || "application/x-mpegURL",
        duration: mediaInfo.duration || 0,
        posterUrl: mediaInfo.posterUrl || "",
        customData: mediaInfo.customData || {},
      });
    } catch (err) {
      console.error("Error casting stream:", err);
      this.emit("error", `Failed to cast stream: ${err}`);
    }
  }

  /**
   * Play on the connected device
   */
  public play(): void {
    if (!this.isInitialized || !RNGoogleCast || !this.currentDevice) return;

    try {
      RNGoogleCast.play();
    } catch (err) {
      console.error("Error playing on Chromecast:", err);
    }
  }

  /**
   * Pause on the connected device
   */
  public pause(): void {
    if (!this.isInitialized || !RNGoogleCast || !this.currentDevice) return;

    try {
      RNGoogleCast.pause();
    } catch (err) {
      console.error("Error pausing on Chromecast:", err);
    }
  }

  /**
   * Stop casting
   */
  public stop(): void {
    if (!this.isInitialized || !RNGoogleCast || !this.currentDevice) return;

    try {
      RNGoogleCast.stop();
    } catch (err) {
      console.error("Error stopping Chromecast playback:", err);
    }
  }

  /**
   * Seek to position (in seconds)
   */
  public seek(position: number): void {
    if (!this.isInitialized || !RNGoogleCast || !this.currentDevice) return;

    try {
      RNGoogleCast.seek(position);
    } catch (err) {
      console.error("Error seeking on Chromecast:", err);
    }
  }

  /**
   * Get current connected device
   */
  public getCurrentDevice(): CastDevice | null {
    return this.currentDevice;
  }

  /**
   * Check if connected to a device
   */
  public isConnected(): boolean {
    return this.currentDevice !== null && this.currentDevice.isConnected;
  }

  /**
   * Check if Chromecast is available
   */
  public isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Subscribe to events
   */
  public on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in ${event} callback:`, err);
        }
      });
    }
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    this.stopDiscovery();
    this.disconnect();
    this.listeners.clear();
  }
}

// Lazy-initialize singleton to avoid crashes on web/unsupported platforms
let chromecastManagerInstance: ChromecastManager | null = null;

export function getChromecastManager(): ChromecastManager {
  if (!chromecastManagerInstance) {
    chromecastManagerInstance = new ChromecastManager();
  }
  return chromecastManagerInstance;
}

// Export singleton instance (lazy-loaded)
export const chromecastManager = getChromecastManager();

export default chromecastManager;
