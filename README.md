# ⚡ Phase — Modern Subscription Tracker

> A sleek, mobile-first Progressive Web App (PWA) to master recurring expenses, track subscription renewals, and eliminate unintended charges.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-emerald?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-Cloud%20Messaging-ffca28?style=for-the-badge&logo=firebase)

---

## 📌 Overview

**Phase** is a full-stack financial health assistant designed to mitigate subscription creep and forgotten free trials. Built with Next.js App Router and Supabase, Phase provides real-time spending analytics, visual renewal tracking, automated payment ledgers, and push alerts across mobile and desktop.

---

## ✨ Key Features

* 📅 **Interactive Renewal Calendar** — Centralized visual dashboard to preview upcoming payment dates and billing cycles at a glance.
* 💳 **Real-Time Financial Analytics** — Dynamic server-side calculation of monthly spend, active subscriptions, due dates, and top recurring expenses.
* 👆 **Gamified Daily Swipe-Off** — interactive swipe card flow presented daily to log payments and automatically increment next billing dates.
* 🔔 **Push Notifications & In-App Inbox** — Automated renewal alerts via Firebase Cloud Messaging (FCM) and Supabase Edge Functions with a dedicated notification feed.
* 🧾 **Automated Payment Ledger** — Audit history recording individual transactions (`amount`, `payment_date`, `plan_type`) for period-over-period trend analysis.
* 📲 **Installable PWA & Seamless Auth** — Native app experience on iOS and Android with Google One-Tap and persistent 30-day session authentication.

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server Components & Actions) |
| **Language & Styling** | TypeScript, Tailwind CSS v4, Motion (Framer Motion) |
| **UI Components** | Shadcn UI, Base UI, Lucide Icons |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, Triggers & Edge Functions) |
| **Notifications** | Firebase Cloud Messaging (FCM), Service Worker |
| **State Management** | Zustand |

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js `20.x` or higher
- npm `10.x` or higher

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/phase.git

# Navigate to the project directory
cd phase

# Install dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local` and populate your credentials:
```bash
cp .env.example .env.local
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Development Commands

```bash
# Run TypeScript type checking
npm run typecheck

# Format code with Prettier
npm run format

# Build production bundle
npm run build
```

---

## 🔒 Security & Architecture Highlights

- **Row Level Security (RLS)**: Enforced across all Supabase database tables to isolate user data.
- **Automated Ledger Triggers**: Database triggers automatically process payment logs and advance recurring billing dates (`Weekly`, `Monthly`, `Annual`) seamlessly upon payment verification.
- **Server-Side Security**: Strict Zod schema validation applied across client forms and server endpoints.

---

