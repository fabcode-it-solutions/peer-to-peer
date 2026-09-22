# Next.js Authentication & Stripe Payment Platform

A complete authentication and payment system built with Next.js App Router, NextAuth, Prisma, and Stripe.

## Features

### Authentication
- ✅ User Registration with validation
- ✅ Login with credentials
- ✅ Forgot Password flow
- ✅ Password Reset with secure tokens
- ✅ NextAuth session management
- ✅ Protected routes with middleware
- ✅ Shopify store URL validation

### Payment & Subscription
- ✅ Stripe Checkout integration
- ✅ Subscription management
- ✅ Cancel subscription (at period end)
- ✅ Reactivate canceled subscription
- ✅ Payment history
- ✅ Invoice viewing and download
- ✅ Webhook handling for automatic database updates

### Database
- ✅ PostgreSQL with Prisma ORM
- ✅ User, Shop, and License models
- ✅ Automatic license activation on payment
- ✅ Transaction-based operations

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Authentication:** NextAuth v4
- **Database:** PostgreSQL + Prisma
- **Payments:** Stripe
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Email:** Nodemailer
- **Password Hashing:** bcryptjs

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Stripe account
- SMTP server (for password reset emails)

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd nextjs-stripe-auth
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set up the database

Copy your `schema.prisma` file to the `prisma` folder, then run:

```bash
npx prisma generate
npx prisma db push
```

### 5. Set up Stripe Webhook

For local development, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret to your `.env` file.

For production, set up a webhook endpoint in the Stripe Dashboard:
- URL: `https://yourdomain.com/api/stripe/webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 6. Create a Stripe Product and Price

1. Go to Stripe Dashboard → Products
2. Create a new product
3. Add a recurring price
4. Copy the Price ID to `STRIPE_PRICE_ID` in `.env`

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nextjs-stripe-auth/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts    # NextAuth handler
│   │   │   ├── register/route.ts         # User registration
│   │   │   ├── forgot-password/route.ts  # Forgot password
│   │   │   └── reset-password/route.ts   # Reset password
│   │   └── stripe/
│   │       ├── create-checkout-session/route.ts  # Create Stripe session
│   │       ├── webhook/route.ts                  # Stripe webhook
│   │       ├── subscription/route.ts             # Get subscription
│   │       ├── cancel-subscription/route.ts      # Cancel subscription
│   │       └── reactivate-subscription/route.ts  # Reactivate
│   ├── auth/
│   │   ├── login/page.tsx              # Login page
│   │   ├── register/page.tsx           # Registration page
│   │   ├── forgot-password/page.tsx    # Forgot password page
│   │   └── reset-password/page.tsx     # Reset password page
│   ├── dashboard/page.tsx              # User dashboard
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Home page
│   └── globals.css                     # Global styles
├── components/
│   ├── ui/
│   │   ├── Input.tsx                   # Input component
│   │   ├── Button.tsx                  # Button component
│   │   └── Alert.tsx                   # Alert component
│   └── Providers.tsx                   # SessionProvider wrapper
├── lib/
│   ├── prisma.ts                       # Prisma client
│   ├── stripe.ts                       # Stripe client
│   ├── auth.ts                         # NextAuth configuration
│   ├── auth-utils.ts                   # Password hashing utilities
│   ├── email.ts                        # Email utilities
│   └── validations.ts                  # Zod validation schemas
├── types/
│   └── next-auth.d.ts                  # NextAuth type definitions
├── middleware.ts                       # Route protection
├── .env.example                        # Environment variables template
└── package.json                        # Dependencies
```

## API Routes

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/signin` - Sign in (handled by NextAuth)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Stripe

- `POST /api/stripe/create-checkout-session` - Create Stripe checkout
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `GET /api/stripe/subscription` - Get subscription details
- `POST /api/stripe/cancel-subscription` - Cancel subscription
- `POST /api/stripe/reactivate-subscription` - Reactivate subscription

## Validation Rules

### Registration
- **Name:** Minimum 2 characters
- **Email:** Valid email format
- **Password:** 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- **Domain:** Valid Shopify store URL (e.g., `store.myshopify.com`)

### Login
- **Email:** Valid email format
- **Password:** Required

## Webhook Events

The system handles the following Stripe events:

1. **checkout.session.completed** - Updates user with Stripe customer ID
2. **customer.subscription.created** - Activates license and shop
3. **customer.subscription.updated** - Updates license status
4. **customer.subscription.deleted** - Deactivates license and shop
5. **invoice.payment_succeeded** - Logs successful payment
6. **invoice.payment_failed** - Logs failed payment

## Database Schema

The system uses your existing Prisma schema with the following key models:

- **Users:** User authentication and profile
- **Shop:** Shopify store information
- **Licenses:** Subscription license status
- **Settings:** Shop configuration

## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Secure password reset tokens
- ✅ Token expiration (1 hour)
- ✅ Protected routes with middleware
- ✅ Stripe webhook signature verification
- ✅ Environment variable validation
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention (React)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

1. Build the project:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

## Email Configuration

### Gmail Setup

1. Enable 2-factor authentication
2. Generate an App Password
3. Use App Password in `SMTP_PASSWORD`

### Other SMTP Providers

Update the following in `.env`:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`

## Testing

### Test User Registration

1. Go to `/auth/register`
2. Fill in the form with valid data
3. Submit the form
4. Check database for new user

### Test Password Reset

1. Go to `/auth/forgot-password`
2. Enter email
3. Check email for reset link
4. Click link and reset password

### Test Subscription

1. Log in to dashboard
2. Click "Subscribe Now"
3. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
4. Verify license activation in database

### Test Webhook

Use Stripe CLI to trigger events:

```bash
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## Troubleshooting

### Database Connection Error

- Check `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run `npx prisma generate`

### Stripe Webhook Not Working

- Check `STRIPE_WEBHOOK_SECRET` is set
- Verify webhook endpoint is accessible
- Check Stripe CLI is running (for local dev)

### Email Not Sending

- Verify SMTP credentials
- Check firewall settings
- Enable "Less secure app access" (Gmail)

### NextAuth Session Issues

- Clear browser cookies
- Regenerate `NEXTAUTH_SECRET`
- Check `NEXTAUTH_URL` matches your domain

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
