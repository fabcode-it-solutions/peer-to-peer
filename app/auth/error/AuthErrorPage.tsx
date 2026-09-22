// app/auth/error/page.tsx (App Router)
// or pages/auth/error.tsx (Pages Router)

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div>
      <section className="bg-gray-50 flex items-center justify-center min-h-dvh">
        <div className="py-8 px-4 mx-auto bg-white lg:py-16 lg:px-6">
          <div className="mx-auto text-center">
            <h1 className="mb-4 text-5xl tracking-tight font-extrabold lg:text-5xl text-primary-600 ">
              Authentication Error
            </h1>

            <p className="mb-4 text-lg font-light text-gray-500 ">
              {error ? decodeURIComponent(error) : "Something went wrong."}
            </p>
            <Link
              href="/"
              className="inline-flex text-white bg-black hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center my-4"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
