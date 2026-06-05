// firebase-messaging-sw.js
// IMPORTANT: The importScripts version MUST match your installed firebase SDK version.
// Your package.json uses firebase ^12.x — using 12.x compat CDN here.
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

// These values MUST match your frontend .env.local / firebase config exactly.
// This file cannot read env vars — values must be hardcoded here.
const firebaseConfig = {
  apiKey: "AIzaSyDN7-URLbYH5x-MFXn6PB-Yg0Ite990FkE",
  authDomain: "forex-autopanel-d37c9.firebaseapp.com",
  projectId: "forex-autopanel-d37c9",
  storageBucket: "forex-autopanel-d37c9.firebasestorage.app",
  messagingSenderId: "201927442648",
  appId: "1:201927442648:web:da19b9b14abb0f270717ad",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handles background messages (when app tab is closed or not focused).
// Foreground messages are handled in useFcmToken.js via onMessage().
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  // Guard: FCM may send data-only messages with no notification object
  const title = payload.notification?.title || payload.data?.title || 'New Notification';
  const body = payload.notification?.body || payload.data?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/forex.png',
    badge: '/forex.png',
    data: payload.data || {},
    // Clicking the notification opens/focuses the app
    actions: [],
  });
});

// Handle notification click — brings app window into focus
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.link || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
