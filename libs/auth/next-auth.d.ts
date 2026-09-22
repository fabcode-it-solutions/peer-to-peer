import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string | null;
    name: string | null;
    domain: string;
    shopId: string;
    stripeId: string | null;
    hasActiveLicense: boolean;
    role: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      domain: string;
      shopId: string;
      stripeId: string | null;
      role: string | null;
      hasActiveLicense: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    domain: string;
    shopId: string;
    stripeId: string | null;
    hasActiveLicense: boolean;
    role: string | null;
  }
}
