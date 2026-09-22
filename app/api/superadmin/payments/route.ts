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
        { success: false, message: "Only superAdmin can access all payments" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const shopId = searchParams.get("shopId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const searchQuery = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build filter object
    const where: any = {};

    if (shopId) {
      where.shopId = shopId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Search across multiple fields
    if (searchQuery) {
      where.OR = [
        {
          stripePaymentIntentId: { contains: searchQuery, mode: "insensitive" },
        },
        { stripeChargeId: { contains: searchQuery, mode: "insensitive" } },
        { stripeInvoiceId: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { cardLast4: { contains: searchQuery } },
        { bankLast4: { contains: searchQuery } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch payments with pagination
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          shop: {
            select: {
              id: true,
              domain: true,
              name: true,
              email: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              domain: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    // Calculate aggregated stats
    const stats = await prisma.payment.aggregate({
      where,
      _sum: {
        amount: true,
        refundAmount: true,
      },
      _count: true,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      payments,
      stats: {
        totalAmount: stats._sum.amount || 0,
        totalRefunded: stats._sum.refundAmount || 0,
        totalPayments: stats._count,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
