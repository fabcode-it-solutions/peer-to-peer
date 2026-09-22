import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/libs/prisma/prisma.client";
import { stripe } from "@/libs/stripe/stripe";
import Stripe from "stripe";

// Disable body parsing for webhook
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Handle checkout session completed
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const shopId = session.metadata?.shopId;

  if (!userId || !shopId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // Update user with Stripe customer ID
  if (session.customer) {
    await prisma.users.update({
      where: { id: userId },
      data: {
        stripeId: session.customer as string,
      },
    });
  }

  console.log(`Checkout completed for user ${userId}`);
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const user = await prisma.users.findFirst({
    where: { stripeId: customerId },
    include: { licenses: true, shop: true },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Activate license and shop
  await prisma.$transaction([
    prisma.licenses.update({
      where: { userId: user.id },
      data: { isActive: true },
    }),
  ]);

  console.log(`Subscription activated for user ${user.id}`);
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.users.findFirst({
    where: { stripeId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  const isActive = subscription.status === "active";

  // Update license and shop status
  await prisma.$transaction([
    prisma.licenses.update({
      where: { userId: user.id },
      data: { isActive },
    }),
  ]);

  console.log(
    `Subscription updated for user ${user.id}, status: ${subscription.status}`
  );
}

// Handle subscription deleted/canceled
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.users.findFirst({
    where: { stripeId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Deactivate license and shop
  await prisma.$transaction([
    prisma.licenses.update({
      where: { userId: user.id },
      data: { isActive: false },
    }),
  ]);

  console.log(`Subscription canceled for user ${user.id}`);
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.users.findFirst({
    where: { stripeId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }
  await prisma.$transaction([
    prisma.licenses.update({
      where: { userId: user.id },
      data: { isActive: true },
    }),
  ]);
  console.log(`Invoice payment succeeded for user ${user.id}`);
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.users.findFirst({
    where: { stripeId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  console.log(`Invoice payment failed for user ${user.id}`);
  // You might want to send an email notification here
}
