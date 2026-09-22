"use client";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/Button";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const NavLinks = [
  {
    label: "Home",
    href: "/dashboard",
  },
  {
    label: "Stores",
    href: "/dashboard/stores",
  },
];

const Header = () => {
  const { data: session, status } = useSession();
  const pathName = usePathname();
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-6 items-center">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </Link>
          </div>
          <div className="flex gap-4">
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Invoice
            </Link>

            <Button variant="secondary" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
