import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDN7-URLbYH5x-MFXn6PB-Yg0Ite990FkE",
  authDomain: "forex-autopanel-d37c9.firebaseapp.com",
  projectId: "forex-autopanel-d37c9",
  storageBucket: "forex-autopanel-d37c9.firebasestorage.app",
  messagingSenderId: "201927442648",
  appId: "1:201927442648:web:da19b9b14abb0f270717ad",
  measurementId: "G-0QCEQ9BHKX"
};

// Initialize Firebase safely for SSR/HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let analytics = null;
let messaging = null;

// Initialize client-only analytics and messaging
if (typeof window !== "undefined") {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => console.warn("Firebase Analytics not supported in this environment:", err));

  isMessagingSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch((err) => console.warn("Firebase Messaging not supported in this environment:", err));
}

export { app, analytics, messaging };
