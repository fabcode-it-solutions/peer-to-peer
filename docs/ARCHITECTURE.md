# System Architecture

## Overview

This is a full-stack Next.js application with authentication and payment processing capabilities.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Login     │  │   Register   │  │   Dashboard  │          │
│  │    Page      │  │     Page     │  │     Page     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS APP ROUTER                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     API ROUTES                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   NextAuth  │  │  Register   │  │   Stripe    │    │   │
│  │  │   Handler   │  │     API     │  │   Webhook   │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Forgot    │  │    Reset    │  │ Subscription│    │   │
│  │  │  Password   │  │  Password   │  │    APIs     │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │                                          │
          ▼                                          ▼
┌──────────────────────┐                  ┌──────────────────────┐
│   PRISMA ORM         │                  │   EXTERNAL SERVICES  │
│                      │                  │                      │
│  ┌────────────────┐  │                  │  ┌────────────────┐ │
│  │   PostgreSQL   │  │                  │  │     Stripe     │ │
│  │   Database     │  │                  │  │  (Payments)    │ │
│  │                │  │                  │  └────────────────┘ │
│  │  • Users       │  │                  │  ┌────────────────┐ │
│  │  • Shop        │  │                  │  │  SMTP Server   │ │
│  │  • Licenses    │  │                  │  │   (Emails)     │ │
│  │  • Settings    │  │                  │  └────────────────┘ │
│  │  • ... more    │  │                  │                      │
│  └────────────────┘  │                  └──────────────────────┘
└──────────────────────┘
```

## Data Flow

### 1. User Registration Flow

```
User → Register Form → Validation (Zod)
                            │
                            ▼
                    /api/auth/register
                            │
                            ├─ Check existing user (Prisma)
                            ├─ Hash password (bcryptjs)
                            ├─ Create Stripe customer
                            │
                            ▼
                    Transaction (Prisma)
                            │
                            ├─ Create Shop
                            ├─ Create User
                            ├─ Create License (inactive)
                            └─ Create Settings
                            │
                            ▼
                    Success Response → Redirect to Login
```

### 2. Login Flow

```
User → Login Form → /api/auth/signin (NextAuth)
                            │
                            ├─ Find user by email (Prisma)
                            ├─ Verify password (bcryptjs)
                            ├─ Check shop is active
                            │
                            ▼
                    Create JWT Session
                            │
                            ▼
                    Redirect to Dashboard
```

### 3. Password Reset Flow

```
User → Forgot Password Form → /api/auth/forgot-password
                                        │
                                        ├─ Find user by email
                                        ├─ Generate reset token
                                        ├─ Save token + expiry to DB
                                        │
                                        ▼
                                Send Email (Nodemailer)
                                        │
                                        ▼
User Clicks Link → Reset Password Form → /api/auth/reset-password
                                                │
                                                ├─ Verify token is valid
                                                ├─ Hash new password
                                                ├─ Update user
                                                └─ Clear token
                                                │
                                                ▼
                                        Success → Redirect to Login
```

### 4. Subscription Flow

```
User → Dashboard → "Subscribe Now" → /api/stripe/create-checkout-session
                                                │
                                                ├─ Verify user authenticated
                                                ├─ Check no active subscription
                                                │
                                                ▼
                                    Create Stripe Checkout Session
                                                │
                                                ▼
                            Redirect to Stripe Checkout Page
                                                │
User Completes Payment ─────────────────────────┤
                                                │
                                                ▼
                                        Stripe Webhook
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        │                                                │
                        ▼                                                ▼
            checkout.session.completed              customer.subscription.created
                        │                                                │
                Update user.stripeId                        Activate License & Shop
                        │                                                │
                        └────────────────┬───────────────────────────────┘
                                         │
                                         ▼
                            User has Active Subscription
```

### 5. Cancel Subscription Flow

```
User → Dashboard → "Cancel Subscription" → /api/stripe/cancel-subscription
                                                    │
                                                    ├─ Find active subscription
                                                    │
                                                    ▼
                                        stripe.subscriptions.update()
                                        (set cancel_at_period_end = true)
                                                    │
                                                    ▼
                                        Webhook: subscription.deleted
                                        (at end of billing period)
                                                    │
                                                    ▼
                                        Deactivate License & Shop
```

## Component Structure

### Authentication Components

```
app/auth/
├── login/page.tsx
│   └── Uses: Input, Button, Alert
│   └── Calls: signIn() from next-auth
│
├── register/page.tsx
│   └── Uses: Input, Button, Alert
│   └── Calls: /api/auth/register
│
├── forgot-password/page.tsx
│   └── Uses: Input, Button, Alert
│   └── Calls: /api/auth/forgot-password
│
└── reset-password/page.tsx
    └── Uses: Input, Button, Alert
    └── Calls: /api/auth/reset-password
```

### Dashboard Components

```
app/dashboard/page.tsx
├── User Info Section
│   └── Displays: name, email, domain, license status
│
├── Subscription Section
│   ├── If no subscription: "Subscribe Now" button
│   └── If has subscription:
│       ├── Status, period dates
│       ├── "Cancel" or "Reactivate" button
│       └── Cancellation warning
│
└── Payment History Section
    └── Table of invoices with download links
```

## API Endpoints

### Authentication APIs

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler | No |
| `/api/auth/register` | POST | Create new user | No |
| `/api/auth/forgot-password` | POST | Request password reset | No |
| `/api/auth/reset-password` | POST | Reset password | No |

### Stripe APIs

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/stripe/create-checkout-session` | POST | Create payment session | Yes |
| `/api/stripe/webhook` | POST | Handle Stripe events | No* |
| `/api/stripe/subscription` | GET | Get subscription details | Yes |
| `/api/stripe/cancel-subscription` | POST | Cancel subscription | Yes |
| `/api/stripe/reactivate-subscription` | POST | Reactivate subscription | Yes |

*Webhook uses signature verification instead of session auth

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│  1. Input Validation (Zod)                                  │
│     └─ Validates all user inputs before processing          │
├─────────────────────────────────────────────────────────────┤
│  2. Authentication (NextAuth)                               │
│     └─ JWT-based session management                         │
├─────────────────────────────────────────────────────────────┤
│  3. Route Protection (Middleware)                           │
│     └─ Protects /dashboard routes                           │
├─────────────────────────────────────────────────────────────┤
│  4. Password Security (bcryptjs)                            │
│     └─ 12 rounds of salting                                 │
├─────────────────────────────────────────────────────────────┤
│  5. Database Security (Prisma)                              │
│     └─ Parameterized queries, SQL injection prevention      │
├─────────────────────────────────────────────────────────────┤
│  6. Webhook Verification (Stripe)                           │
│     └─ Signature verification on all webhooks               │
├─────────────────────────────────────────────────────────────┤
│  7. Token Expiration                                        │
│     └─ Password reset tokens expire in 1 hour               │
├─────────────────────────────────────────────────────────────┤
│  8. HTTPS Only (Production)                                 │
│     └─ All communications encrypted                         │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌──────────────┐
│    Shop      │
│              │
│  • domain    │──────┐
│  • name      │      │
│  • isActive  │      │
└──────────────┘      │
        │             │
        │ 1:1         │ 1:1
        │             │
┌───────▼──────┐      │
│    Users     │      │
│              │      │
│  • email     │      │
│  • password  │      │
│  • stripeId  │      │
│  • domain    │      │
└──────────────┘      │
        │             │
        │ 1:1         │
        │             │
┌───────▼──────┐      │
│   Licenses   │◄─────┘
│              │
│  • isActive  │
│  • domain    │
└──────────────┘

┌──────────────┐
│   Settings   │
│              │
│  • shopId    │
│  • theme...  │
└──────────────┘
        │
        │ 1:1
        │
        └──────► Shop
```

## Webhook Event Handling

```
Stripe Event → /api/stripe/webhook
                    │
                    ├─ Verify signature
                    │
                    ▼
            Parse event type
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
checkout.     subscription.   invoice.
completed      created         payment_
    │               │          succeeded
    │               │               │
    ▼               ▼               ▼
Update         Activate        Log
stripeId       License        Payment
```

## File Organization

```
Root
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Auth endpoints
│   │   └── stripe/       # Payment endpoints
│   ├── auth/             # Auth pages
│   ├── dashboard/        # Dashboard page
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/              # UI components
│   └── Providers.tsx    # Context providers
├── lib/                 # Utilities & config
│   ├── prisma.ts       # DB client
│   ├── stripe.ts       # Stripe client
│   ├── auth.ts         # NextAuth config
│   ├── validations.ts  # Zod schemas
│   ├── auth-utils.ts   # Password utils
│   └── email.ts        # Email sender
├── types/              # TypeScript types
├── prisma/             # Database schema
├── middleware.ts       # Route protection
└── .env               # Configuration
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Next.js 14 App Router |
| **Styling** | Tailwind CSS |
| **Authentication** | NextAuth v4 |
| **Database** | PostgreSQL + Prisma ORM |
| **Payments** | Stripe |
| **Validation** | Zod |
| **Email** | Nodemailer |
| **Security** | bcryptjs |
| **TypeScript** | Full type safety |

## Performance Optimizations

1. **Server Components** - Most components are server-rendered
2. **Database Indexing** - Key fields indexed for fast queries
3. **Prisma Connection Pooling** - Efficient database connections
4. **JWT Sessions** - Stateless authentication
5. **Webhook Queue** - Async event processing

## Scalability Considerations

- **Database**: PostgreSQL can handle millions of users
- **Sessions**: JWT-based, no server-side session storage needed
- **Webhooks**: Can be queued for high-volume processing
- **Static Generation**: Next.js can generate static pages where applicable
- **Edge Deployment**: Can be deployed to edge networks (Vercel)

---

This architecture provides a solid foundation for a production-ready authentication and payment platform.
