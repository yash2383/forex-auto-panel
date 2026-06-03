importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/forex.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
