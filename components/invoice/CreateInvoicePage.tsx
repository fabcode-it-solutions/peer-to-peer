"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Store {
  id: string;
  domain: string;
  name: string;
  email: string;
  isActive: boolean;
  Users: {
    id: string;
    name: string;
    email: string;
    stripeId: string | null;
  } | null;
}

export default function CreateInvoicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("shop");
  const [formData, setFormData] = useState({
    shopId: "",
    email: "",
    amount: "",
    description: "",
    dueDate: "",
  });

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState(id);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user is superAdmin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "superAdmin") {
      router.push("/");
    }
  }, [status, session, router]);

  // Search stores
  useEffect(() => {
    const searchStores = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setStores([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/superadmin/stores/search?q=${encodeURIComponent(
            searchQuery
          )}&limit=10`
        );
        const data = await response.json();

        if (data.success) {
          setStores(data.stores);
          if (id) {
            setFormData((prev) => ({ ...prev, shopId: id }));
            setSelectedStore(data.stores[0]);
          }
        }
      } catch (error) {
        console.error("Error searching stores:", error);
      }
    };

    const debounce = setTimeout(() => {
      searchStores();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setFormData((prev) => ({
      ...prev,
      shopId: store.id,
      email: store.Users?.email || store.email || "",
    }));
    setSearchQuery(store.name || store.domain);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    if (!selectedStore) {
      setError("Store is required");
      setLoading(false);
      return;
    }
    // Validation
    if (!formData.email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/superadmin/invoices/create-stripe-invoice",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shopId: formData.shopId || undefined,
            email: formData.email,
            amount: parseFloat(formData.amount),
            description: formData.description || undefined,
            dueDate: formData.dueDate || undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `Invoice created successfully! Stripe Invoice ID: ${data.stripeInvoice.id}`
        );

        // Reset form
        setFormData({
          shopId: "",
          email: "",
          amount: "",
          description: "",
          dueDate: "",
        });
        setSelectedStore(null);
        setSearchQuery("");

        // Redirect after 3 seconds
        setTimeout(() => {
          router.push("/dashboard/invoices");
        }, 3000);
      } else {
        setError(data.message || "Failed to create invoice");
      }
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={id ? `/dashboard/stores/${id}` : "/dashboard/invoices"}
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
            {id ? "Back to store" : "Back to Invoices"}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create and send a Stripe invoice to a customer
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Search */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Store *
              </label>
              <input
                type="text"
                value={searchQuery as string}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by store name, domain, or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Dropdown */}
              {showDropdown && stores.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => handleStoreSelect(store)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {store.name || store.domain}
                      </div>
                      <div className="text-sm text-gray-500">
                        {store.domain}
                      </div>
                      {store.Users && (
                        <div className="text-xs text-gray-400 mt-1">
                          {store.Users.email}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedStore && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Selected: {selectedStore.name || selectedStore.domain}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedStore.domain}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStore(null);
                        setSearchQuery("");
                        setFormData((prev) => ({ ...prev, shopId: "" }));
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                placeholder="customer@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                The invoice will be sent to this email address
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
                placeholder="What is this invoice for?"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                If not set, defaults to 30 days from now
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Invoice...
                  </span>
                ) : (
                  "Create & Send Invoice"
                )}
              </button>
              <Link
                href="/dashboard/invoices"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            ℹ️ How it works
          </h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>
              • A Stripe invoice will be created and sent to the customer's
              email
            </li>
            <li>• The customer will receive an email with a payment link</li>
            <li>
              • Invoice status will be automatically synced via Stripe webhooks
            </li>
            <li>• You can view all invoices in the Stripe Dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
