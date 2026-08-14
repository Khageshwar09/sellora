"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getStore,
  saveStore,
  money,
  shortDate,
  type Customer,
  type Order,
} from "@/lib/sellora-data";

type StoreData = ReturnType<typeof getStore>;

export default function CustomersPage() {
  const [store, setStore] =
    useState<StoreData | null>(null);

  const [search, setSearch] =
    useState("");

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [showAddCustomer, setShowAddCustomer] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  /* =========================================================
     LOAD STORE
  ========================================================= */

  useEffect(() => {
    loadStore();

    const handleUpdate = () => {
      loadStore();
    };

    window.addEventListener(
      "sellora-store-updated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "sellora-store-updated",
        handleUpdate
      );
    };
  }, []);

  function loadStore() {
    setStore(getStore());
  }

  /* =========================================================
     STORE DATA
  ========================================================= */

  const customers = store?.customers ?? [];
  const orders = store?.orders ?? [];

  /* =========================================================
     CUSTOMER STATS
  ========================================================= */

  const customerStats = useMemo(() => {
    return customers.map((customer) => {
      const customerOrders =
        orders.filter(
          (order) =>
            order.customerId ===
            customer.id
        );

      const validOrders =
        customerOrders.filter(
          (order) =>
            order.status !==
              "Cancelled" &&
            order.payment !==
              "Refunded"
        );

      const totalSpent =
        validOrders.reduce(
          (sum, order) =>
            sum + order.total,
          0
        );

      const sortedOrders =
        [...customerOrders].sort(
          (a, b) =>
            new Date(
              b.date
            ).getTime() -
            new Date(
              a.date
            ).getTime()
        );

      return {
        customer,
        orders:
          customerOrders.length,
        spent: totalSpent,
        lastOrder:
          sortedOrders[0] ?? null,
      };
    });
  }, [customers, orders]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredCustomers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return customerStats;
      }

      return customerStats.filter(
        ({ customer }) =>
          customer.name
            .toLowerCase()
            .includes(query) ||
          customer.phone
            .toLowerCase()
            .includes(query) ||
          customer.email
            .toLowerCase()
            .includes(query) ||
          customer.id
            .toLowerCase()
            .includes(query)
      );
    }, [
      customerStats,
      search,
    ]);

  /* =========================================================
     DASHBOARD STATS
  ========================================================= */

  const totalCustomers =
    customers.length;

  const totalCustomerRevenue =
    customerStats.reduce(
      (sum, item) =>
        sum + item.spent,
      0
    );

  const repeatCustomers =
    customerStats.filter(
      (item) =>
        item.orders > 1
    ).length;

  const averageCustomerValue =
    totalCustomers > 0
      ? totalCustomerRevenue /
        totalCustomers
      : 0;

  /* =========================================================
     ADD CUSTOMER
  ========================================================= */

  function addCustomer(
    customer: Customer
  ) {
    if (!store) return;

    const updatedStore = {
      ...store,

      customers: [
        ...store.customers,
        customer,
      ],
    };

    saveStore(
      updatedStore
    );

    setStore(
      updatedStore
    );

    setShowAddCustomer(
      false
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  /* =========================================================
     DELETE CUSTOMER
  ========================================================= */

  function deleteCustomer(
    customerId: string
  ) {
    if (!store) return;

    const hasOrders =
      store.orders.some(
        (order) =>
          order.customerId ===
          customerId
      );

    if (hasOrders) {
      window.alert(
        "This customer has existing orders and cannot be deleted."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Delete this customer?"
      );

    if (!confirmed) {
      return;
    }

    const updatedStore = {
      ...store,

      customers:
        store.customers.filter(
          (customer) =>
            customer.id !==
            customerId
        ),
    };

    saveStore(
      updatedStore
    );

    setStore(
      updatedStore
    );

    setSelectedCustomer(
      null
    );
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (!store) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading customers...
        </p>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Store management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Customers
            </h1>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Manage your customers and their order history.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAddCustomer(true)
            }
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
          >
            + Add customer
          </button>
        </div>

        {/* SUCCESS */}

        {saved && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            ✓ Customer added successfully.
          </div>
        )}

        {/* STATS */}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            label="Total customers"
            value={totalCustomers.toLocaleString(
              "en-IN"
            )}
          />

          <StatCard
            label="Customer revenue"
            value={money(
              totalCustomerRevenue
            )}
          />

          <StatCard
            label="Repeat customers"
            value={repeatCustomers.toLocaleString(
              "en-IN"
            )}
          />

          <StatCard
            label="Average customer value"
            value={money(
              Math.round(
                averageCustomerValue
              )
            )}
          />

        </div>

        {/* SEARCH */}

        <div className="mb-5">
          <div className="relative">

            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by name, phone, email or customer ID..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

          </div>
        </div>

        {/* RESULT COUNT */}

        <div className="mb-3 flex items-center justify-between gap-3">

          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredCustomers.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {customers.length}
            </span>{" "}
            customers
          </p>

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          )}

        </div>

        {/* DESKTOP TABLE */}

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead className="border-b border-slate-100 bg-slate-50">

                <tr>

                  <TableHeader>
                    Customer
                  </TableHeader>

                  <TableHeader>
                    Contact
                  </TableHeader>

                  <TableHeader>
                    Orders
                  </TableHeader>

                  <TableHeader>
                    Spent
                  </TableHeader>

                  <TableHeader>
                    Last order
                  </TableHeader>

                  <TableHeader>
                    Joined
                  </TableHeader>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredCustomers.map(
                  ({
                    customer,
                    orders:
                      orderCount,
                    spent,
                    lastOrder,
                  }) => (
                    <tr
                      key={
                        customer.id
                      }
                      className="transition hover:bg-slate-50/70"
                    >

                      {/* CUSTOMER */}

                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCustomer(
                              customer
                            )
                          }
                          className="flex min-w-0 items-center gap-3 text-left"
                        >

                          <Avatar
                            name={
                              customer.name
                            }
                          />

                          <div className="min-w-0">

                            <p className="truncate text-sm font-bold text-slate-900 hover:text-blue-600">
                              {
                                customer.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {
                                customer.id
                              }
                            </p>

                          </div>

                        </button>

                      </td>

                      {/* CONTACT */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-medium text-slate-700">
                          {
                            customer.phone
                          }
                        </p>

                        <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                          {
                            customer.email
                          }
                        </p>

                      </td>

                      {/* ORDERS */}

                      <td className="px-5 py-4">

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {orderCount}{" "}
                          {orderCount === 1
                            ? "order"
                            : "orders"}
                        </span>

                      </td>

                      {/* SPENT */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-bold text-slate-900">
                          {money(
                            spent
                          )}
                        </p>

                      </td>

                      {/* LAST ORDER */}

                      <td className="px-5 py-4">

                        {lastOrder ? (
                          <div>

                            <p className="text-sm font-semibold text-slate-700">
                              {
                                lastOrder.id
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {shortDate(
                                lastOrder.date
                              )}
                            </p>

                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No orders
                          </span>
                        )}

                      </td>

                      {/* JOINED */}

                      <td className="px-5 py-4">

                        <p className="text-sm text-slate-600">
                          {shortDate(
                            customer.joined
                          )}
                        </p>

                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCustomer(
                              customer
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          View
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

            {filteredCustomers.length ===
              0 && (
              <EmptyCustomers
                search={search}
                onClear={() =>
                  setSearch("")
                }
              />
            )}

          </div>

        </div>

        {/* MOBILE */}

        <div className="space-y-3 md:hidden">

          {filteredCustomers.map(
            ({
              customer,
              orders:
                orderCount,
              spent,
              lastOrder,
            }) => (
              <button
                key={
                  customer.id
                }
                type="button"
                onClick={() =>
                  setSelectedCustomer(
                    customer
                  )
                }
                className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300"
              >

                <div className="flex items-start gap-3">

                  <Avatar
                    name={
                      customer.name
                    }
                  />

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-slate-900">
                          {
                            customer.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            customer.id
                          }
                        </p>

                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-900">
                        {money(
                          spent
                        )}
                      </p>

                    </div>

                    <div className="mt-3">

                      <p className="text-xs text-slate-500">
                        {
                          customer.phone
                        }
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {
                          customer.email
                        }
                      </p>

                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">

                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {orderCount}{" "}
                        {orderCount === 1
                          ? "order"
                          : "orders"}
                      </span>

                      {lastOrder && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          Last:{" "}
                          {
                            lastOrder.id
                          }
                        </span>
                      )}

                    </div>

                  </div>

                </div>

              </button>
            )
          )}

          {filteredCustomers.length ===
            0 && (
            <div className="rounded-2xl border border-slate-200 bg-white">

              <EmptyCustomers
                search={search}
                onClear={() =>
                  setSearch("")
                }
              />

            </div>
          )}

        </div>

      </div>

      {/* CUSTOMER DETAILS */}

      {selectedCustomer && (
        <CustomerDetails
          customer={
            selectedCustomer
          }
          orders={orders}
          onClose={() =>
            setSelectedCustomer(
              null
            )
          }
          onDelete={() =>
            deleteCustomer(
              selectedCustomer.id
            )
          }
        />
      )}

      {/* ADD CUSTOMER */}

      {showAddCustomer && (
        <AddCustomerModal
          existingCustomers={
            customers
          }
          onClose={() =>
            setShowAddCustomer(
              false
            )
          }
          onAdd={
            addCustomer
          }
        />
      )}

    </main>
  );
}

/* =========================================================
   TABLE HEADER
========================================================= */

function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </th>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

      <p className="truncate text-xs font-medium text-slate-400 sm:text-sm">
        {label}
      </p>

      <p className="mt-2 truncate text-xl font-bold text-slate-900 sm:text-2xl">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({
  name,
}: {
  name: string;
}) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0)
      )
      .join("")
      .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
      {initials || "C"}
    </div>
  );
}

/* =========================================================
   CUSTOMER DETAILS
========================================================= */

function CustomerDetails({
  customer,
  orders,
  onClose,
  onDelete,
}: {
  customer: Customer;
  orders: Order[];
  onClose: () => void;
  onDelete: () => void;
}) {
  const customerOrders =
    orders
      .filter(
        (order) =>
          order.customerId ===
          customer.id
      )
      .sort(
        (a, b) =>
          new Date(
            b.date
          ).getTime() -
          new Date(
            a.date
          ).getTime()
      );

  const validOrders =
    customerOrders.filter(
      (order) =>
        order.status !==
          "Cancelled" &&
        order.payment !==
          "Refunded"
    );

  const totalSpent =
    validOrders.reduce(
      (sum, order) =>
        sum + order.total,
      0
    );

  return (
    <div className="fixed inset-0 z-50">

      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close customer details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
      />

      {/* DRAWER */}

      <div className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col overflow-hidden bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">

          <div className="flex min-w-0 items-center gap-3">

            <Avatar
              name={
                customer.name
              }
            />

            <div className="min-w-0">

              <h2 className="truncate text-xl font-bold text-slate-900">
                {
                  customer.name
                }
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {
                  customer.id
                }
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-500 hover:bg-slate-200"
          >
            ×
          </button>

        </div>

        {/* BODY */}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">

          {/* CONTACT */}

          <section>

            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Contact
            </h3>

            <div className="mt-3 rounded-2xl border border-slate-200 p-4">

              <div className="space-y-3">

                <InfoRow
                  label="Phone"
                  value={
                    customer.phone
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    customer.email
                  }
                />

                <InfoRow
                  label="Joined"
                  value={shortDate(
                    customer.joined
                  )}
                />

              </div>

            </div>

          </section>

          {/* STATS */}

          <section className="mt-6 grid grid-cols-2 gap-3">

            <div className="rounded-2xl bg-blue-50 p-4">

              <p className="text-xs text-blue-600">
                Orders
              </p>

              <p className="mt-1 text-xl font-bold text-blue-950">
                {
                  customerOrders.length
                }
              </p>

            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">

              <p className="text-xs text-emerald-600">
                Total spent
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-950">
                {money(
                  totalSpent
                )}
              </p>

            </div>

          </section>

          {/* ORDER HISTORY */}

          <section className="mt-6">

            <div className="flex items-center justify-between gap-3">

              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Order history
              </h3>

              <span className="text-xs text-slate-400">
                {
                  customerOrders.length
                }{" "}
                total
              </span>

            </div>

            {customerOrders.length >
            0 ? (
              <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200">

                {customerOrders.map(
                  (order) => (
                    <div
                      key={
                        order.id
                      }
                      className="p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <p className="text-sm font-bold text-slate-900">
                            {
                              order.id
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {shortDate(
                              order.date
                            )}
                          </p>

                        </div>

                        <p className="shrink-0 text-sm font-bold text-slate-900">
                          {money(
                            order.total
                          )}
                        </p>

                      </div>

                      <p className="mt-3 truncate text-xs text-slate-500">
                        {order.items
                          .map(
                            (item) =>
                              `${item.name} × ${item.qty}`
                          )
                          .join(
                            ", "
                          )}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {
                            order.status
                          }
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentClass(
                            order.payment
                          )}`}
                        >
                          {
                            order.payment
                          }
                        </span>

                      </div>

                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center">

                <p className="text-sm font-semibold text-slate-700">
                  No orders yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Orders from this customer will appear here.
                </p>

              </div>
            )}

          </section>

        </div>

        {/* FOOTER */}

        <div className="flex gap-3 border-t border-slate-100 bg-white p-4 sm:p-5">

          <button
            type="button"
            onClick={onDelete}
            className="flex-1 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Close
          </button>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">

      <span className="shrink-0 text-sm text-slate-400">
        {label}
      </span>

      <span className="min-w-0 break-all text-right text-sm font-semibold text-slate-800">
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
  status: Order["status"]
) {
  switch (status) {
    case "Pending":
      return "bg-amber-50 text-amber-700";

    case "Confirmed":
      return "bg-blue-50 text-blue-700";

    case "Packed":
      return "bg-violet-50 text-violet-700";

    case "Out for delivery":
      return "bg-cyan-50 text-cyan-700";

    case "Delivered":
      return "bg-emerald-50 text-emerald-700";

    case "Cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

/* =========================================================
   PAYMENT CLASS

   Uses Order["payment"] directly.
   No separate PaymentStatus type.
   No paymentClasses[payment] lookup.
========================================================= */

function getPaymentClass(
  payment: Order["payment"]
) {
  switch (payment) {
    case "Paid":
      return "bg-emerald-50 text-emerald-700";

    case "COD":
      return "bg-amber-50 text-amber-700";

    case "Refunded":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

/* =========================================================
   EMPTY CUSTOMERS
========================================================= */

function EmptyCustomers({
  search,
  onClear,
}: {
  search: string;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        👥
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900">
        No customers found
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {search
          ? "Try searching with a different name, phone number or email."
          : "Customers will appear here when they are added."}
      </p>

      {search && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Clear search
        </button>
      )}

    </div>
  );
}

/* =========================================================
   ADD CUSTOMER MODAL
========================================================= */

function AddCustomerModal({
  existingCustomers,
  onClose,
  onAdd,
}: {
  existingCustomers: Customer[];
  onClose: () => void;
  onAdd: (
    customer: Customer
  ) => void;
}) {
  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  function handleSubmit() {
    const cleanName =
      name.trim();

    const cleanPhone =
      phone.trim();

    const cleanEmail =
      email.trim();

    if (!cleanName) {
      setError(
        "Enter customer name."
      );
      return;
    }

    if (!cleanPhone) {
      setError(
        "Enter customer phone number."
      );
      return;
    }

    if (
      !cleanEmail ||
      !cleanEmail.includes("@")
    ) {
      setError(
        "Enter a valid email address."
      );
      return;
    }

    const duplicate =
      existingCustomers.some(
        (customer) =>
          customer.phone
            .trim()
            .toLowerCase() ===
          cleanPhone
            .toLowerCase()
      );

    if (duplicate) {
      setError(
        "A customer with this phone number already exists."
      );
      return;
    }

    /*
      Generate the next customer number
      safely even if a customer was deleted.
    */

    const numbers =
      existingCustomers
        .map((customer) => {
          const match =
            customer.id.match(
              /^C(\d+)$/
            );

          return match
            ? Number(
                match[1]
              )
            : 0;
        })
        .filter(
          (number) =>
            Number.isFinite(
              number
            )
        );

    const nextNumber =
      numbers.length > 0
        ? Math.max(
            ...numbers
          ) + 1
        : 1;

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const newCustomer: Customer =
      {
        id: `C${String(
          nextNumber
        ).padStart(3, "0")}`,

        name:
          cleanName,

        phone:
          cleanPhone,

        email:
          cleanEmail,

        orders: 0,

        spent: 0,

        joined:
          today,
      };

    onAdd(
      newCustomer
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close add customer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
      />

      {/* MODAL */}

      <div className="relative w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5">

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              Add customer
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Create a customer manually.
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-500 hover:bg-slate-200"
          >
            ×
          </button>

        </div>

        {/* BODY */}

        <div className="space-y-4 p-5">

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <InputField
            label="Customer name"
            value={name}
            onChange={
              setName
            }
            placeholder="Rahul Kumar"
          />

          <InputField
            label="Phone number"
            value={phone}
            onChange={
              setPhone
            }
            placeholder="+91 98765 43210"
            type="tel"
          />

          <InputField
            label="Email"
            value={email}
            onChange={
              setEmail
            }
            placeholder="customer@example.com"
            type="email"
          />

        </div>

        {/* FOOTER */}

        <div className="flex gap-3 border-t border-slate-100 p-5">

          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              handleSubmit
            }
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add customer
          </button>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      />

    </div>
  );
}