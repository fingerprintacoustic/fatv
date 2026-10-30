/**
 * Chromecast Context Provider
 * Manages Chromecast device discovery and casting state
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { chromecastManager, CastDevice, CastMediaInfo } from "@/lib/utils/chromecast";

interface ChromecastContextType {
  // Device management
  availableDevices: CastDevice[];
  currentDevice: CastDevice | null;
  isConnected: boolean;
  isDiscovering: boolean;

  // Device actions
  startDiscovery: () => void;
  stopDiscovery: () => void;
  connectToDevice: (deviceId: string) => void;
  disconnect: () => void;

  // Playback control
  castStream: (mediaInfo: CastMediaInfo) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;

  // Status
  isAvailable: boolean;
  error: string | null;
}

const ChromecastContext = createContext<ChromecastContextType | undefined>(undefined);

export function ChromecastProvider({ children }: { children: React.ReactNode }) {
  const [availableDevices, setAvailableDevices] = useState<CastDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<CastDevice | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isAvailable] = useState(chromecastManager.isAvailable());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Setup event listeners
    const unsubscribeDeviceAvailable = chromecastManager.on("deviceAvailable", (device: CastDevice) => {
      setAvailableDevices((prev) => {
        const exists = prev.some((d) => d.id === device.id);
        return exists ? prev : [...prev, device];
      });
    });

    const unsubscribeDeviceUnavailable = chromecastManager.on("deviceUnavailable", (deviceId: string) => {
      setAvailableDevices((prev) => prev.filter((d) => d.id !== deviceId));
    });

    const unsubscribeConnected = chromecastManager.on("connected", (device: CastDevice) => {
      setCurrentDevice(device);
      setError(null);
    });

    const unsubscribeDisconnected = chromecastManager.on("disconnected", () => {
      setCurrentDevice(null);
    });

    const unsubscribeError = chromecastManager.on("error", (errorMsg: string) => {
      setError(errorMsg);
    });

    return () => {
      unsubscribeDeviceAvailable();
      unsubscribeDeviceUnavailable();
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
    };
  }, []);

  const handleStartDiscovery = () => {
    setIsDiscovering(true);
    chromecastManager.startDiscovery();
  };

  const handleStopDiscovery = () => {
    setIsDiscovering(false);
    chromecastManager.stopDiscovery();
  };

  const handleConnectToDevice = (deviceId: string) => {
    chromecastManager.connectToDevice(deviceId);
  };

  const handleDisconnect = () => {
    chromecastManager.disconnect();
    setCurrentDevice(null);
  };

  const handleCastStream = (mediaInfo: CastMediaInfo) => {
    chromecastManager.castStream(mediaInfo);
  };

  const handlePlay = () => {
    chromecastManager.play();
  };

  const handlePause = () => {
    chromecastManager.pause();
  };

  const handleStop = () => {
    chromecastManager.stop();
  };

  const handleSeek = (position: number) => {
    chromecastManager.seek(position);
  };

  const value: ChromecastContextType = {
    availableDevices,
    currentDevice,
    isConnected: currentDevice !== null,
    isDiscovering,
    startDiscovery: handleStartDiscovery,
    stopDiscovery: handleStopDiscovery,
    connectToDevice: handleConnectToDevice,
    disconnect: handleDisconnect,
    castStream: handleCastStream,
    play: handlePlay,
    pause: handlePause,
    stop: handleStop,
    seek: handleSeek,
    isAvailable,
    error,
  };

  return (
    <ChromecastContext.Provider value={value}>
      {children}
    </ChromecastContext.Provider>
  );
}

export function useChromecast(): ChromecastContextType {
  const context = useContext(ChromecastContext);
  if (context === undefined) {
    throw new Error("useChromecast must be used within ChromecastProvider");
  }
  return context;
}
