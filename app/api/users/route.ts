import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma/prisma.client";
import { User } from "lucide-react";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = url.searchParams.get("page");
    const limit = url.searchParams.get("limit");
    const search = url.searchParams.get("search");
    const users = await prisma.shop.findMany({
      where: {
        OR: [
          { domain: { contains: search || "", mode: "insensitive" } },
          { email: { contains: search || "", mode: "insensitive" } },
          { name: { contains: search || "", mode: "insensitive" } },
        ],
      },
      include: {
        Users: true,
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    const storesCount = await prisma.shop.count();
    const stores = users.map((store) => ({
      id: store.id,
      domain: store.domain,
      name: store?.Users?.name,
      email: store?.Users?.email,
      isExpired: store.isExpired,
    }));
    const totalPages = Math.ceil(storesCount / Number(limit));
    return NextResponse.json(
      {
        stores,
        storesCount,
        currentPage: Number(page),
        limit: Number(limit),
        totalPages,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();
    const store = await prisma.shop.findUnique({
      where: { id },
    });
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    const updatedStore = await prisma.shop.update({
      where: { id },
      data: { isExpired: !store.isExpired },
    });
    return NextResponse.json(updatedStore, { status: 200 });
  } catch (error: any) {
    console.error("Toggle store error:", error);
    return NextResponse.json(
      { error: "Failed to toggle store status" },
      { status: 500 }
    );
  }
}
