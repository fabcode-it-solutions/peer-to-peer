"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

interface SubscriptionData {
  hasSubscription: boolean;
  subscription: Subscription | null;
  invoices: Invoice[];
  license: {
    isActive: boolean;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session && session.user.role != "superAdmin") {
      fetchSubscriptionData();
    }
    if (session && session.user.role == "superAdmin") {
      setIsLoading(false);
    }
  }, [session]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch("/api/stripe/subscription");
      const data = await response.json();
      setSubscriptionData(data);
    } catch (err) {
      setError("Failed to load subscription data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create checkout session");
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will retain access until the end of your billing period."
      )
    ) {
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to cancel subscription");
        return;
      }

      setSuccess(data.message);
      await fetchSubscriptionData();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/stripe/reactivate-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reactivate subscription");
        return;
      }

      setSuccess(data.message);
      await fetchSubscriptionData();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>Name:</strong> {session.user.name}
          </p>
          <p>
            <strong>Email:</strong> {session.user.email}
          </p>
          {session.user.role != "superAdmin" && (
            <p>
              <strong>Store URL:</strong> {session.user.domain}
            </p>
          )}
          {session.user.role != "superAdmin" && (
            <p>
              <strong>License Status:</strong>{" "}
              <span
                className={
                  subscriptionData?.license?.isActive
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {subscriptionData?.license?.isActive ? "Active" : "Inactive"}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Subscription Section */}
      {session.user.role != "superAdmin" && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Subscription</h2>

          {!subscriptionData?.hasSubscription ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                You don't have an active subscription.
              </p>
              <Button onClick={handleSubscribe} isLoading={isProcessing}>
                Subscribe Now
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold capitalize">
                    {subscriptionData.subscription?.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Period</p>
                  <p className="font-semibold">
                    {new Date(
                      subscriptionData.subscription!.currentPeriodStart
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(
                      subscriptionData.subscription!.currentPeriodEnd
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {subscriptionData.subscription?.cancelAtPeriodEnd && (
                <Alert variant="warning">
                  Your subscription is scheduled to cancel on{" "}
                  {new Date(
                    subscriptionData.subscription.cancelAt!
                  ).toLocaleDateString()}
                </Alert>
              )}

              <div className="flex gap-4">
                {subscriptionData.subscription?.cancelAtPeriodEnd ? (
                  <Button
                    variant="primary"
                    onClick={handleReactivateSubscription}
                    isLoading={isProcessing}
                  >
                    Reactivate Subscription
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={handleCancelSubscription}
                    isLoading={isProcessing}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoice History */}
      {session.user.role != "superAdmin" &&
        subscriptionData?.invoices &&
        subscriptionData.invoices.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Payment History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptionData.invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.paidAt
                          ? new Date(invoice.paidAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.currency.toUpperCase()}{" "}
                        {invoice.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.invoicePdf && (
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-black hover:underline"
                          >
                            Download PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}
