"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface StoreData {
  shop: any;
  invoices: any[];
  payments: any[];
  paymentStats: {
    totalAmount: number;
    totalRefunded: number;
    totalPayments: number;
  };
  checkoutPlusRules: any[];
  checkoutPlusStats: {
    impressions: number;
    clicks: number;
    addToCart: number;
    conversions: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
    avgOrderValue: number;
  };
  analyticsByFeature: any;
}

export default function StoreDetailPage({
  params,
}: {
  params: { shopId: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user is superAdmin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "superAdmin") {
      router.push("/");
    }
  }, [status, session, router]);

  // Fetch store data
  useEffect(() => {
    const fetchStoreData = async () => {
      if (session?.user?.role !== "superAdmin") return;

      setLoading(true);
      try {
        const response = await fetch(`/api/superadmin/stores/${params.shopId}`);
        const data = await response.json();

        if (data.success) {
          setStoreData(data);
        }
      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [session, params.shopId]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store details...</p>
        </div>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Store not found</p>
        </div>
      </div>
    );
  }

  const {
    shop,
    invoices,
    payments,
    paymentStats,
    checkoutPlusRules,
    checkoutPlusStats,
    analyticsByFeature,
  } = storeData;

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "invoices", label: "Invoices", icon: "📄" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "checkout-plus", label: "Checkout Plus", icon: "🛒" },
    { id: "analytics", label: "Analytics", icon: "📈" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/stores"
            className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Stores
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {shop.name || shop.domain}
              </h1>
              <p className="mt-2 text-sm text-gray-600">{shop.domain}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    shop.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {shop.isActive ? "Active" : "Inactive"}
                </span>
                {shop.licenses?.isActive && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Licensed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Store Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Store Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Domain</div>
                      <div className="font-medium">{shop.domain}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Name</div>
                      <div className="font-medium">{shop.name || "N/A"}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Email</div>
                      <div className="font-medium">{shop.email || "N/A"}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Currency</div>
                      <div className="font-medium">
                        {shop.currency || "USD"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Timezone</div>
                      <div className="font-medium">
                        {shop.timezone || "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Installed</div>
                      <div className="font-medium">
                        {new Date(shop.installedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                {shop.Users && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      User Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <div className="text-sm text-gray-600">Name</div>
                        <div className="font-medium">
                          {shop.Users.name || "N/A"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium">{shop.Users.email}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <div className="text-sm text-gray-600">Role</div>
                        <div className="font-medium capitalize">
                          {shop.Users.role || "user"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <div className="text-sm text-gray-600">
                          Stripe Customer ID
                        </div>
                        <div className="font-medium text-xs">
                          {shop.Users.stripeId || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* License Info */}
                {shop.licenses && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      License Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600">Status</div>
                          <div className="font-medium">
                            {!shop.isExpired ? "Active" : "Inactive"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <div className="text-sm text-blue-600">
                        Total Payments
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {paymentStats.totalPayments}
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded">
                      <div className="text-sm text-purple-600">
                        Checkout Plus Revenue
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        ${checkoutPlusStats.revenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === "invoices" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Invoices</h3>
                  <Link
                    href={`/dashboard/invoices/create?shop=${shop.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Create Invoice
                  </Link>
                </div>
                {invoices.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No invoices found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Invoice ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {invoice.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              ${invoice.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  invoice.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>

                {/* Payment Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-green-600">Total Paid</div>
                    <div className="text-2xl font-bold text-green-900">
                      ${paymentStats.totalAmount.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <div className="text-sm text-red-600">Total Refunded</div>
                    <div className="text-2xl font-bold text-red-900">
                      ${paymentStats.totalRefunded.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-blue-600">Total Payments</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {paymentStats.totalPayments}
                    </div>
                  </div>
                </div>

                {payments.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No payments found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payment.paidAt
                                ? new Date(payment.paidAt).toLocaleDateString()
                                : new Date(
                                    payment.createdAt
                                  ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              ${payment.amount.toFixed(2)}
                              {payment.refunded && payment.refundAmount && (
                                <div className="text-xs text-red-600">
                                  -${payment.refundAmount.toFixed(2)} refunded
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payment.paymentMethod}
                              {payment.cardLast4 &&
                                ` •••• ${payment.cardLast4}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  payment.status === "SUCCEEDED"
                                    ? "bg-green-100 text-green-800"
                                    : payment.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Checkout Plus Tab */}
            {activeTab === "checkout-plus" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Checkout Plus Products
                </h3>
                {checkoutPlusRules.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No Checkout Plus products found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {checkoutPlusRules
                      .sort((a, b) => b.isActive - a.isActive)
                      .map((rule) => (
                        <div key={rule.id} className="bg-gray-50 p-4 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-medium">{rule.name}</div>
                              <div className="text-sm text-gray-600">
                                {rule.description}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                rule.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {rule.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          {/* Rule Items */}
                          {rule.rules && rule.rules.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs font-medium text-gray-600">
                                Price Ranges:
                              </div>
                              <div className="flex gap-3 flex-wrap">
                                {rule.rules.map((item: any, index: number) => (
                                  <div
                                    key={item.id}
                                    className="text-sm bg-white p-2 rounded"
                                  >
                                    <span className="font-medium">
                                      ${item.minPrice} - ${item.maxPrice}
                                    </span>
                                    <span className="text-gray-600">
                                      {" "}
                                      → Charge: ${item.charge}
                                    </span>
                                    {/* <span className="text-gray-500 ml-2">
                                    ({item.timesAdded} added, $
                                    {item.revenue.toFixed(2)} revenue)
                                  </span> */}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Checkout Plus Analytics
                </h3>

                {/* Main Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-blue-600">Impressions</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {checkoutPlusStats.impressions.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-sm text-purple-600">Clicks</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {checkoutPlusStats.clicks.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded">
                    <div className="text-sm text-yellow-600">Add to Cart</div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {checkoutPlusStats.addToCart.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-green-600">Conversions</div>
                    <div className="text-2xl font-bold text-green-900">
                      {checkoutPlusStats.conversions.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Conversion Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 p-4 rounded">
                    <div className="text-sm text-gray-600">
                      Click-Through Rate
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {checkoutPlusStats.ctr}%
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded">
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {checkoutPlusStats.conversionRate}%
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded">
                    <div className="text-sm text-gray-600">Avg Order Value</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${checkoutPlusStats.avgOrderValue.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Revenue */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-4xl font-bold text-gray-900">
                    ${checkoutPlusStats.revenue.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
