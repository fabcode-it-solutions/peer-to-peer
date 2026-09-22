import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth/auth";
import { prisma } from "@/libs/prisma/prisma.client";
import Stripe from "stripe";
import { sendInvoiceEmail } from "@/actions/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is superAdmin
    if (session.user.role !== "superAdmin") {
      return NextResponse.json(
        { success: false, message: "Only superAdmin can create invoices" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { shopId, email, amount, description, dueDate } = body;

    // Validate required fields
    if (!email || !amount) {
      return NextResponse.json(
        { success: false, message: "Email and amount are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.users.findFirst({
      where: { email },
      include: { shop: true },
    });

    let stripeCustomerId = user?.stripeId;

    // If user doesn't have a Stripe customer ID, create one
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: email,
        name: user?.name || undefined,
        metadata: {
          userId: user?.id || "unknown",
          domain: user?.domain || "unknown",
        },
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      if (user) {
        await prisma.users.update({
          where: { id: user.id },
          data: { stripeId: stripeCustomerId },
        });
      }
    }

    // Create Stripe invoice
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: "send_invoice",
      days_until_due: dueDate
        ? Math.ceil(
            (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : 30,
      description: description || "Invoice from your subscription service",
      metadata: {
        shopId: shopId || "N/A",
        userId: user?.id || "N/A",
        createdBy: session.user.email || "admin",
      },
    });

    // Add invoice item
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      description: description || "Service charge",
      invoice: invoice.id,
    });

    // Finalize and send the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Send invoice email
    await stripe.invoices.sendInvoice(finalizedInvoice.id);

    // Save invoice to database
    const dbInvoice = await prisma.invoice.create({
      data: {
        id: finalizedInvoice.id,
        shopId: shopId || null,
        userId: user?.id || null,
        email: email,
        amount: amount,
        note: description || null,
        status: "pending",
        updatedAt: new Date(),
        hosted_invoice_url: finalizedInvoice.hosted_invoice_url,
      },
    });
    await sendInvoiceEmail({
      amount: amount,
      invoiceId: finalizedInvoice.id,
      invoiceUrl: finalizedInvoice.hosted_invoice_url || "",
      note: description || null,
      storeName: user?.shop?.name || user?.shop?.domain || "",
      to: email,
    });
    return NextResponse.json({
      success: true,
      message: "Stripe invoice created and sent successfully",
      invoice: dbInvoice,
      stripeInvoice: {
        id: finalizedInvoice.id,
        hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
        invoicePdf: finalizedInvoice.invoice_pdf,
        status: finalizedInvoice.status,
      },
    });
  } catch (error: any) {
    console.error("Create Stripe invoice error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create Stripe invoice",
      },
      { status: 500 }
    );
  }
}
