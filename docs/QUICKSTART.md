# 🚀 Quick Start Guide

Get your authentication and payment platform running in 5 minutes!

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] PostgreSQL running
- [ ] Stripe account created
- [ ] Email SMTP credentials ready

## Setup Steps

### 1️⃣ Install Dependencies (2 min)
```bash
npm install
```

### 2️⃣ Configure Environment (1 min)
```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Run `openssl rand -base64 32` to generate
- `STRIPE_SECRET_KEY` - From Stripe Dashboard → API Keys
- `STRIPE_PRICE_ID` - Create a product in Stripe first
- SMTP credentials for password reset emails

### 3️⃣ Setup Database (1 min)
```bash
npx prisma generate
npx prisma db push
```

### 4️⃣ Start Development (1 min)

Terminal 1 - Start Next.js:
```bash
npm run dev
```

Terminal 2 - Start Stripe webhook listener:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

## 🎯 Test the System

### Test Registration
1. Go to http://localhost:3000/auth/register
2. Create an account with:
   - Valid email
   - Strong password (8+ chars, uppercase, lowercase, number)
   - Shopify store URL (format: `store.myshopify.com`)

### Test Login
1. Go to http://localhost:3000/auth/login
2. Sign in with your credentials

### Test Subscription
1. In dashboard, click "Subscribe Now"
2. Use test card: `4242 4242 4242 4242`
3. Watch Stripe CLI for webhook events
4. Refresh dashboard to see active subscription

### Test Password Reset
1. Go to http://localhost:3000/auth/forgot-password
2. Enter your email
3. Check your email inbox
4. Click reset link and set new password

## 🎨 Project Structure Overview

```
app/
├── api/
│   ├── auth/          # Authentication endpoints
│   │   ├── register
│   │   ├── forgot-password
│   │   └── reset-password
│   └── stripe/        # Payment endpoints
│       ├── create-checkout-session
│       ├── webhook
│       ├── subscription
│       ├── cancel-subscription
│       └── reactivate-subscription
├── auth/              # Auth pages
│   ├── login
│   ├── register
│   ├── forgot-password
│   └── reset-password
└── dashboard/         # Protected user dashboard

lib/
├── prisma.ts          # Database client
├── stripe.ts          # Stripe client
├── auth.ts            # NextAuth config
├── validations.ts     # Zod schemas
├── auth-utils.ts      # Password utilities
└── email.ts           # Email sender

components/
└── ui/                # Reusable UI components
```

## 🔐 Key Features

### Authentication
✅ Register with email/password  
✅ Login with NextAuth  
✅ Forgot password flow  
✅ Reset password with secure tokens  
✅ Protected routes  
✅ Shopify URL validation  

### Payments
✅ Stripe Checkout integration  
✅ Subscription management  
✅ Cancel/Reactivate subscriptions  
✅ Payment history  
✅ Invoice downloads  
✅ Automatic license activation  

### Security
✅ Password hashing (bcrypt)  
✅ CSRF protection  
✅ Webhook signature verification  
✅ Input validation (Zod)  
✅ SQL injection prevention (Prisma)  
✅ Token expiration  

## 📝 Important Files

- **`.env`** - All configuration
- **`lib/auth.ts`** - NextAuth setup
- **`lib/validations.ts`** - Form validation rules
- **`app/api/stripe/webhook/route.ts`** - Webhook handler
- **`SETUP_GUIDE.md`** - Detailed setup instructions
- **`README.md`** - Complete documentation

## 🐛 Common Issues

**Database connection failed?**
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running

**Stripe webhook not working?**
- Is Stripe CLI running?
- Check webhook secret is correct

**Email not sending?**
- Verify SMTP credentials
- Check port 587 is open

**Can't log in?**
- Clear browser cookies
- Check password meets requirements

## 📚 Next Steps

1. Read `SETUP_GUIDE.md` for detailed instructions
2. Customize email templates in `lib/email.ts`
3. Add your branding/styling
4. Set up production deployment
5. Configure production Stripe webhooks

## 🚢 Deploy to Production

### Quick Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy
5. Configure production Stripe webhook

See `SETUP_GUIDE.md` for detailed deployment steps.

## 📞 Need Help?

- Check `README.md` for full documentation
- Review `SETUP_GUIDE.md` for troubleshooting
- Open an issue on GitHub

---

**Ready to build something amazing!** 🎉
