# Complete Setup & Workflow Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Stripe Configuration](#stripe-configuration)
4. [Email Configuration](#email-configuration)
5. [Database Setup](#database-setup)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] PostgreSQL database (local or cloud)
- [ ] Stripe account (free test account)
- [ ] SMTP server access (Gmail, SendGrid, etc.)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14 (App Router)
- NextAuth for authentication
- Prisma ORM
- Stripe SDK
- Zod for validation
- bcryptjs for password hashing
- Nodemailer for emails
- Tailwind CSS for styling

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

## Stripe Configuration

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for a free account
3. Navigate to the Dashboard

### Step 2: Get API Keys

1. In Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

### Step 3: Create a Product & Price

1. Go to **Products** → **Add Product**
2. Fill in:
   - **Name:** "Monthly Subscription" (or your plan name)
   - **Description:** Optional
3. Click **Add pricing**
4. Select:
   - **Pricing model:** Standard pricing
   - **Price:** Enter amount (e.g., $29.99)
   - **Billing period:** Recurring → Monthly
5. Click **Save product**
6. Copy the **Price ID** (starts with `price_`)
7. Add to `.env`:
   ```env
   STRIPE_PRICE_ID="price_..."
   ```

### Step 4: Set Up Webhooks

#### For Local Development:

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   scoop install stripe
   
   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`)
5. Add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

#### For Production:

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret**
7. Add to production `.env`

### Step 5: Test Cards

Use these test cards in development:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires authentication |

- Use any future expiry date
- Use any 3-digit CVC
- Use any ZIP code

## Email Configuration

### Option 1: Gmail

1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Other (Custom name)"
4. Generate password
5. Add to `.env`:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-app-password"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

### Option 2: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Configure `.env`:
   ```env
   SMTP_HOST="smtp.sendgrid.net"
   SMTP_PORT="587"
   SMTP_USER="apikey"
   SMTP_PASSWORD="your-sendgrid-api-key"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

### Option 3: Amazon SES

1. Sign up for AWS and enable SES
2. Verify your domain or email
3. Get SMTP credentials
4. Configure `.env`:
   ```env
   SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
   SMTP_PORT="587"
   SMTP_USER="your-smtp-username"
   SMTP_PASSWORD="your-smtp-password"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

## Database Setup

### Step 1: Create Database

#### Local PostgreSQL:
```bash
createdb your-database-name
```

#### Or use a cloud provider:
- [Supabase](https://supabase.com) (Free tier available)
- [Railway](https://railway.app) (Free tier available)
- [Neon](https://neon.tech) (Free tier available)

### Step 2: Configure Database URL

Add to `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

For cloud providers, copy the connection string they provide.

### Step 3: Copy Schema

Copy your `schema.prisma` file to the `prisma` folder:
```bash
cp /path/to/your/schema.prisma ./prisma/schema.prisma
```

### Step 4: Generate Prisma Client & Push Schema

```bash
npx prisma generate
npx prisma db push
```

This will:
- Generate the Prisma Client
- Create all tables in your database
- Set up relationships

### Step 5: Verify Database

```bash
npx prisma studio
```

This opens a browser interface to view your database.

## NextAuth Configuration

### Generate Secret Key

```bash
openssl rand -base64 32
```

Add to `.env`:
```env
NEXTAUTH_SECRET="generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

For production, update `NEXTAUTH_URL` to your domain.

## Testing

### 1. Start Development Server

```bash
npm run dev
```

Keep the Stripe CLI running in another terminal:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 2. Test User Registration

1. Go to `http://localhost:3000/auth/register`
2. Fill in the form:
   - **Name:** Test User
   - **Email:** test@example.com
   - **Password:** Test1234
   - **Store URL:** test-store.myshopify.com
3. Click "Create Account"
4. Check your database - new user should be created
5. Verify in Prisma Studio:
   ```bash
   npx prisma studio
   ```

### 3. Test Login

1. Go to `http://localhost:3000/auth/login`
2. Enter credentials
3. Should redirect to dashboard

### 4. Test Password Reset

1. Go to `http://localhost:3000/auth/forgot-password`
2. Enter your email
3. Check email for reset link
4. Click link and set new password
5. Try logging in with new password

### 5. Test Subscription

1. Log in to dashboard
2. Click "Subscribe Now"
3. You'll be redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Check Stripe CLI output - you should see webhook events
7. Check database - license should be activated
8. Refresh dashboard - subscription should be active

### 6. Test Subscription Cancellation

1. In dashboard, click "Cancel Subscription"
2. Confirm cancellation
3. Subscription should show as "will cancel at period end"
4. Test reactivation by clicking "Reactivate Subscription"

### 7. Test Invoice History

1. In dashboard, scroll to "Payment History"
2. You should see your test payment
3. Click "Download PDF" to view invoice

## Webhook Event Flow

When a payment is completed:

1. **User subscribes** → Stripe Checkout
2. **Payment succeeds** → `checkout.session.completed` event
3. **Webhook receives event** → Updates user's Stripe customer ID
4. **Subscription created** → `customer.subscription.created` event
5. **Webhook receives event** → Activates license and shop
6. **Database updated** → User can access features

## Production Deployment

### 1. Prepare for Production

Update `.env` for production:

```env
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
# Use production Stripe keys
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
# Use production webhook secret
STRIPE_WEBHOOK_SECRET="whsec_..."
# Use production database
DATABASE_URL="postgresql://..."
```

### 2. Deploy to Vercel (Recommended)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add all environment variables from `.env`
6. Click "Deploy"

### 3. Set Up Production Webhook

1. Copy your Vercel deployment URL
2. In Stripe Dashboard, add webhook endpoint:
   - URL: `https://your-vercel-url.vercel.app/api/stripe/webhook`
   - Events: (same as development)
3. Copy signing secret to Vercel environment variables
4. Redeploy in Vercel

### 4. Test Production

1. Create a new account in production
2. Subscribe with real card (or test card in test mode)
3. Verify webhook events in Stripe Dashboard
4. Check database for updates

## Common Issues & Solutions

### Issue: Database Connection Error

**Solution:**
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Verify credentials
- Check firewall rules

### Issue: Webhook Not Working

**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Stripe CLI is running (development)
- Ensure endpoint is publicly accessible (production)
- Check webhook logs in Stripe Dashboard

### Issue: Email Not Sending

**Solution:**
- Verify SMTP credentials
- Check if port 587 is open
- Enable "Less secure app access" (Gmail)
- Check spam folder

### Issue: NextAuth Session Not Persisting

**Solution:**
- Clear browser cookies
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Restart development server

### Issue: Stripe Checkout Redirects to 404

**Solution:**
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check success/cancel URLs in checkout session creation
- Ensure routes exist

## Security Checklist

Before deploying to production:

- [ ] All environment variables are set
- [ ] `NEXTAUTH_SECRET` is strong and random
- [ ] Database uses SSL in production
- [ ] Stripe webhook secret is configured
- [ ] Email credentials are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled (optional but recommended)
- [ ] Error messages don't expose sensitive info
- [ ] All API routes validate input
- [ ] Protected routes use middleware

## Monitoring

### Log Important Events

The system logs:
- User registrations
- Login attempts
- Password resets
- Subscription activations
- Payment failures
- Webhook events

Check logs in:
- Vercel Dashboard (production)
- Terminal (development)
- Database (analytics table)

### Monitor Stripe Dashboard

Regularly check:
- Failed payments
- Disputed charges
- Webhook delivery failures
- Customer subscriptions

## Support & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth Documentation](https://next-auth.js.org)
- [Stripe Documentation](https://stripe.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Next Steps

After setup is complete:

1. Customize email templates in `lib/email.ts`
2. Add more subscription plans
3. Implement usage tracking
4. Add admin dashboard
5. Set up analytics
6. Implement customer portal
7. Add billing address collection
8. Configure tax collection
9. Set up subscription trials
10. Implement proration for plan changes

---

**Need help?** Open an issue on GitHub or consult the documentation links above.
