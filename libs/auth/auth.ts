import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { verifyPassword } from "@/utils/auth-utils";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        // Find user by email
        const user = await prisma.users.findFirst({
          where: {
            email: credentials.email,
          },
          include: {
            shop: true,
            licenses: true,
          },
        });
        console.log(user);
        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Verify password
        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Check if shop is active
        if (!user.shop?.isActive && user.role !== "superAdmin") {
          throw new Error(
            "Your account has been deactivated. Contact support."
          );
        }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          domain: user.domain || "",
          shopId: user.shopId || "",
          stripeId: user.stripeId,
          role: user.role,
          hasActiveLicense: user.licenses?.isActive || false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || "";
        token.name = user.name || "";
        token.domain = user.domain;
        token.shopId = user.shopId;
        token.stripeId = user.stripeId;
        token.role = user.role;
        token.hasActiveLicense = user.hasActiveLicense;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.domain = token.domain as string;
        session.user.shopId = token.shopId as string;
        session.user.stripeId = token.stripeId as string | null;
        session.user.role = token.role as string;
        session.user.hasActiveLicense = token.hasActiveLicense as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
