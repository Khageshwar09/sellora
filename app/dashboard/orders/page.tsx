"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getStore,
  saveStore,
  money,
  shortDate,
  type Order,
  type OrderStatus,
} from "@/lib/sellora-data";

const STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Packed",
  "Out for delivery",
  "Delivered",
  "Cancelled",
];

type PaymentFilter =
  | "All"
  | Order["payment"];

type StatusFilter =
  | "All"
  | OrderStatus;

export default function OrdersPage() {
  const [store, setStore] =
    useState<ReturnType<typeof getStore> | null>(
      null
    );

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>("All");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [editingStatus, setEditingStatus] =
    useState<OrderStatus | null>(null);

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

  const orders = store?.orders ?? [];

  /* =========================================================
     FILTER ORDERS
  ========================================================= */

  const filteredOrders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        const itemNames =
          order.items
            .map(
              (item) =>
                item.name
            )
            .join(" ")
            .toLowerCase();

        const matchesSearch =
          !query ||
          order.id
            .toLowerCase()
            .includes(query) ||
          order.customer
            .toLowerCase()
            .includes(query) ||
          order.phone
            .toLowerCase()
            .includes(query) ||
          itemNames.includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          order.status ===
            statusFilter;

        const matchesPayment =
          paymentFilter === "All" ||
          order.payment ===
            paymentFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPayment
        );
      })
      .sort(
        (a, b) =>
          new Date(
            b.date
          ).getTime() -
          new Date(
            a.date
          ).getTime()
      );
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
  ]);

  /* =========================================================
     STATS
  ========================================================= */

  const totalOrders =
    orders.length;

  const pendingOrders =
    orders.filter(
      (order) =>
        order.status === "Pending"
    ).length;

  const processingOrders =
    orders.filter(
      (order) =>
        order.status === "Confirmed" ||
        order.status === "Packed" ||
        order.status ===
          "Out for delivery"
    ).length;

  const deliveredOrders =
    orders.filter(
      (order) =>
        order.status ===
        "Delivered"
    ).length;

  const totalRevenue =
    orders
      .filter(
        (order) =>
          order.status !==
            "Cancelled" &&
          order.payment !==
            "Refunded"
      )
      .reduce(
        (sum, order) =>
          sum + order.total,
        0
      );

  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  function updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ) {
    if (!store) return;

    const updatedOrders =
      store.orders.map(
        (order) =>
          order.id === orderId
            ? {
                ...order,
                status,
              }
            : order
      );

    const updatedStore = {
      ...store,
      orders:
        updatedOrders,
    };

    saveStore(
      updatedStore
    );

    setStore(
      updatedStore
    );

    const updated =
      updatedOrders.find(
        (order) =>
          order.id ===
          orderId
      );

    if (updated) {
      setSelectedOrder(
        updated
      );
    }

    setEditingStatus(
      null
    );
  }

  /* =========================================================
     DELETE ORDER
  ========================================================= */

  function deleteOrder(
    orderId: string
  ) {
    if (!store) return;

    const confirmed =
      window.confirm(
        "Delete this order? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    const updatedStore = {
      ...store,
      orders:
        store.orders.filter(
          (order) =>
            order.id !==
            orderId
        ),
    };

    saveStore(
      updatedStore
    );

    setStore(
      updatedStore
    );

    setSelectedOrder(
      null
    );
  }

  if (!store) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading orders...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

          <div>
            <p className="text-sm font-medium text-slate-500">
              Store management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Orders
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer orders from purchase to delivery.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

            <p className="text-xs text-slate-400">
              Order revenue
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {money(
                totalRevenue
              )}
            </p>

          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            label="Total orders"
            value={totalOrders}
          />

          <StatCard
            label="Pending"
            value={pendingOrders}
          />

          <StatCard
            label="Processing"
            value={processingOrders}
          />

          <StatCard
            label="Delivered"
            value={deliveredOrders}
          />

        </div>

        {/* SEARCH / FILTER */}

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px]">

          <div className="relative">

            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search order, customer, phone or product..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as StatusFilter
              )
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500"
          >
            <option value="All">
              All statuses
            </option>

            {STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              )
            )}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(
                event.target.value as PaymentFilter
              )
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500"
          >
            <option value="All">
              All payments
            </option>

            <option value="Paid">
              Paid
            </option>

            <option value="COD">
              COD
            </option>

            <option value="Refunded">
              Refunded
            </option>
          </select>

        </div>

        {/* COUNT */}

        <div className="mt-4 flex items-center justify-between">

          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {
                filteredOrders.length
              }
            </span>{" "}
            orders
          </p>

          {(search ||
            statusFilter !==
              "All" ||
            paymentFilter !==
              "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter(
                  "All"
                );
                setPaymentFilter(
                  "All"
                );
              }}
              className="text-xs font-semibold text-blue-600"
            >
              Clear filters
            </button>
          )}

        </div>

        {/* TABLE */}

        <section className="mt-3 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead className="border-b border-slate-100 bg-slate-50">

                <tr>

                  <Header>
                    Order
                  </Header>

                  <Header>
                    Customer
                  </Header>

                  <Header>
                    Items
                  </Header>

                  <Header>
                    Total
                  </Header>

                  <Header>
                    Payment
                  </Header>

                  <Header>
                    Status
                  </Header>

                  <Header right>
                    Action
                  </Header>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredOrders.map(
                  (order) => (
                    <tr
                      key={
                        order.id
                      }
                      className="hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                          className="text-left"
                        >

                          <p className="text-sm font-bold text-slate-900 hover:text-blue-600">
                            {
                              order.id
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {shortDate(
                              order.date
                            )}
                          </p>

                        </button>

                      </td>

                      <td className="px-5 py-4">

                        <p className="text-sm font-semibold text-slate-800">
                          {
                            order.customer
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            order.phone
                          }
                        </p>

                      </td>

                      <td className="max-w-[300px] px-5 py-4">

                        <p className="truncate text-sm text-slate-600">
                          {order.items
                            .map(
                              (item) =>
                                `${item.name} × ${item.qty}`
                            )
                            .join(
                              ", "
                            )}
                        </p>

                      </td>

                      <td className="px-5 py-4">

                        <p className="text-sm font-bold text-slate-900">
                          {money(
                            order.total
                          )}
                        </p>

                      </td>

                      <td className="px-5 py-4">

                        <PaymentBadge
                          payment={
                            order.payment
                          }
                        />

                      </td>

                      <td className="px-5 py-4">

                        <StatusBadge
                          status={
                            order.status
                          }
                        />

                      </td>

                      <td className="px-5 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          View
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

          {filteredOrders.length ===
            0 && (
            <EmptyOrders />
          )}

        </section>

        {/* MOBILE */}

        <section className="mt-3 space-y-3 md:hidden">

          {filteredOrders.map(
            (order) => (
              <button
                key={
                  order.id
                }
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    order
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
              >

                <div className="flex justify-between gap-3">

                  <div>
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

                  <p className="text-sm font-bold text-slate-900">
                    {money(
                      order.total
                    )}
                  </p>

                </div>

                <p className="mt-4 text-sm font-semibold text-slate-800">
                  {
                    order.customer
                  }
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {
                    order.phone
                  }
                </p>

                <p className="mt-3 text-xs text-slate-500">
                  {order.items
                    .map(
                      (item) =>
                        `${item.name} × ${item.qty}`
                    )
                    .join(
                      ", "
                    )}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  <PaymentBadge
                    payment={
                      order.payment
                    }
                  />

                  <StatusBadge
                    status={
                      order.status
                    }
                  />

                </div>

              </button>
            )
          )}

          {filteredOrders.length ===
            0 && (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <EmptyOrders />
            </div>
          )}

        </section>

      </div>

      {/* ORDER DRAWER */}

      {selectedOrder && (
        <OrderDrawer
          order={
            selectedOrder
          }
          editingStatus={
            editingStatus
          }
          setEditingStatus={
            setEditingStatus
          }
          onStatusChange={
            updateOrderStatus
          }
          onDelete={() =>
            deleteOrder(
              selectedOrder.id
            )
          }
          onClose={() =>
            setSelectedOrder(
              null
            )
          }
        />
      )}

    </main>
  );
}

/* =========================================================
   STAT
========================================================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({
  children,
  right = false,
}: {
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <th
      className={`px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400 ${
        right
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/* =========================================================
   PAYMENT
========================================================= */

function PaymentBadge({
  payment,
}: {
  payment: Order["payment"];
}) {
  let classes =
    "border-slate-200 bg-slate-50 text-slate-600";

  if (payment === "Paid") {
    classes =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (payment === "COD") {
    classes =
      "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    payment === "Refunded"
  ) {
    classes =
      "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {payment}
    </span>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  let classes =
    "bg-slate-100 text-slate-600";

  switch (status) {
    case "Pending":
      classes =
        "bg-amber-50 text-amber-700";
      break;

    case "Confirmed":
      classes =
        "bg-blue-50 text-blue-700";
      break;

    case "Packed":
      classes =
        "bg-violet-50 text-violet-700";
      break;

    case "Out for delivery":
      classes =
        "bg-cyan-50 text-cyan-700";
      break;

    case "Delivered":
      classes =
        "bg-emerald-50 text-emerald-700";
      break;

    case "Cancelled":
      classes =
        "bg-red-50 text-red-700";
      break;
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   DRAWER
========================================================= */

function OrderDrawer({
  order,
  editingStatus,
  setEditingStatus,
  onStatusChange,
  onDelete,
  onClose,
}: {
  order: Order;
  editingStatus: OrderStatus | null;
  setEditingStatus: (
    status: OrderStatus | null
  ) => void;
  onStatusChange: (
    orderId: string,
    status: OrderStatus
  ) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">

      <button
        type="button"
        aria-label="Close order"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Order
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {order.id}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {shortDate(
                order.date
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-500"
          >
            ×
          </button>

        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">

          <div className="rounded-2xl border border-slate-200 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Customer
            </p>

            <p className="mt-2 text-base font-bold text-slate-900">
              {order.customer}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {order.phone}
            </p>

          </div>

          <div className="mt-5">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Items
            </p>

            <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200">

              {order.items.map(
                (item) => (
                  <div
                    key={
                      item.productId
                    }
                    className="flex justify-between gap-4 p-4"
                  >

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {
                          item.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Qty{" "}
                        {
                          item.qty
                        }{" "}
                        ×{" "}
                        {money(
                          item.price
                        )}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-slate-900">
                      {money(
                        item.price *
                          item.qty
                      )}
                    </p>

                  </div>
                )
              )}

            </div>

          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-xs text-slate-400">
                Payment
              </p>

              <div className="mt-2">
                <PaymentBadge
                  payment={
                    order.payment
                  }
                />
              </div>

            </div>

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-xs text-slate-400">
                Status
              </p>

              <div className="mt-2">
                <StatusBadge
                  status={
                    order.status
                  }
                />
              </div>

            </div>

          </div>

          <div className="mt-5 rounded-2xl bg-slate-900 p-5">

            <div className="flex justify-between">

              <span className="text-sm text-slate-300">
                Total
              </span>

              <span className="text-xl font-bold text-white">
                {money(
                  order.total
                )}
              </span>

            </div>

          </div>

          {/* STATUS UPDATE */}

          <div className="mt-6">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Update status
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">

              {STATUSES.map(
                (status) => (
                  <button
                    key={
                      status
                    }
                    type="button"
                    onClick={() =>
                      setEditingStatus(
                        status
                      )
                    }
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                      order.status ===
                      status
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {status}
                  </button>
                )
              )}

            </div>

            {editingStatus && (
              <button
                type="button"
                onClick={() =>
                  onStatusChange(
                    order.id,
                    editingStatus
                  )
                }
                className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Save status
              </button>
            )}

          </div>

        </div>

        <div className="flex gap-3 border-t border-slate-100 p-4">

          <button
            type="button"
            onClick={onDelete}
            className="flex-1 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Close
          </button>

        </div>

      </aside>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyOrders() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        📦
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900">
        No orders yet
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Real customer orders will appear here.
      </p>

    </div>
  );
}