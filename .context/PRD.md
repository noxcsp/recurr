# Product Requirement Document (PRD): Recurr

## 1. Project Overview & Scope
Recurr is a full-stack, mobile-first subscription management Progressive Web App (PWA) designed to track recurring expenses, mitigate unintended renewals, and streamline financial status updates. The core architecture uses Next.js (App Router), Supabase for database management and edge logic, and Firebase Cloud Messaging (FCM) for push notifications.

The application provides a centralized calendar view, automated push reminders, a dedicated notification panel, a gamified daily swipe-off verification flow, automated payment ledger tracking, and an optimized authentication system.

---

## 2. Product Goals & Business Logic
*   **Gamify Financial Health:** Drive daily user engagement and eliminate forgotten automated payments (e.g., e-wallets, credit cards) through friction-free UI interaction.
*   **Reduce Churn & Late Payments:** Keep tracking automated and highly visible across multiple touchpoints (Push, App Inbox, Visual Calendar, Metrics Dashboard).
*   **Real-time Financial Analytics:** Dynamically calculate monthly spend trends, active subscription metrics, and top spending services directly on the server from active subscriptions and payment ledger history.
*   **Frictionless Onboarding & Retention:** Support instant authentication methods (Google One-Tap, Email/Password) and persistent login tracking to maximize daily return rates.

---

## 3. Minimum Viable Product (MVP) Features

### 3.1. Interactive Calendar Integration & Dashboard Metrics
*   **Centralized Visualization:** A highly responsive calendar interface serving as the primary dashboard view for tracking upcoming renewals.
*   **Dashboard Analytics:** Metric cards displaying Monthly Spend, Active Subscriptions, Due This Week, and Top Subscription, calculated dynamically on the server from `subscriptions` and `subscription_payments`.
*   **Subscription CRUD Operations:** 
    *   **Add New Subscription:** Users can tap any date grid or an action button to open a creation modal. Configurable fields include title, cost, payment mode, billing cycle (`Weekly`, `Monthly`, `Annual`), due date, and optional trial details.
    *   **Edit Existing Subscription:** Selecting a subscription event on the calendar opens an inline or modal editing pane allowing users to adjust pricing, tracking details, or manually override payment statuses.
    *   **Delete Subscription:** Immediate removal capabilities directly from the detailed subscription view.

### 3.2. Daily Swipe-off Flow & Payment Processing
*   **Trigger:** Displayed as a modal exactly once per calendar day at the user’s first opening of the PWA (tracked via `profiles.last_swipeoff_date`).
*   **UI/UX:** A swipeable card stack containing subscriptions due on or before the current calendar day.
*   **Interactions & Database Trigger:**
    *   **Swipe Right (Paid):** Updates `subscription_status` to `'paid'`. The database trigger (`trg_process_subscription_payment`) automatically logs a payment entry into `subscription_payments`, shifts `next_due_date` forward by one cycle (`1 week`, `1 month`, or `1 year`), and resets status to `'unpaid'`.
    *   **Swipe Left:** Dismisses the card, leaving the status as `'unpaid'`.
*   **Fallback Integrity:** If a user swipes left or dismisses the modal, they can manually mark the subscription as `'paid'` in the calendar later.

### 3.3. Payment Ledger & History
*   **Payment Tracking:** Automatic audit ledger stored in `subscription_payments` recording each payment event (`service_name`, `amount`, `plan_type`, `payment_date`).
*   **Dynamic Analytics:** Eliminates static aggregate tables (such as `analytics_monthly`) by computing historical spend trends and period-over-period percentages on-the-fly server-side.

### 3.4. Notification Panel (In-App Feed) & Push Alerts
*   **Functionality:** A dedicated notification panel for tracking alert history.
*   **Synchronization:** Complements background push notifications dispatched via Supabase Edge Function (`send-due-notifications`) scheduled daily using `pg_cron` / `pg_net`.
*   **Data Structure:** Stores read/unread status, title, body payload, and direct reference link to `subscription_id`.

### 3.5. Authentication & User Setup
*   **Persistent Auth:** Includes a "Remember me" checkbox when signing in with email and password to toggle 30-day persistent session retention for a seamless user experience.
*   **Google One-Tap & Email Registration:** Captures user metadata and automatically initializes a `profiles` record via database trigger (`on_auth_user_created`), using `COALESCE(display_name, full_name, name)` to ensure OAuth display names (e.g. Google Sign-In) are never null.