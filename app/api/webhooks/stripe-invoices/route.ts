import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/libs/prisma/prisma.client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "invoice.finalized":
        await handleInvoiceFinalized(event.data.object as Stripe.Invoice);
        break;

      case "invoice.voided":
        await handleInvoiceVoided(event.data.object as Stripe.Invoice);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    console.log("Invoice paid:", invoice.id);

    // Update invoice status in database
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "paid",
        updatedAt: new Date(),
      },
    });

    console.log("Invoice marked as paid in database:", invoice.id);
  } catch (error) {
    console.error("Error handling invoice.paid:", error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log("Invoice payment failed:", invoice.id);

    // Update invoice status in database
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "payment_failed",
        updatedAt: new Date(),
      },
    });

    console.log("Invoice marked as payment_failed in database:", invoice.id);
  } catch (error) {
    console.error("Error handling invoice.payment_failed:", error);
  }
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  try {
    console.log("Invoice finalized:", invoice.id);

    // Update or create invoice in database
    await prisma.invoice.upsert({
      where: { id: invoice.id },
      update: {
        status: "open",
        updatedAt: new Date(),
      },
      create: {
        id: invoice.id,
        email: invoice.customer_email || "",
        amount: (invoice.amount_due || 0) / 100,
        note: invoice.description || null,
        status: "open",
        updatedAt: new Date(),
      },
    });

    console.log("Invoice finalized in database:", invoice.id);
  } catch (error) {
    console.error("Error handling invoice.finalized:", error);
  }
}

async function handleInvoiceVoided(invoice: Stripe.Invoice) {
  try {
    console.log("Invoice voided:", invoice.id);

    // Update invoice status in database
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "void",
        updatedAt: new Date(),
      },
    });

    console.log("Invoice marked as void in database:", invoice.id);
  } catch (error) {
    console.error("Error handling invoice.voided:", error);
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    console.log("Payment intent succeeded:", paymentIntent.id);

    // Find payment by stripe payment intent ID
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("Payment marked as succeeded in database:", payment.id);
    }
  } catch (error) {
    console.error("Error handling payment_intent.succeeded:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log("Payment intent failed:", paymentIntent.id);

    // Find payment by stripe payment intent ID
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason:
            paymentIntent.last_payment_error?.message || "Payment failed",
          updatedAt: new Date(),
        },
      });

      console.log("Payment marked as failed in database:", payment.id);
    }
  } catch (error) {
    console.error("Error handling payment_intent.payment_failed:", error);
  }
}
