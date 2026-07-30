# Database Schema & Form Validation Documentation

This document defines the database schemas, triggers, security policies, TypeScript types, and Zod form validations for **Recurr**, aligning the database layer with the product requirements.

---

## 1. Modular Database Architecture & Migrations

The database is hosted on Supabase (PostgreSQL 17) and is managed via versioned migration files in `supabase/migrations/`:
*   `20260728180000_profiles.sql` (Module 1: Profiles & Auth)
*   `20260728180100_subscriptions.sql` (Module 2: Subscriptions)
*   `20260728180200_notifications.sql` (Module 3: Notifications & Push Cron)
*   `20260728180300_subscription_payments.sql` (Module 4: Payment Ledger & Trigger)

> [!NOTE]
> All spending analytics and period trends are calculated dynamically server-side using the `subscriptions` and `subscription_payments` tables.

---

## 2. Enums & Tables

### 2.1. Enum: `public.status`
Represents the status of a subscription: `'paid'`, `'unpaid'`, or `'overdue'`.

---

### 2.2. `public.profiles`
Stores user-specific metadata, FCM tokens, and daily swipe-off tracking. 1-to-1 relationship with `auth.users`.

#### Columns
| Column Name | Data Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Foreign Key (`auth.users.id` ON DELETE CASCADE) | Auth user UID. |
| `display_name` | `text` | Nullable | User display name extracted from auth metadata. |
| `timezone` | `text` | Nullable | User timezone string. |
| `fcm_token` | `text` | Nullable | Firebase Cloud Messaging token for push alerts. |
| `last_swipeoff_date` | `date` | Nullable | Last date user completed/dismissed daily swipe-off flow. |
| `updated_at` | `timestamptz` | Default: `timezone('utc'::text, now())` | Last profile update timestamp. |

#### Indexes & RLS
*   **Index**: `idx_profiles_fcm_token` (`id` WHERE `fcm_token IS NOT NULL`)
*   **RLS**: Enabled (`SELECT` and `UPDATE` for `auth.uid() = id`).

#### Profile Creation Trigger
*   **Trigger**: `on_auth_user_created` (AFTER INSERT on `auth.users`)
*   **Function**: `handle_new_user()` — auto-creates profile row using auth metadata, evaluating `COALESCE(display_name, full_name, name)` to ensure display names are populated for both Email/Password and OAuth (Google) sign-ins.

---

### 2.3. `public.subscriptions`
Stores active and upcoming subscriptions.

#### Columns
| Column Name | Data Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Default: `gen_random_uuid()` | Subscription identifier. |
| `user_id` | `uuid` | Foreign Key (`public.profiles.id` ON DELETE CASCADE) | Subscription owner. |
| `service_name` | `text` | NOT NULL | Service title (e.g. "Netflix", "Spotify"). |
| `category` | `text` | NOT NULL, Default: `'Other'` | Service category (e.g. "Entertainment", "Music", "Productivity"). |
| `cost` | `numeric` | NOT NULL, Check: `cost >= 0` | Subscription cost amount. |
| `plan_type` | `text` | NOT NULL, Check: `Weekly`, `Monthly`, `Annual` | Renewal frequency. |
| `payment_mode` | `text` | NOT NULL | Payment method name. |
| `next_due_date` | `date` | NOT NULL | Next renewal date. |
| `is_trial` | `boolean` | NOT NULL, Default: `false` | Active trial flag. |
| `trial_end_date` | `date` | Nullable | Trial end date if `is_trial` is true. |
| `subscription_status` | `public.status` | NOT NULL, Default: `'unpaid'` | Status (`paid`, `unpaid`, `overdue`). |
| `created_at` | `timestamptz` | Default: `timezone('utc'::text, now())` | Creation timestamp. |
| `updated_at` | `timestamptz` | Default: `timezone('utc'::text, now())` | Update timestamp. |

#### Indexes & RLS
*   **Indexes**: `idx_subscriptions_user_id`, `idx_subscriptions_next_due_date`, `idx_subscriptions_due_status`, `idx_subscriptions_category`
*   **RLS**: Enabled (`SELECT`, `INSERT`, `UPDATE`, `DELETE` for `auth.uid() = user_id`).

---

### 2.4. `public.subscription_payments`
Audit ledger tracking completed subscription payments.

#### Columns
| Column Name | Data Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Default: `gen_random_uuid()` | Payment ledger ID. |
| `user_id` | `uuid` | Foreign Key (`public.profiles.id` ON DELETE CASCADE) | Owner user ID. |
| `subscription_id` | `uuid` | Foreign Key (`public.subscriptions.id` ON DELETE CASCADE) | Linked subscription ID. |
| `service_name` | `text` | NOT NULL | Service name. |
| `amount` | `numeric` | NOT NULL, Check: `amount >= 0` | Payment amount logged. |
| `plan_type` | `text` | NOT NULL | Plan type at time of payment. |
| `payment_date` | `timestamptz` | Default: `timezone('utc'::text, now())` | Timestamp of payment. |
| `created_at` | `timestamptz` | Default: `timezone('utc'::text, now())` | Record creation timestamp. |

#### Payment Trigger
*   **Trigger**: `trg_process_subscription_payment` (BEFORE UPDATE on `public.subscriptions`)
*   **Function**: `process_subscription_payment()` — When `subscription_status` is updated to `'paid'`, inserts a ledger row into `subscription_payments`, shifts `next_due_date` forward by one cycle, and resets status to `'unpaid'`. If past due, marks status as `'overdue'`.

---

### 2.5. `public.notifications`
In-app notification feed logs and read statuses.

#### Columns
| Column Name | Data Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Default: `gen_random_uuid()` | Notification ID. |
| `user_id` | `uuid` | Foreign Key (`auth.users.id` ON DELETE CASCADE) | Recipient user ID. |
| `title` | `text` | NOT NULL | Notification title. |
| `body` | `text` | NOT NULL | Notification payload body. |
| `is_read` | `boolean` | NOT NULL, Default: `false` | Read flag. |
| `subscription_id` | `uuid` | Foreign Key (`public.subscriptions.id` ON DELETE SET NULL) | Optional link to subscription. |
| `created_at` | `timestamptz` | Default: `now()` | Timestamp of alert. |

#### Cron Job
*   `send-due-notifications` (`0 0 * * *`) dispatches daily push notifications for subscriptions due today.

---

## 3. TypeScript Types

TypeScript interfaces in `types/` map directly to database objects:

*   `Profile` (`types/profiles.ts`):
    ```typescript
    export interface Profile {
      id: string
      display_name: string | null
      timezone: string | null
      fcm_token: string | null
      last_swipeoff_date: string | null
      updated_at: string
    }
    ```
*   `Subscription` (`types/subscriptions.ts`):
    ```typescript
    export interface Subscription {
      id: string
      user_id: string
      service_name: string
      cost: number
      plan_type: "Weekly" | "Monthly" | "Annual"
      payment_mode: string
      next_due_date: string
      is_trial: boolean
      trial_end_date?: string | null
      created_at: string
      updated_at: string
      subscription_status: "unpaid" | "paid" | "overdue"
    }
    ```
*   `PaymentRecord` (`types/payments.ts`):
    ```typescript
    export interface PaymentRecord {
      id: string
      user_id: string
      subscription_id: string | null
      service_name: string
      amount: number
      plan_type: string
      payment_date: string
      created_at: string
    }
    ```
*   `Notification` (`types/notifications.ts`):
    ```typescript
    export interface Notification {
      id: string
      user_id: string
      title: string
      body: string
      is_read: boolean
      subscription_id: string | null
      created_at: string
    }
    ```

---

## 4. Zod Form Validation Schemas

Client & server validation schemas located in `lib/validations/`:

### 4.1. Subscription Schema (`lib/validations/subscription.ts`)
```typescript
import { z } from "zod"

export const subscriptionSchema = z
  .object({
    service_name: z.string().min(1, "Service name is required."),
    cost: z
      .union([z.number(), z.string()])
      .transform((val) => (val === "" ? undefined : Number(val)))
      .pipe(
        z
          .number({ message: "Cost must be a positive number." })
          .positive("Cost must be a positive number.")
      ),
    plan_type: z.enum(["Weekly", "Monthly", "Annual"]),
    payment_mode: z.string().min(1, "Payment mode is required."),
    next_due_date: z.date({ error: "Please select a due date." }),
    is_trial: z.boolean(),
    trial_end_date: z.date().optional().nullable(),
    subscription_status: z.enum(["unpaid", "paid", "overdue"]),
  })
  .refine(
    (data) => {
      if (data.is_trial && !data.trial_end_date) {
        return false
      }
      return true
    },
    {
      message: "Please select a trial end date.",
      path: ["trial_end_date"],
    }
  )

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>
```

### 4.2. Auth Validation Schemas (`lib/validations/auth.ts`)
*   `loginSchema`: Validates email and password requirements.
*   `signupSchema`: Requires `display_name`, `email`, and `password`.
*   `resetPasswordSchema`: Validates password reset email format.
