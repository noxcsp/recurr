'use client';

import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { createClient } from "@/lib/supabase/client";

export const usePushNotifications = () => {
  const supabase = createClient();

  const requestAndSaveToken = async (): Promise<boolean> => {
    try {
      if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notifications');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      if (!messaging) return false;

      let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const queryParams = new URLSearchParams({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
          measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
        });

        serviceWorkerRegistration = await navigator.serviceWorker.register(
          `/firebase-messaging-sw.js?${queryParams.toString()}`,
          { scope: '/firebase-cloud-messaging-push-scope' }
        );
      }

      if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
        throw new Error(
          "NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing from environment variables. " +
          "Please generate a Web Push Key Pair (VAPID key) in your Firebase Console " +
          "(Project Settings > Cloud Messaging > Web Push certificates) and add it to your .env.local file as NEXT_PUBLIC_FIREBASE_VAPID_KEY."
        );
      }

      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration,
      });

      if (currentToken) {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('fcm_token')
            .eq('id', user.id)
            .single();

          if (profile?.fcm_token !== currentToken) {
            const { error } = await supabase
              .from('profiles')
              .update({ fcm_token: currentToken })
              .eq('id', user.id);

            if (error) throw error;
            console.log('FCM Token successfully saved to profile!');
            return true;
          }
        }
      } else {
        console.warn('No registration token available. Request permission to generate one.');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token: ', error);
    }
    return false;
  };

  return { requestAndSaveToken };
};