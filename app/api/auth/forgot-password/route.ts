import { sendPasswordResetEmail } from "@/actions/mailer";
import { prisma } from "@/libs/prisma/prisma.client";
import { generateResetToken, getTokenExpiry } from "@/utils/auth-utils";
import { forgotPasswordSchema } from "@/utils/validations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = forgotPasswordSchema.parse(body);
    const { email } = validatedData;

    // Find user
    const user = await prisma.users.findFirst({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        {
          message:
            "If an account exists with this email, you will receive a password reset link.",
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const tokenExpiry = getTokenExpiry();

    // Save token to database
    await prisma.users.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: tokenExpiry,
      },
    });

    // Send email
    await sendPasswordResetEmail({
      to: email,
      token: resetToken,
    });

    return NextResponse.json(
      {
        message:
          "If an account exists with this email, you will receive a password reset link.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Forgot password error:", error);

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
