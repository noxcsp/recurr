# Database Schema & Form Validation Documentation

This document defines the database schemas, triggers, security policies, TypeScript types, and Zod form validations for **Recurr**, aligning the database layer with the product requirements.

---

## 1. Supabase Database Schema

The database is hosted on Supabase (PostgreSQL 17) and uses three primary tables in the `public` schema: `profiles`, `subscriptions`, and `notifications`.

### 1.1. `public.profiles`
Stores user-specific metadata and notification configurations. This table has a 1-to-1 relationship with Supabase Auth's `auth.users` table.

#### Columns
| Column Name | Data Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Foreign Key (`auth.users.id`) | Matches the Auth user UID. |
| `timezone` | `text` | Default: `'Asia/Manila'` | User's timezone, used by cron jobs to trigger alerts at appropriate local times. |
| `fcm_token` | `text` | Nullable | Firebase Cloud Messaging token for sending push notifications. |
| `updated_at` | `timestamptz` | Default: `timezone('utc'::text, now())` | Timestamp of the last profile modification. |

#### Row Level Security (RLS)
RLS is **enabled** on this table. The policies are:
*   **Users can view own profile**: `SELECT` where `(auth.uid() = id)`
*   **Users can update own profile**: `UPDATE` where `(auth.uid() = id)`

#### Profile Creation Trigger
To ensure synchronization with authentication, a database trigger automatically inserts a new profile row when a user completes registration.

*   **Trigger Name**: `on_auth_user_created`
*   **Event**: `AFTER INSERT` on `auth.users`
*   **Function**: `handle_new_user()`
*   **SQL Definition**:
    ```sql
    begin
        insert into public.profiles (id, timezone)
        values (
            new.id, 
            coalesce(new.raw_user_meta_data->>'timezone', 'Asia/Manila')
        );
        return new;
    end;
    ```

---

### 1.2. `public.subscriptions`
Stores the subscription entries tracked by users.

#### Columns
| Column Name | Data Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the subscription. |
| `user_id` | `uuid` | Foreign Key (`public.profiles.id`) | The owner of the subscription. |
| `service_name` | `text` | NOT NULL | Name of the service (e.g. "Netflix", "Spotify"). |
| `cost` | `numeric` | NOT NULL, Check: `cost >= 0` | Cost of the subscription. |
| `plan_type` | `text` | NOT NULL, Check: `Weekly`, `Monthly`, `Annual` | Billing cycle frequency. |
| `payment_mode` | `text` | NOT NULL | Payment method/mode (e.g. "Credit Card", "E-Wallet"). |
| `next_due_date` | `date` | NOT NULL | Next billing renewal date. |
| `is_trial` | `boolean` | Default: `false` | Indicates if the subscription is currently in a trial phase. |
| `trial_end_date` | `date` | Nullable | End date of the trial if `is_trial` is active. |
| `subscription_status` | `status` (Enum) | Default: `'unpaid'` | Payment status: `'paid'`, `'unpaid'`, or `'overdue'`. |
| `created_at` | `timestamptz` | Default: `timezone('utc'::text, now())` | Creation timestamp. |
| `updated_at` | `timestamptz` | Default: `timezone('utc'::text, now())` | Last update timestamp. |

#### Row Level Security (RLS)
RLS is **enabled** on this table. The policies are:
*   **Users can view own subscriptions**: `SELECT` where `(auth.uid() = user_id)`
*   **Users can insert own subscriptions**: `INSERT` check `(auth.uid() = user_id)`
*   **Users can update own subscriptions**: `UPDATE` where `(auth.uid() = user_id)` with check `(auth.uid() = user_id)`
*   **Users can delete own subscriptions**: `DELETE` where `(auth.uid() = user_id)`

---

### 1.3. `public.notifications`
Stores in-app notification feed logs and read statuses for the user's notification panel.

#### Columns
| Column Name | Data Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the notification. |
| `user_id` | `uuid` | Foreign Key (`public.profiles.id`) ON DELETE CASCADE | Recipient of the in-app notification. |
| `title` | `text` | NOT NULL | Title of the notification. |
| `body` | `text` | NOT NULL | Message body of the notification. |
| `is_read` | `boolean` | Default: `false` | Read status. |
| `subscription_id` | `uuid` | Foreign Key (`public.subscriptions.id`) ON DELETE CASCADE, Nullable | Link context pointing directly to the relevant subscription. |
| `created_at` | `timestamptz` | Default: `timezone('utc'::text, now())` | Creation timestamp. |

#### Row Level Security (RLS)
RLS is **enabled** on this table. The policies are:
*   **Users can view own notifications**: `SELECT` where `(auth.uid() = user_id)`
*   **Users can update own notifications**: `UPDATE` where `(auth.uid() = user_id)` with check `(auth.uid() = user_id)` (e.g., marking as read)
*   **Users can delete own notifications**: `DELETE` where `(auth.uid() = user_id)`

---

## 2. TypeScript Types

These TypeScript interfaces map directly to database objects.

*   `Profile` is defined in `types/profiles.ts`:
    ```typescript
    export interface Profile {
      id: string
      updated_at: string
      fcm_token: string | null
      timezone: string
    }
    ```
*   `Subscription` is defined in `types/subscriptions.ts`:
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
*   `Notification` is defined in `types/notifications.ts`:
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

## 3. Zod Form Validation Schemas

Form submissions are validated on the client side using Zod schemas to ensure type safety and data integrity before communicating with Supabase.

### 3.1. Subscription Schema
Located in `lib/validations/subscription.ts`.

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

> [!NOTE]
> The custom refine logic validates conditional input: if `is_trial` is active (`true`), the form requires a valid `trial_end_date`.

---

### 3.2. Authentication Schemas
Located in `lib/validations/auth.ts`.

#### Login Validation Schema
```typescript
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
```

#### Reset Password Validation Schema
```typescript
export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
})

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
```

#### Signup Validation Schema

```typescript
export const signupSchema = z.object({
  display_name: z.string().min(1, 'Display name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.'),
})

export type SignupFormValues = z.infer<typeof signupSchema>
```
