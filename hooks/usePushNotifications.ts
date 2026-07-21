'use client';

import { useCallback } from "react";
import { getToken, deleteToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { createClient } from "@/lib/supabase/client";

export const usePushNotifications = () => {
  const supabase = createClient();

  const requestAndSaveToken = useCallback(async (): Promise<boolean> => {
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

        // Wait for the service worker to become active
        if (serviceWorkerRegistration && !serviceWorkerRegistration.active) {
          await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
              if (serviceWorkerRegistration?.active) {
                clearInterval(interval);
                resolve();
              }
            }, 50);
            // Timeout after 4 seconds to prevent hanging
            setTimeout(() => {
              clearInterval(interval);
              resolve();
            }, 4000);
          });
        }
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
          const cacheKey = `fcm_token_${user.id}`;
          const cachedToken = localStorage.getItem(cacheKey);

          if (cachedToken === currentToken) {
            console.log('FCM token already cached and synced.');
            return false; // No update occurred (already cached)
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('fcm_token')
            .eq('id', user.id)
            .single();

          let updated = false;
          if (profile?.fcm_token !== currentToken) {
            const { error } = await supabase
              .from('profiles')
              .update({ fcm_token: currentToken })
              .eq('id', user.id);

            if (error) throw error;
            console.log('FCM Token successfully saved to profile!');
            updated = true;
          }
          
          localStorage.setItem(cacheKey, currentToken);
          return updated; // Only returns true if the database was updated
        }
      } else {
        console.warn('No registration token available. Request permission to generate one.');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token: ', error);
    }
    return false;
  }, [supabase]);

  const clearFcmToken = useCallback(async (): Promise<boolean> => {
    try {
      if (messaging) {
        try {
          await deleteToken(messaging);
        } catch (err) {
          console.warn('Error deleting Firebase messaging token:', err);
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ fcm_token: null })
          .eq('id', user.id);

        if (error) {
          console.error('Error clearing FCM token from profile:', error);
        }

        const cacheKey = `fcm_token_${user.id}`;
        localStorage.removeItem(cacheKey);
        return true;
      }
    } catch (error) {
      console.error('Error clearing FCM token:', error);
    }
    return false;
  }, [supabase]);

  return { requestAndSaveToken, clearFcmToken };
};