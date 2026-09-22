import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth/auth";
import { prisma } from "@/libs/prisma/prisma.client";

export async function GET(req: NextRequest) {
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
        { success: false, message: "Only superAdmin can access store details" },
        { status: 403 }
      );
    }
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];
    const shopId = id;

    // Fetch shop with all related data
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        Users: {
          select: {
            id: true,
            name: true,
            email: true,
            domain: true,
            stripeId: true,
            createdAt: true,
            updatedAt: true,
            role: true,
          },
        },
        licenses: true,
        settings: true,
        bankAccounts: {
          where: { isActive: true },
          select: {
            id: true,
            bankName: true,
            accountType: true,
            isPrimary: true,
            isVerified: true,
            createdAt: true,
          },
        },
        cards: {
          where: { isActive: true },
          select: {
            id: true,
            cardType: true,
            brand: true,
            last4: true,
            expiryMonth: true,
            expiryYear: true,
            cardholderName: true,
            isPrimary: true,
            isExpired: true,
            createdAt: true,
          },
        },
        notificationSettings: true,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: "Shop not found" },
        { status: 404 }
      );
    }

    // Fetch invoices for this shop
    const invoices = await prisma.invoice.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      take: 10, // Latest 10 invoices
    });

    // Fetch payments for this shop
    const payments = await prisma.payment.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      take: 10, // Latest 10 payments
    });

    // Calculate payment stats
    const paymentStats = await prisma.payment.aggregate({
      where: { shopId },
      _sum: {
        amount: true,
        refundAmount: true,
      },
      _count: true,
    });

    // Fetch Checkout Plus rules
    const checkoutPlusRules = await prisma.checkoutPlusRule.findMany({
      where: { shopId },
      include: {
        rules: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch Checkout Plus Analytics
    const analyticsWhere = {
      shopId,
      featureType: "CHECKOUT_PLUS" as any,
    };

    const analytics = await prisma.analytics.groupBy({
      by: ["eventType"],
      where: analyticsWhere,
      _count: { id: true },
      _sum: { revenue: true },
    });

    const impressions =
      analytics.find((a) => a.eventType === "IMPRESSION")?._count.id || 0;
    const clicks =
      analytics.find((a) => a.eventType === "CLICK")?._count.id || 0;
    const addToCart =
      analytics.find((a) => a.eventType === "ADD_TO_CART")?._count.id || 0;
    const conversions =
      analytics.find((a) => a.eventType === "CONVERSION")?._count.id || 0;
    const revenue =
      analytics.find((a) => a.eventType === "CONVERSION")?._sum.revenue || 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const avgOrderValue = conversions > 0 ? revenue / conversions : 0;

    // Fetch all analytics by feature type for overview
    const allAnalytics = await prisma.analytics.groupBy({
      by: ["featureType", "eventType"],
      where: { shopId },
      _count: { id: true },
      _sum: { revenue: true },
    });

    // Group analytics by feature
    const analyticsByFeature: any = {};
    allAnalytics.forEach((item) => {
      const feature = item.featureType;
      if (!analyticsByFeature[feature]) {
        analyticsByFeature[feature] = {
          impressions: 0,
          clicks: 0,
          addToCart: 0,
          conversions: 0,
          revenue: 0,
        };
      }

      switch (item.eventType) {
        case "IMPRESSION":
          analyticsByFeature[feature].impressions = item._count.id;
          break;
        case "CLICK":
          analyticsByFeature[feature].clicks = item._count.id;
          break;
        case "ADD_TO_CART":
          analyticsByFeature[feature].addToCart = item._count.id;
          break;
        case "CONVERSION":
          analyticsByFeature[feature].conversions = item._count.id;
          analyticsByFeature[feature].revenue = item._sum.revenue || 0;
          break;
      }
    });

    return NextResponse.json({
      success: true,
      shop,
      invoices,
      payments,
      paymentStats: {
        totalAmount: paymentStats._sum.amount || 0,
        totalRefunded: paymentStats._sum.refundAmount || 0,
        totalPayments: paymentStats._count,
      },
      checkoutPlusRules,
      checkoutPlusStats: {
        impressions,
        clicks,
        addToCart,
        conversions,
        revenue,
        ctr: parseFloat(ctr.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      },
      analyticsByFeature,
    });
  } catch (error) {
    console.error("Fetch store details error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
