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
        { success: false, message: "Only superAdmin can search stores" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build search filter
    const where: any = {};

    if (query) {
      where.OR = [
        { domain: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { id: { contains: query, mode: "insensitive" } },
      ];
    }

    // Fetch stores
    const stores = await prisma.shop.findMany({
      where,
      select: {
        id: true,
        domain: true,
        name: true,
        email: true,
        isActive: true,
        Users: {
          select: {
            id: true,
            name: true,
            email: true,
            stripeId: true,
          },
        },
      },
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      stores,
    });
  } catch (error) {
    console.error("Search stores error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
