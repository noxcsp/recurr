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
// FCM HTTP v1 sender & Types
// ---------------------------------------------------------------------------

interface NotificationResult {
  subscription_id: string;
  user_id: string;
  service_name: string;
  type: "due_tomorrow" | "overdue";
  days_overdue?: number;
  success: boolean;
  error?: string;
  isUnregistered?: boolean;
}

async function sendFcmNotification(
  accessToken: string,
  fcmToken: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string; isUnregistered?: boolean }> {
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
    const isUnregistered =
      res.status === 404 ||
      res.status === 410 ||
      errorText.includes("UNREGISTERED") ||
      errorText.includes("INVALID_ARGUMENT");

    return { success: false, error: errorText, isUnregistered };
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

    const allRows = [...(dueTomorrow ?? []), ...(overdueRows ?? [])];
    if (allRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions due or overdue to notify.", results: [] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ------------------------------------------------------------------
    // 3. Idempotency Check: Fetch notifications inserted today
    // ------------------------------------------------------------------
    const { data: existingTodayNotifs } = await supabase
      .from("notifications")
      .select("subscription_id")
      .gte("created_at", `${todayStr}T00:00:00Z`);

    const notifiedSubIdsToday = new Set(
      (existingTodayNotifs ?? [])
        .map((n) => n.subscription_id)
        .filter((id): id is string => Boolean(id))
    );

    // Filter out subscriptions that were already notified today
    const pendingDueTomorrow = (dueTomorrow ?? []).filter(
      (sub) => !notifiedSubIdsToday.has(sub.id)
    );
    const pendingOverdue = (overdueRows ?? []).filter(
      (sub) => !notifiedSubIdsToday.has(sub.id)
    );

    const eligibleRows = [...pendingDueTomorrow, ...pendingOverdue];
    const uniqueUserIds = [...new Set(eligibleRows.map((r) => r.user_id))];

    if (eligibleRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "All eligible subscriptions have already been notified today.", results: [] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ------------------------------------------------------------------
    // 4. Batch-fetch FCM tokens in chunks (max 250 user IDs per query)
    // ------------------------------------------------------------------
    const tokenMap: Record<string, string> = {};
    const PROFILE_CHUNK_SIZE = 250;
    for (let i = 0; i < uniqueUserIds.length; i += PROFILE_CHUNK_SIZE) {
      const userChunk = uniqueUserIds.slice(i, i + PROFILE_CHUNK_SIZE);
      const { data: profiles, error: err3 } = await supabase
        .from("profiles")
        .select("id, fcm_token")
        .in("id", userChunk)
        .not("fcm_token", "is", null);

      if (err3) throw new Error(`Profile query error: ${err3.message}`);
      for (const p of profiles ?? []) {
        if (p.fcm_token) tokenMap[p.id] = p.fcm_token;
      }
    }

    // Obtain Firebase access token once for all requests
    const accessToken = await getFirebaseAccessToken();

    const notificationsToInsert: {
      user_id: string;
      subscription_id: string;
      title: string;
      body: string;
      is_read: boolean;
    }[] = [];

    interface FcmTask {
      subscription_id: string;
      user_id: string;
      service_name: string;
      type: "due_tomorrow" | "overdue";
      days_overdue?: number;
      title: string;
      body: string;
      fcmToken: string;
    }

    const fcmTasks: FcmTask[] = [];

    // ------------------------------------------------------------------
    // Prepare due tomorrow notifications & FCM push tasks
    // ------------------------------------------------------------------
    for (const sub of pendingDueTomorrow) {
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
      if (fcmToken) {
        fcmTasks.push({
          subscription_id: sub.id,
          user_id: sub.user_id,
          service_name: sub.service_name,
          type: "due_tomorrow",
          title,
          body,
          fcmToken,
        });
      }
    }

    // ------------------------------------------------------------------
    // Prepare overdue notifications & FCM push tasks
    // ------------------------------------------------------------------
    for (const sub of pendingOverdue) {
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
      if (fcmToken) {
        fcmTasks.push({
          subscription_id: sub.id,
          user_id: sub.user_id,
          service_name: sub.service_name,
          type: "overdue",
          days_overdue: daysOverdue,
          title,
          body,
          fcmToken,
        });
      }
    }

    // ------------------------------------------------------------------
    // Dispatch FCM notifications in concurrent batches (25 tasks per batch)
    // ------------------------------------------------------------------
    const results: NotificationResult[] = [];
    const staleUserIds = new Set<string>();
    const PUSH_BATCH_SIZE = 25;

    for (let i = 0; i < fcmTasks.length; i += PUSH_BATCH_SIZE) {
      const batch = fcmTasks.slice(i, i + PUSH_BATCH_SIZE);
      const batchPromises = batch.map(async (task) => {
        const res = await sendFcmNotification(accessToken, task.fcmToken, task.title, task.body);
        if (res.isUnregistered) {
          staleUserIds.add(task.user_id);
        }
        return {
          subscription_id: task.subscription_id,
          user_id: task.user_id,
          service_name: task.service_name,
          type: task.type,
          days_overdue: task.days_overdue,
          success: res.success,
          error: res.error,
          isUnregistered: res.isUnregistered,
        };
      });

      const settled = await Promise.allSettled(batchPromises);
      for (const item of settled) {
        if (item.status === "fulfilled") {
          results.push(item.value);
        }
      }
    }

    // ------------------------------------------------------------------
    // Prune stale FCM tokens from database
    // ------------------------------------------------------------------
    if (staleUserIds.size > 0) {
      const staleUserList = [...staleUserIds];
      console.log(`[send-due-notifications] Pruning ${staleUserList.length} stale FCM token(s)...`);
      const { error: pruneError } = await supabase
        .from("profiles")
        .update({ fcm_token: null })
        .in("id", staleUserList);

      if (pruneError) {
        console.error("[send-due-notifications] Failed to prune stale FCM tokens:", pruneError);
      }
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
        pruned_stale_tokens: staleUserIds.size,
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
