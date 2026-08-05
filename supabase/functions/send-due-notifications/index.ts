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
  type: "due" | "trial_ending" | "overdue";
  days_overdue?: number;
  advance_days?: number;
  success: boolean;
  error?: string;
  isUnregistered?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

function addDaysToDateStr(baseDateStr: string, days: number): string {
  const d = new Date(`${baseDateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function getDaysDifference(startDateStr: string, endDateStr: string): number {
  const start = new Date(`${startDateStr}T00:00:00Z`);
  const end = new Date(`${endDateStr}T00:00:00Z`);
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
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

Deno.serve(async (req: Request) => {
  try {
    // ------------------------------------------------------------------
    // Authorization Check: Validate Bearer token with SUPABASE_SECRET_KEY
    // ------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    const secretKey = Deno.env.get("SUPABASE_SECRET_KEY");

    let isAuthorized = false;

    if (authHeader && secretKey) {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      isAuthorized = token === secretKey;
    }

    if (!secretKey) {
      console.warn(
        "[send-due-notifications] SUPABASE_SECRET_KEY not configured in environment."
      );
      isAuthorized = false;
    }

    if (!isAuthorized) {
      console.warn("[send-due-notifications] Unauthorized request attempt.");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or missing Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve today as UTC date string (YYYY-MM-DD)
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // ------------------------------------------------------------------
    // 1. Fetch user profiles to map FCM tokens & notify_advance_days
    // ------------------------------------------------------------------
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, fcm_token, notify_advance_days");

    if (profileError) {
      throw new Error(`Profile query error: ${profileError.message}`);
    }

    const profileMap = new Map<
      string,
      { fcm_token: string | null; notify_advance_days: number }
    >();

    const advanceDaysSet = new Set<number>();

    for (const p of profiles ?? []) {
      const days = typeof p.notify_advance_days === "number" ? p.notify_advance_days : 3;
      profileMap.set(p.id, {
        fcm_token: p.fcm_token ?? null,
        notify_advance_days: days,
      });
      advanceDaysSet.add(days);
    }

    if (advanceDaysSet.size === 0) {
      advanceDaysSet.add(3);
    }

    // Derive target date strings for each distinct notify_advance_days value
    const targetDates = Array.from(advanceDaysSet).map((days) =>
      addDaysToDateStr(todayStr, days)
    );

    // ------------------------------------------------------------------
    // 2. Fetch candidate subscriptions (due, trial ending, overdue)
    // ------------------------------------------------------------------
    const { data: upcomingDue, error: err1 } = await supabase
      .from("subscriptions")
      .select("id, user_id, service_name, cost, plan_type, next_due_date, is_trial, trial_end_date, subscription_status")
      .in("next_due_date", targetDates);

    if (err1) throw new Error(`Query error (upcoming due): ${err1.message}`);

    const { data: trialEnding, error: err2 } = await supabase
      .from("subscriptions")
      .select("id, user_id, service_name, cost, plan_type, next_due_date, is_trial, trial_end_date, subscription_status")
      .eq("is_trial", true)
      .in("trial_end_date", targetDates);

    if (err2) throw new Error(`Query error (trial ending): ${err2.message}`);

    const { data: overdueRows, error: err3 } = await supabase
      .from("subscriptions")
      .select("id, user_id, service_name, cost, plan_type, next_due_date, is_trial, trial_end_date, subscription_status")
      .eq("subscription_status", "overdue")
      .lt("next_due_date", todayStr);

    if (err3) throw new Error(`Query error (overdue): ${err3.message}`);

    // Deduplicate candidate subscriptions by ID
    type SubRow = NonNullable<typeof upcomingDue>[number];
    const candidateMap = new Map<string, SubRow>();
    for (const row of [...(upcomingDue ?? []), ...(trialEnding ?? []), ...(overdueRows ?? [])]) {
      candidateMap.set(row.id, row);
    }

    const candidateRows = Array.from(candidateMap.values());
    if (candidateRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions due, trial ending, or overdue to notify.", results: [] }),
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

    const pendingCandidates = candidateRows.filter(
      (sub) => !notifiedSubIdsToday.has(sub.id)
    );

    if (pendingCandidates.length === 0) {
      return new Response(
        JSON.stringify({ message: "All eligible subscriptions have already been notified today.", results: [] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtain Firebase access token once for all FCM push requests
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
      type: "due" | "trial_ending" | "overdue";
      days_overdue?: number;
      advance_days?: number;
      title: string;
      body: string;
      fcmToken: string;
    }

    const fcmTasks: FcmTask[] = [];

    // ------------------------------------------------------------------
    // 4. Generate notification titles & bodies matching user advance settings
    // ------------------------------------------------------------------
    for (const sub of pendingCandidates) {
      const userProfile = profileMap.get(sub.user_id);
      if (!userProfile) continue;

      const userAdvanceDays = userProfile.notify_advance_days;
      const userTargetDate = addDaysToDateStr(todayStr, userAdvanceDays);
      const formattedCost = formatCurrency(sub.cost ?? 0);

      let title = "";
      let body = "";
      let notifType: "due" | "trial_ending" | "overdue" | null = null;
      let daysOverdue: number | undefined;

      // Condition A: Trial Ending
      if (sub.is_trial && sub.trial_end_date === userTargetDate) {
        notifType = "trial_ending";
        const timingStr =
          userAdvanceDays === 0
            ? "today"
            : userAdvanceDays === 1
            ? "tomorrow"
            : `in ${userAdvanceDays} days`;

        title = `${sub.service_name} trial ends ${timingStr}`;
        body = `Converts to ${sub.plan_type} at ${formattedCost}. Review to keep or cancel.`;
      }
      // Condition B: Upcoming Renewal
      else if (sub.next_due_date === userTargetDate) {
        notifType = "due";
        const timingStr =
          userAdvanceDays === 0
            ? "today"
            : userAdvanceDays === 1
            ? "tomorrow"
            : `in ${userAdvanceDays} days`;

        title = `${sub.service_name} due ${timingStr}`;
        body = `${sub.plan_type} renewal of ${formattedCost}. Review to keep or cancel.`;
      }
      // Condition C: Overdue
      else if (sub.subscription_status === "overdue" && sub.next_due_date < todayStr) {
        notifType = "overdue";
        daysOverdue = getDaysDifference(sub.next_due_date, todayStr);
        const dayLabel = daysOverdue === 1 ? "day" : "days";

        title = `${sub.service_name} overdue by ${daysOverdue} ${dayLabel}`;
        body = `${sub.plan_type} payment of ${formattedCost} is overdue. Review to settle or cancel.`;
      }

      if (!notifType || !title || !body) continue;

      notificationsToInsert.push({
        user_id: sub.user_id,
        subscription_id: sub.id,
        title,
        body,
        is_read: false,
      });

      if (userProfile.fcm_token) {
        fcmTasks.push({
          subscription_id: sub.id,
          user_id: sub.user_id,
          service_name: sub.service_name,
          type: notifType,
          days_overdue: daysOverdue,
          advance_days: userAdvanceDays,
          title,
          body,
          fcmToken: userProfile.fcm_token,
        });
      }
    }

    // ------------------------------------------------------------------
    // 5. Dispatch FCM notifications in concurrent batches (25 tasks per batch)
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
          advance_days: task.advance_days,
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
    // 6. Prune stale FCM tokens from database
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
    // 7. Batch insert in-app notifications into Supabase
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
