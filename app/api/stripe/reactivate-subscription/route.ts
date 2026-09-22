import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth/auth";
import { prisma } from "@/libs/prisma/prisma.client";
import { stripe } from "@/libs/stripe/stripe";
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.stripeId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Get subscriptions set to cancel
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeId,
      status: "active",
      limit: 10,
    });

    const subscriptionToReactivate = subscriptions.data.find(
      (sub) => sub.cancel_at_period_end === true
    );

    if (!subscriptionToReactivate) {
      return NextResponse.json(
        { error: "No subscription scheduled for cancellation found" },
        { status: 404 }
      );
    }

    // Reactivate subscription
    const reactivatedSubscription = await stripe.subscriptions.update(
      subscriptionToReactivate.id,
      {
        cancel_at_period_end: false,
      }
    );

    return NextResponse.json(
      {
        message: "Subscription reactivated successfully",
        subscription: {
          id: reactivatedSubscription.id,
          status: reactivatedSubscription.status,
          currentPeriodEnd: new Date(reactivatedSubscription.ended_at! * 1000),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Reactivate subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
