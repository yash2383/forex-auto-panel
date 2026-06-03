import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "../lib/firebase";
import { apiFetch } from "../lib/apiFetch";

export function useFcmToken(currentUser) {
  useEffect(() => {
    if (!currentUser) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const requestPermissionAndRegister = async () => {
      try {
        if (!messaging) {
          console.warn("Firebase messaging is not initialized or not supported on this platform/browser.");
          return;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission not granted by user.");
          return;
        }

        // Retrieve token
        let token;
        try {
          token = await getToken(messaging);
        } catch (tokenErr) {
          console.warn("Could not get FCM token automatically. Web push VAPID key may be required.", tokenErr);
          return;
        }

        if (token) {
          // Detect client properties
          const platform = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "iOS" : 
                           /Android/i.test(navigator.userAgent) ? "Android" : "Web";
                           
          const browser = /Chrome/i.test(navigator.userAgent) ? "Chrome" :
                          /Safari/i.test(navigator.userAgent) ? "Safari" :
                          /Firefox/i.test(navigator.userAgent) ? "Firefox" : "Unknown";

          console.log("Acquired FCM Token successfully.");
          
          await apiFetch("/api/notifications/devices", {
            method: "POST",
            body: JSON.stringify({ token, platform, browser }),
          });
        }
      } catch (err) {
        console.error("FCM Token registration failed:", err);
      }
    };

    requestPermissionAndRegister();
  }, [currentUser]);
}
