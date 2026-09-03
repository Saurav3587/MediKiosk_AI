import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { syncService } from "../../services/syncService";

export function NetworkStatus({ compact = false }) {
  const [online, setOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    setOnline(syncService.isOnline());
    const cleanup = syncService.listenNetworkStatus(({ online }) => {
      setOnline(online);
      setShowNotification(true);
      if (online) {
        const timer = setTimeout(() => setShowNotification(false), 4000);
        return () => clearTimeout(timer);
      }
    });
    return cleanup;
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500" title={online ? "Connected to hospital network" : "Offline mode active"}>
        {online ? (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <WifiOff className="w-3.5 h-3.5" />
            Offline (Saved locally)
          </span>
        )}
      </div>
    );
  }

  if (!showNotification && online) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all ${
        online
          ? "bg-slate-900 text-white border border-slate-700"
          : "bg-amber-50 text-amber-900 border border-amber-300"
      }`}
    >
      {online ? (
        <>
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>Hospital Network Connected. Realtime sync active.</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-amber-600" />
          <span>
            Offline Mode: Responses are safely stored on this kiosk device and will sync automatically upon reconnection.
          </span>
        </>
      )}
    </div>
  );
}
