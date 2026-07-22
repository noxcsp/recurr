import { NextResponse } from "next/server";

/**
 * Serves the Firebase Messaging Service Worker with the Firebase config
 * baked in as inline constants at request time — not exposed as URL query params.
 *
 * Registered in usePushNotifications.ts as:
 *   navigator.serviceWorker.register('/api/firebase-messaging-sw.js', { scope: '...' })
 *
 * The `Service-Worker-Allowed: /` header grants the SW scope over the full origin
 * even though the script is served from the /api/ path.
 */
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
  };

  const swContent = `
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = ${JSON.stringify(config)};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // Background message received — notification is shown automatically by FCM.
  // Custom handling (e.g. badge updates) can be added here.
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link || '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(link) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
`;

  return new NextResponse(swContent, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Grants the SW scope over the full origin despite being served from /api/
      "Service-Worker-Allowed": "/",
      // Never cache — always serve fresh so config changes take effect immediately
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
