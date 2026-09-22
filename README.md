# Anonymous Peer-to-Peer Giving Platform (Double-Blind Transactions)

A full-stack **web application for anonymous, peer-to-peer giving**, built with **Next.js, PostgreSQL, Prisma, and Stripe**. The platform lets one party send a gift/contribution to another without either side seeing the other's identity — a "double-blind" transaction model — while still handling secure payments, account management, and financial reporting behind the scenes.

This repository is a portfolio build showcasing the architecture, security practices, and payment engineering used on this type of project.

---

## 🔍 What This Project Solves

Peer-to-peer giving platforms need to balance two things that are normally in tension:

- **Privacy** — givers and recipients should not be able to identify each other directly (no names, emails, or contact details exposed on either side).
- **Trust & accountability** — every transaction still needs to be verifiable, auditable, and safely processed for compliance and support purposes.

This app solves that by keeping identity data isolated at the account/database layer while routing all money movement through Stripe, so neither party ever sees the other's payment details, and platform admins retain a secure audit trail without exposing personal data to end users.

---

## ✨ Core Features

### 🔐 Secure Account System
- Email/password registration with strong validation (Zod)
- Encrypted password storage (bcrypt hashing)
- Session-based authentication (NextAuth)
- Forgot password / reset password with time-limited, single-use tokens
- Protected routes and role-based access (user vs. admin)

### 🤝 Anonymous Peer-to-Peer Transactions
- Identity-blind sending and receiving flow — no personal contact info is exchanged between parties
- Stripe-powered checkout so cardholder data never touches the app's own servers
- Automatic status updates via Stripe webhooks (payment success/failure, cancellations)
- Transaction lifecycle handled server-side, not exposed to either party's counterpart

### 💳 Payments & Contribution Management
- One-time and recurring (subscription-style) contribution support
- Cancel / reactivate flows with graceful "access until period end" handling
- Full payment history per account
- Downloadable invoices/receipts

### 🛠️ Admin / Superadmin Dashboard
- Searchable directory of accounts and activity
- Payment and invoice oversight across the platform
- Manual invoice creation for support/finance workflows
- Centralized visibility into platform health without exposing user-to-user identity data

### 🧱 Reliability & Data Integrity
- PostgreSQL + Prisma ORM with transactional writes (no partial/broken records)
- Webhook signature verification to prevent spoofed payment events
- Input validation on every API boundary
- Parameterized queries throughout (no raw SQL, no injection surface)

---

## 🛠️ Tech Stack

| Layer          | Technology |
|----------------|------------|
| Framework      | Next.js (App Router), React, TypeScript |
| Styling        | Tailwind CSS |
| Auth           | NextAuth (JWT sessions) |
| Database       | PostgreSQL |
| ORM            | Prisma |
| Payments       | Stripe (Checkout, Subscriptions, Webhooks, Invoicing) |
| Email          | Nodemailer (transactional email — password resets, notifications) |
| Validation     | Zod |
| Security       | bcrypt password hashing, signed webhook verification, CSRF-safe forms |

---

## 🏗️ How It's Structured

```
app/
  auth/            → login, register, forgot/reset password
  dashboard/       → account, payments, invoices, admin store views
  api/
    auth/          → registration & credential handling
    stripe/        → checkout sessions, subscriptions, webhooks
    superadmin/    → invoice & payment oversight endpoints
components/        → reusable UI (forms, buttons, alerts, admin views)
libs/              → auth config, Prisma client, Stripe client
prisma/            → database schema & seed data
utils/             → shared validation & helper logic
```

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (see below)
cp .env.example .env

# 3. Set up the database
npx prisma generate
npx prisma db push

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Required Environment Variables

```env
DATABASE_URL              # PostgreSQL connection string
NEXTAUTH_SECRET            # Auth session secret
NEXTAUTH_URL                # App base URL
STRIPE_SECRET_KEY          # Stripe secret API key
STRIPE_PUBLISHABLE_KEY     # Stripe publishable key
STRIPE_WEBHOOK_SECRET      # Stripe webhook signing secret
STRIPE_PRICE_ID            # Contribution/subscription price ID
SMTP_HOST / SMTP_PORT       # Email delivery
SMTP_USER / SMTP_PASSWORD
EMAIL_FROM                  # Sender address for transactional email
NEXT_PUBLIC_APP_URL         # Public-facing app URL
```

---

## 💬 About This Build

This project was developed as a demonstration of the architecture behind **anonymous, double-blind giving platforms** — the kind of system where trust, privacy, and payment reliability all have to work together without compromising each other. It reflects a production-oriented approach: typed end-to-end, validated at every boundary, and built on infrastructure (Stripe, Prisma, NextAuth) that's proven at scale.

If you're looking to build a similar platform — anonymous donations, gifting apps, matched giving, or any product where privacy-preserving peer-to-peer payments are the core requirement — this is representative of the approach and code quality I bring to that kind of build.
