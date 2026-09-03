/**
 * MediKiosk Offline/PWA Sync Preparation Service
 * Monitors browser network status and prepares local queue for background synchronization.
 */

export const syncService = {
  isOnline() {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  },

  listenNetworkStatus(callback) {
    const handleOnline = () => callback({ online: true, message: "Connected to hospital network" });
    const handleOffline = () => callback({
      online: false,
      message: "Offline: Progress is saved locally on this kiosk device and will synchronize when connection resumes."
    });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }
};
