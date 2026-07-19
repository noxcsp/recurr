import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

if (!getApps().length) {
  try {
    const keyPath = path.join(process.cwd(), 'service_key.json');
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

export async function POST(req: Request) {
  try {
    const { token, title, body } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || new URL(req.url).origin;
    const absoluteLink = `${origin}/home`;

    const message = {
      token: token,
      notification: {
        title: title || 'Recurr Test Notification',
        body: body || 'This is a test push notification from Recurr.',
      },
      webpush: {
        fcmOptions: {
          link: absoluteLink,
        },
      },
      data: {
        link: '/home', // Keep relative fallback in data
      },
    };

    const response = await getMessaging().send(message);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification', details: String(error) }, { status: 500 });
  }
}
