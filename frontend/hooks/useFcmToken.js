import { useEffect, useRef } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "../lib/firebase";
import { apiFetch } from "../lib/apiFetch";
import { useAdminStore } from "./adminStore";

/**
 * Waits for a service worker registration to reach "activated" state.
 * getToken() silently returns null if called before SW is fully active.
 */
function waitForServiceWorkerActive(registration) {
  return new Promise((resolve) => {
    if (registration.active) {
      resolve(registration);
      return;
    }
    const sw = registration.installing || registration.waiting;
    if (!sw) {
      resolve(registration);
      return;
    }
    sw.addEventListener("statechange", function handler() {
      if (sw.state === "activated") {
        sw.removeEventListener("statechange", handler);
        resolve(registration);
      }
    });
  });
}

/**
 * Sends the current FCM token to the backend for storage.
 */
async function registerTokenWithBackend(token) {
  const browser = (() => {
    const ua = navigator.userAgent;
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    return "Unknown";
  })();

  const res = await apiFetch("/api/notifications/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform: "Web", browser }),
  });

  if (res.ok) {
    console.log("[FCM] ✅ Device token registered with backend.");
    return true;
  } else {
    if (res.status === 401) {
      return false;
    }
    const err = await res.json().catch(() => ({}));
    console.error("[FCM] Backend token registration failed:", err.message);
    return false;
  }
}

/**
 * useFcmToken
 *
 * Complete, production-grade Firebase Cloud Messaging setup:
 *  1. Checks browser support (Notifications + ServiceWorker)
 *  2. Requests notification permission
 *  3. Registers /public/firebase-messaging-sw.js — waits for SW activation
 *  4. Gets FCM token with VAPID key
 *  5. Registers token with backend (POST /api/notifications/devices)
 *  6. Handles token refresh — re-registers when FCM rotates the token
 *  7. Handles foreground messages via SW showNotification
 */
export function useFcmToken() {
  const tokenRegisteredForUser = useRef(null);
  const currentUser = useAdminStore((s) => s.currentUser);
  const isInitialized = useAdminStore((s) => s.isInitialized);

  useEffect(() => {
    // SSR guard
    if (typeof window === "undefined") return;

    // Only proceed if the auth store is initialized
    if (!isInitialized) return;

    // If there is no authenticated user, reset registration flag and return
    if (!currentUser || !currentUser.id) {
      tokenRegisteredForUser.current = null;
      return;
    }

    // Guard to prevent double registration if already registered for this user
    if (tokenRegisteredForUser.current === currentUser.id) return;

    let unsubscribeTokenRefresh = null;

    async function initFcm() {
      try {
        // ── 1. Browser support ────────────────────────────────────────────
        if (!("Notification" in window)) {
          console.warn("[FCM] Browser does not support Notifications.");
          return;
        }
        if (!("serviceWorker" in navigator)) {
          console.warn("[FCM] Browser does not support Service Workers.");
          return;
        }

        // ── 2. Validate VAPID key (Early Guard) ───────────────────────────
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey || vapidKey === "REPLACE_WITH_YOUR_VAPID_KEY") {
          return;
        }

        // ── 3. Permission ─────────────────────────────────────────────────
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("[FCM] Notification permission:", permission);
          return;
        }

        // ── 4. Register SW and wait until active ──────────────────────────
        // Critical: getToken() returns null if SW is still in "installing" state
        const rawRegistration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );
        const registration = await waitForServiceWorkerActive(rawRegistration);
        console.log("[FCM] Service worker active:", registration.active?.state);

        // ── 5. Get FCM token ──────────────────────────────────────────────
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (!token) {
          console.error("No FCM token received");
          return;
        }
        console.log("FCM Token:", token);

        // ── 6. Register token with backend ────────────────────────────────
        const registered = await registerTokenWithBackend(token);
        if (registered) {
          tokenRegisteredForUser.current = currentUser.id;
        }

        // ── 7. Token refresh listener ─────────────────────────────────────
        // FCM silently rotates tokens periodically. Without this, users stop
        // receiving push notifications after the old token expires.
        // We use explicit re-fetch + diff check, triggered by visibilitychange
        // and window focus events to avoid missing silent token rotation.
        let currentToken = token;

        const refreshToken = async () => {
          try {
            // Check auth state still valid before attempting rotation check
            const storeState = useAdminStore.getState();
            if (!storeState.currentUser?.id) return;

            const refreshedToken = await getToken(messaging, {
              vapidKey,
              serviceWorkerRegistration: registration,
            });
            if (refreshedToken && refreshedToken !== currentToken) {
              console.log("[FCM] Token rotated/refreshed — re-registering with backend.");
              const ok = await registerTokenWithBackend(refreshedToken);
              if (ok) {
                currentToken = refreshedToken;
              }
            }
          } catch (err) {
            console.warn("[FCM] Token refresh check failed:", err.message);
          }
        };

        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            refreshToken();
          }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", refreshToken);

        unsubscribeTokenRefresh = () => {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          window.removeEventListener("focus", refreshToken);
        };

        // ── 8. Foreground message handler ─────────────────────────────────
        // Background messages handled by the SW automatically.
        // This fires when the app tab is open and a push arrives.
        onMessage(messaging, (payload) => {
          console.log("[FCM] Foreground message:", payload);
          const title =
            payload.notification?.title || payload.data?.title || "Notification";
          const body =
            payload.notification?.body || payload.data?.body || "";

          // Delegate to SW so foreground + background behave identically
          if (registration.active) {
            registration.showNotification(title, {
              body,
              icon: "/forex.png",
              badge: "/forex.png",
              data: { link: payload.data?.link || "/dashboard", ...payload.data },
            });
          }
        });
      } catch (err) {
        if (
          err?.message?.includes("permission denied") ||
          Notification.permission === "denied"
        ) {
          console.warn(
            "[FCM] Notifications blocked by user. Skipping registration."
          );
          return;
        }
        console.error("[FCM] Initialization error:", err);
      }
    }

    initFcm();

    // Cleanup on unmount — remove SW event listener
    return () => {
      if (unsubscribeTokenRefresh) {
        unsubscribeTokenRefresh();
      }
    };
  }, [isInitialized, currentUser]);
}
