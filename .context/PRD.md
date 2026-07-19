# Product Requirement Document (PRD): Recurr

## 1. Project Overview & Scope
Recurr is a full-stack, mobile-first subscription management Progressive Web App (PWA) designed to track recurring expenses, mitigate unintended renewals, and streamline financial status updates. The core architecture uses Next.js (App Router), Supabase for database management and edge logic, and Firebase Cloud Messaging (FCM) for push notifications. 

The application provides a centralized calendar view, automated push reminders, a dedicated notification panel, a gamified daily verification flow, and an optimized authentication system.

---

## 2. Product Goals & Business Logic
*   **Gamify Financial Health:** Drive daily user engagement and eliminate forgotten automated payments (e.g., e-wallets, credit cards) through friction-free UI interaction.
*   **Reduce Churn & Late Payments:** Keep tracking automated and highly visible across multiple touchpoints (Push, App Inbox, Visual Calendar).
*   **Frictionless Onboarding & Retention:** Support instant authentication methods and persistent login tracking to maximize daily return rates.

---

## 3. Minimum Viable Product (MVP) Features

### 3.1. Interactive Calendar Integration
*   **Centralized Visualization:** A highly responsive calendar interface serving as the primary dashboard view for tracking upcoming renewals.
*   **Subscription CRUD Operations:** 
    *   **Add New Subscription:** Users can tap any date grid or an action button to open a creation modal. Configurable fields include title, cost, currency, billing cycle (e.g., monthly, annual), and initial start/due date.
    *   **Edit Existing Subscription:** Selecting a subscription event on the calendar opens an inline or modal editing pane allowing users to adjust pricing, tracking details, or manually override payment statuses.
    *   **Delete Subscription:** Immediate removal capabilities directly from the detailed subscription detail view.

### 3.2. Daily Swipe-off Flow
*   **Trigger:** Displayed as a modal exactly once per calendar day at the user’s first opening of the PWA.
*   **UI/UX:** A Tinder-inspired stack of cards containing subscriptions due on the *current calendar day*.
*   **Interactions:**
    *   **Swipe Right:** Updates the subscription status to `'paid'`.
    *   **Swipe Left:** Dismisses the card, leaving the status as `'unpaid'`.
*   **Fallback Integrity:** The Swipe-off works concurrently with the interactive calendar. If a user swipes left (unpaid) or dismisses the modal, they can still manually update the subscription to `'paid'` directly within the calendar view later in the day.
*   **Primary Use Case:** Serves as a rapid confirmation tool for tracking auto-renewals debited directly via e-wallets or credit cards.

### 3.3. Notification Panel (In-App Feed)
*   **Functionality:** A dedicated notification panel (similar to Facebook’s notification dropdown/tab).
*   **Synchronization:** Complements the automated background push notifications sent via the Supabase Edge Function (`subscription-reminders`) and `pg_cron` / `pg_net`.
*   **Data Structure:** Stores read/unread status, message payload (title, body, date), and a link context pointing directly to the relevant subscription.

### 3.4. Persistent Authentication Session
*   **Functionality:** A "Remember Me" toggle option on the login form.
*   **Session Lifecycle:** Configures authentication tokens or session handling to remain valid with a strict 30-day expiration, minimizing the need for frequent manual logins.

### 3.5. Supabase Social Auth & Metadata Capture
*   **Google One-Tap:** Complete integration of Supabase Social Authentication supporting Google Sign-In via an optimized one-tap client flow.
*   **Automatic Attribute Extraction:** On successful OAuth sign-in, the system must automatically extract the user's Google display name and inject it into the application profile metadata.

### 3.6. Email/Password Signup Display Name Capture
*   **Functionality:** Extends the traditional email and password registration form to include a mandatory `Display Name` field.
*   **Behavior:** On registration, this value must be pushed directly to Supabase Auth user metadata (`user_metadata.display_name`) for application-wide personalization.