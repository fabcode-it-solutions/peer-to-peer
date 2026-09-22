import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma/prisma.client";
import { registerSchema } from "@/utils/validations";
import { hashPassword } from "@/utils/auth-utils";
import { stripe } from "@/libs/stripe/stripe";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);
    const { name, email, password, domain } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ email: email }, { domain: domain }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 400 },
        );
      }
      if (existingUser.domain === domain) {
        return NextResponse.json(
          { error: "Store URL already registered" },
          { status: 400 },
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        domain: domain,
      },
    });

    // Create shop, user, and license in a transaction
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Create shop
        const shop = await tx.shop.findFirst({
          where: { domain },
        });
        if (!shop) {
          return;
        }
        // Create user
        const user = await tx.users.create({
          data: {
            domain: domain,
            shopId: shop.id,
            name: name,
            email: email,
            password: hashedPassword,
            stripeId: stripeCustomer.id,
          },
        });

        // Create initial license (inactive until payment)
        const license = await tx.licenses.create({
          data: {
            domain: domain,
            shopId: shop.id,
            userId: user.id,
            isActive: false, // Will be activated after payment
          },
        });

        return { shop, user, license };
      },
    );
    if (result) {
      return NextResponse.json(
        {
          message: "Account created successfully",
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            domain: result.user.domain,
          },
        },
        { status: 201 },
      );
    }
    return NextResponse.json({ error: "Error" }, { status: 400 });
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 },
    );
  }
}
