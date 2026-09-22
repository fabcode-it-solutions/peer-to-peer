import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth/auth";
import { prisma } from "@/libs/prisma/prisma.client";
import { stripe } from "@/libs/stripe/stripe";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("user");
    const app = url.searchParams.get("app");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!userId && app == "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session?.user && app != "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.users.findUnique({
      where: { id: userId || session?.user?.id },
      include: {
        licenses: true,
      },
    });

    if (!user || !user.stripeId) {
      return NextResponse.json(
        { subscription: null, hasSubscription: false },
        { status: 200 },
      );
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeId,
      limit: 10,
      expand: ["data.default_payment_method"],
    });

    const activeSubscription = subscriptions.data.find(
      (sub) => sub.status === "active" || sub.status === "trialing",
    );

    if (!activeSubscription) {
      return NextResponse.json(
        { subscription: null, hasSubscription: false },
        { status: 200 },
      );
    }
    await prisma.licenses.update({
      where: { userId: user.id },
      data: {
        isActive: true,
      },
    });
    // Get invoice history
    const invoices = await stripe.invoices.list({
      customer: user.stripeId,
      limit: 10,
    });

    return NextResponse.json(
      {
        hasSubscription: true,
        subscription: {
          id: activeSubscription.id,
          status: activeSubscription.status,
          currentPeriodStart: new Date(activeSubscription.ended_at! * 1000),
          currentPeriodEnd: new Date(activeSubscription.ended_at! * 1000),
          cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
          cancelAt: activeSubscription.cancel_at
            ? new Date(activeSubscription.cancel_at * 1000)
            : null,
        },
        invoices: invoices.data.map((invoice) => ({
          id: invoice.id,
          amount: invoice.amount_paid / 100, // Convert from cents
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          paidAt: invoice.status_transitions.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : null,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
        })),
        license: {
          isActive: user.licenses?.isActive || false,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get subscription details" },
      { status: 500 },
    );
  }
}
