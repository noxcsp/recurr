import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_ADMIN_PROJECT_ID")!;
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_ADMIN_CLIENT_EMAIL")!;
const FIREBASE_PRIVATE_KEY = Deno.env.get("FIREBASE_ADMIN_PRIVATE_KEY")!.replace(/\\n/g, "\n");

// ---------------------------------------------------------------------------
// JWT helpers — signs a Google service-account JWT and exchanges it for an
// OAuth2 access token without needing firebase-admin (Deno compatible).
// ---------------------------------------------------------------------------

function base64UrlEncode(data: string | Uint8Array): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getFirebaseAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: FIREBASE_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const signingInput = `${header}.${payload}`;

  // Strip PEM headers and decode the private key
  const pemBody = FIREBASE_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));
  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Failed to get Firebase access token: ${err}`);
  }

  const { access_token } = await tokenRes.json();
  return access_token;
}

// ---------------------------------------------------------------------------
// FCM HTTP v1 sender
// ---------------------------------------------------------------------------

interface NotificationResult {
  subscription_id: string;
  user_id: string;
  service_name: string;
  type: "due_tomorrow" | "overdue";
  days_overdue?: number;
  success: boolean;
  error?: string;
}

async function sendFcmNotification(
  accessToken: string,
  fcmToken: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const url = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification: { title, body },
        webpush: {
          fcm_options: { link: "/home" },
        },
        data: { link: "/home" },
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return { success: false, error: errorText };
  }
  return { success: true };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve today and tomorrow as UTC date strings (YYYY-MM-DD)
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const tomorrowDate = new Date(now);
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

    // ------------------------------------------------------------------
    // 1. Subscriptions due TOMORROW (all statuses)
    // ------------------------------------------------------------------
    const { data: dueTomorrow, error: err1 } = await supabase
      .from("subscriptions")
      .select("id, user_id, service_name, plan_type, next_due_date, subscription_status")
      .eq("next_due_date", tomorrowStr);

    if (err1) throw new Error(`Query error (due tomorrow): ${err1.message}`);

    // ------------------------------------------------------------------
    // 2. Overdue subscriptions (status = overdue, due date < today)
    // ------------------------------------------------------------------
    const { data: overdueRows, error: err2 } = await supabase
      .from("subscriptions")
      .select("id, user_id, service_name, plan_type, next_due_date, subscription_status")
      .eq("subscription_status", "overdue")
      .lt("next_due_date", todayStr);

    if (err2) throw new Error(`Query error (overdue): ${err2.message}`);

    // Get unique user IDs from both result sets
    const allRows = [...(dueTomorrow ?? []), ...(overdueRows ?? [])];
    const uniqueUserIds = [...new Set(allRows.map((r) => r.user_id))];

    if (uniqueUserIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions to notify.", results: [] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Batch-fetch FCM tokens for all relevant users
    const { data: profiles, error: err3 } = await supabase
      .from("profiles")
      .select("id, fcm_token")
      .in("id", uniqueUserIds)
      .not("fcm_token", "is", null);

    if (err3) throw new Error(`Profile query error: ${err3.message}`);

    const tokenMap: Record<string, string> = {};
    for (const p of profiles ?? []) {
      if (p.fcm_token) tokenMap[p.id] = p.fcm_token;
    }

    // Obtain Firebase access token once for all requests
    const accessToken = await getFirebaseAccessToken();

    const results: NotificationResult[] = [];

    const notificationsToInsert: {
      user_id: string;
      subscription_id: string;
      title: string;
      body: string;
      is_read: boolean;
    }[] = [];

    // ------------------------------------------------------------------
    // Send "due tomorrow" notifications & populate in-app notifications
    // ------------------------------------------------------------------
    for (const sub of dueTomorrow ?? []) {
      const title = `⏰ ${sub.service_name} is due tomorrow`;
      const body = `Your ${sub.service_name} subscription (${sub.plan_type} plan) renews tomorrow. Make sure your payment is ready.`;

      notificationsToInsert.push({
        user_id: sub.user_id,
        subscription_id: sub.id,
        title,
        body,
        is_read: false,
      });

      const fcmToken = tokenMap[sub.user_id];
      if (!fcmToken) continue;

      const result = await sendFcmNotification(accessToken, fcmToken, title, body);
      results.push({
        subscription_id: sub.id,
        user_id: sub.user_id,
        service_name: sub.service_name,
        type: "due_tomorrow",
        ...result,
      });
    }

    // ------------------------------------------------------------------
    // Send overdue notifications & populate in-app notifications
    // ------------------------------------------------------------------
    for (const sub of overdueRows ?? []) {
      const dueDate = new Date(`${sub.next_due_date}T00:00:00Z`);
      const todayMidnight = new Date(`${todayStr}T00:00:00Z`);
      const daysOverdue = Math.floor(
        (todayMidnight.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const dayLabel = daysOverdue === 1 ? "day" : "days";
      const title = `🚨 ${sub.service_name} is ${daysOverdue} ${dayLabel} overdue`;
      const body = `Your ${sub.service_name} (${sub.plan_type} plan) payment is ${daysOverdue} ${dayLabel} overdue. Please settle it to avoid service interruption.`;

      notificationsToInsert.push({
        user_id: sub.user_id,
        subscription_id: sub.id,
        title,
        body,
        is_read: false,
      });

      const fcmToken = tokenMap[sub.user_id];
      if (!fcmToken) continue;

      const result = await sendFcmNotification(accessToken, fcmToken, title, body);
      results.push({
        subscription_id: sub.id,
        user_id: sub.user_id,
        service_name: sub.service_name,
        type: "overdue",
        days_overdue: daysOverdue,
        ...result,
      });
    }

    // ------------------------------------------------------------------
    // Batch insert in-app notifications into Supabase
    // ------------------------------------------------------------------
    let insertedInAppCount = 0;
    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notificationsToInsert);

      if (insertError) {
        console.error(
          "[send-due-notifications] Error batch inserting notifications:",
          insertError
        );
      } else {
        insertedInAppCount = notificationsToInsert.length;
        console.log(
          `[send-due-notifications] Successfully inserted ${insertedInAppCount} in-app notification(s).`
        );
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    console.log(
      `[send-due-notifications] FCM: ${successCount} sent, ${failCount} failed. In-app: ${insertedInAppCount} inserted. Date: ${todayStr}`
    );

    return new Response(
      JSON.stringify({
        date: todayStr,
        total_fcm: results.length,
        success_fcm: successCount,
        failed_fcm: failCount,
        inserted_in_app: insertedInAppCount,
        results,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-due-notifications] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
