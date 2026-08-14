"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getStore,
  saveStore,
  money,
  shortDate,
  type Order,
  type OrderStatus,
} from "@/lib/sellora-data";

/* =========================================================
   DELIVERY STATUSES
========================================================= */

const DELIVERY_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Packed",
  "Out for delivery",
  "Delivered",
  "Cancelled",
];

/* =========================================================
   PAGE
========================================================= */

export default function DeliveryPage() {
  const [store, setStore] =
    useState<ReturnType<typeof getStore> | null>(null);

  const [filter, setFilter] =
    useState<OrderStatus | "All">("All");

  const [search, setSearch] =
    useState("");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  /* =======================================================
     LOAD STORE
  ======================================================= */

  useEffect(() => {
    loadStore();

    const handleStoreUpdate = () => {
      loadStore();
    };

    window.addEventListener(
      "sellora-store-updated",
      handleStoreUpdate
    );

    return () => {
      window.removeEventListener(
        "sellora-store-updated",
        handleStoreUpdate
      );
    };
  }, []);

  function loadStore() {
    setStore(getStore());
  }

  /* =======================================================
     ORDERS
  ======================================================= */

  const orders = store?.orders ?? [];

  /* =======================================================
     ACTIVE DELIVERIES
  ======================================================= */

  const activeDeliveries = useMemo(() => {
    return orders.filter(
      (order) =>
        order.status !== "Delivered" &&
        order.status !== "Cancelled"
    );
  }, [orders]);

  /* =======================================================
     ACTIVE DELIVERY VALUE
  ======================================================= */

  const activeDeliveryValue = useMemo(() => {
    return activeDeliveries.reduce(
      (total, order) => total + order.total,
      0
    );
  }, [activeDeliveries]);

  /* =======================================================
     FILTERED ORDERS
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders
      .filter((order) => {
        const statusMatch =
          filter === "All" ||
          order.status === filter;

        const itemText = order.items
          .map((item) => item.name)
          .join(" ");

        const searchMatch =
          !query ||
          order.id.toLowerCase().includes(query) ||
          order.customer
            .toLowerCase()
            .includes(query) ||
          order.phone
            .toLowerCase()
            .includes(query) ||
          itemText
            .toLowerCase()
            .includes(query);

        return statusMatch && searchMatch;
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );
  }, [orders, filter, search]);

  /* =======================================================
     STATUS COUNTS
  ======================================================= */

  const statusCounts = useMemo(() => {
    return {
      Pending: orders.filter(
        (order) =>
          order.status === "Pending"
      ).length,

      Confirmed: orders.filter(
        (order) =>
          order.status === "Confirmed"
      ).length,

      Packed: orders.filter(
        (order) =>
          order.status === "Packed"
      ).length,

      OutForDelivery: orders.filter(
        (order) =>
          order.status === "Out for delivery"
      ).length,

      Delivered: orders.filter(
        (order) =>
          order.status === "Delivered"
      ).length,

      Cancelled: orders.filter(
        (order) =>
          order.status === "Cancelled"
      ).length,
    };
  }, [orders]);

  /* =======================================================
     UPDATE ORDER STATUS
  ======================================================= */

  function updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ) {
    if (!store) return;

    const updatedOrders = store.orders.map(
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
      orders: updatedOrders,
    };

    saveStore(updatedStore);
    setStore(updatedStore);

    const updatedOrder = updatedOrders.find(
      (order) => order.id === orderId
    );

    if (updatedOrder) {
      setSelectedOrder(updatedOrder);
    }
  }

  /* =======================================================
     UPDATE PAYMENT
     
     IMPORTANT:
     Uses the payment type directly from Order.
  ======================================================= */

  function updateOrderPayment(
    orderId: string,
    payment: Order["payment"]
  ) {
    if (!store) return;

    const updatedOrders = store.orders.map(
      (order) =>
        order.id === orderId
          ? {
              ...order,
              payment,
            }
          : order
    );

    const updatedStore = {
      ...store,
      orders: updatedOrders,
    };

    saveStore(updatedStore);
    setStore(updatedStore);

    const updatedOrder = updatedOrders.find(
      (order) => order.id === orderId
    );

    if (updatedOrder) {
      setSelectedOrder(updatedOrder);
    }
  }

  /* =======================================================
     NEXT STATUS
  ======================================================= */

  function moveToNextStatus(order: Order) {
    if (order.status === "Pending") {
      updateOrderStatus(
        order.id,
        "Confirmed"
      );
      return;
    }

    if (order.status === "Confirmed") {
      updateOrderStatus(
        order.id,
        "Packed"
      );
      return;
    }

    if (order.status === "Packed") {
      updateOrderStatus(
        order.id,
        "Out for delivery"
      );
      return;
    }

    if (
      order.status ===
      "Out for delivery"
    ) {
      updateOrderStatus(
        order.id,
        "Delivered"
      );
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading delivery...
        </p>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Order fulfilment
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Delivery
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Track orders, update delivery status and manage payments.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:w-auto">
            <p className="text-xs text-slate-400">
              Active delivery value
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {money(activeDeliveryValue)}
            </p>
          </div>

        </div>

        {/* =================================================
            STATUS CARDS
        ================================================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">

          <DeliveryStat
            label="Pending"
            value={statusCounts.Pending}
            active={filter === "Pending"}
            onClick={() =>
              setFilter(
                filter === "Pending"
                  ? "All"
                  : "Pending"
              )
            }
          />

          <DeliveryStat
            label="Confirmed"
            value={statusCounts.Confirmed}
            active={filter === "Confirmed"}
            onClick={() =>
              setFilter(
                filter === "Confirmed"
                  ? "All"
                  : "Confirmed"
              )
            }
          />

          <DeliveryStat
            label="Packed"
            value={statusCounts.Packed}
            active={filter === "Packed"}
            onClick={() =>
              setFilter(
                filter === "Packed"
                  ? "All"
                  : "Packed"
              )
            }
          />

          <DeliveryStat
            label="Out for delivery"
            value={statusCounts.OutForDelivery}
            active={
              filter === "Out for delivery"
            }
            onClick={() =>
              setFilter(
                filter === "Out for delivery"
                  ? "All"
                  : "Out for delivery"
              )
            }
          />

          <DeliveryStat
            label="Delivered"
            value={statusCounts.Delivered}
            active={filter === "Delivered"}
            onClick={() =>
              setFilter(
                filter === "Delivered"
                  ? "All"
                  : "Delivered"
              )
            }
          />

        </div>

        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">

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
              placeholder="Search order, customer, phone or product..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

          </div>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value as
                  | OrderStatus
                  | "All"
              )
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 outline-none shadow-sm focus:border-blue-500"
          >
            <option value="All">
              All statuses
            </option>

            {DELIVERY_STATUSES.map(
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

        </div>

        {/* =================================================
            RESULTS
        ================================================= */}

        <div className="mt-4 flex items-center justify-between gap-3">

          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredOrders.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {orders.length}
            </span>{" "}
            orders
          </p>

          {(filter !== "All" || search) && (
            <button
              type="button"
              onClick={() => {
                setFilter("All");
                setSearch("");
              }}
              className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}

        </div>

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="mt-3 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead className="border-b border-slate-100 bg-slate-50">

                <tr>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Order
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Items
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Payment
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Delivery
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredOrders.map(
                  (order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-slate-50/70"
                    >

                      {/* ORDER */}

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
                            {order.id}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {shortDate(
                              order.date
                            )}
                          </p>
                        </button>

                      </td>

                      {/* CUSTOMER */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-semibold text-slate-800">
                          {order.customer}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {order.phone}
                        </p>

                      </td>

                      {/* ITEMS */}

                      <td className="max-w-[280px] px-5 py-4">

                        <p className="truncate text-sm text-slate-600">
                          {order.items
                            .map(
                              (item) =>
                                `${item.name} × ${item.qty}`
                            )
                            .join(", ")}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {order.items.length}{" "}
                          product
                          {order.items.length ===
                          1
                            ? ""
                            : "s"}
                        </p>

                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-bold text-slate-900">
                          {money(
                            order.total
                          )}
                        </p>

                      </td>

                      {/* PAYMENT */}

                      <td className="px-5 py-4">

                        <PaymentBadge
                          payment={
                            order.payment
                          }
                        />

                      </td>

                      {/* DELIVERY */}

                      <td className="px-5 py-4">

                        <StatusBadge
                          status={
                            order.status
                          }
                        />

                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Manage
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

          {filteredOrders.length === 0 && (
            <EmptyDelivery
              search={search}
              onClear={() => {
                setSearch("");
                setFilter("All");
              }}
            />
          )}

        </div>

        {/* =================================================
            MOBILE CARDS
        ================================================= */}

        <div className="mt-3 space-y-3 md:hidden">

          {filteredOrders.map(
            (order) => (
              <button
                key={order.id}
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    order
                  )
                }
                className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-sm font-bold text-slate-900">
                      {order.id}
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

                <div className="mt-4">

                  <p className="text-sm font-semibold text-slate-800">
                    {order.customer}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {order.phone}
                  </p>

                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                  {order.items
                    .map(
                      (item) =>
                        `${item.name} × ${item.qty}`
                    )
                    .join(", ")}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  <StatusBadge
                    status={
                      order.status
                    }
                  />

                  <PaymentBadge
                    payment={
                      order.payment
                    }
                  />

                </div>

              </button>
            )
          )}

          {filteredOrders.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <EmptyDelivery
                search={search}
                onClear={() => {
                  setSearch("");
                  setFilter("All");
                }}
              />
            </div>
          )}

        </div>

      </div>

      {/* =================================================
          ORDER DRAWER
      ================================================= */}

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() =>
            setSelectedOrder(null)
          }
          onStatusChange={(status) =>
            updateOrderStatus(
              selectedOrder.id,
              status
            )
          }
          onPaymentChange={(payment) =>
            updateOrderPayment(
              selectedOrder.id,
              payment
            )
          }
          onNext={() =>
            moveToNextStatus(
              selectedOrder
            )
          }
        />
      )}

    </main>
  );
}

/* ============================================================
   DELIVERY STAT
============================================================ */

function DeliveryStat({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-2xl border p-4 text-left shadow-sm transition sm:p-5 ${
        active
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >

      <p
        className={`truncate text-xs font-medium sm:text-sm ${
          active
            ? "text-blue-600"
            : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold sm:text-2xl ${
          active
            ? "text-blue-950"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

    </button>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  let className =
    "border-slate-200 bg-slate-50 text-slate-600";

  if (status === "Pending") {
    className =
      "border-amber-200 bg-amber-50 text-amber-700";
  } else if (status === "Confirmed") {
    className =
      "border-blue-200 bg-blue-50 text-blue-700";
  } else if (status === "Packed") {
    className =
      "border-violet-200 bg-violet-50 text-violet-700";
  } else if (
    status === "Out for delivery"
  ) {
    className =
      "border-cyan-200 bg-cyan-50 text-cyan-700";
  } else if (status === "Delivered") {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (status === "Cancelled") {
    className =
      "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      <span className="truncate">
        {status}
      </span>
    </span>
  );
}

/* ============================================================
   PAYMENT BADGE

   NO paymentClasses.
   NO Record.
   NO paymentClasses[payment].

   This avoids the red-line problem completely.
============================================================ */

function PaymentBadge({
  payment,
}: {
  payment: Order["payment"];
}) {
  let className =
    "border-slate-200 bg-slate-50 text-slate-600";

  if (payment === "Paid") {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (payment === "COD") {
    className =
      "border-amber-200 bg-amber-50 text-amber-700";
  } else if (payment === "Refunded") {
    className =
      "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {payment}
    </span>
  );
}

/* ============================================================
   ORDER DRAWER
============================================================ */

function OrderDrawer({
  order,
  onClose,
  onStatusChange,
  onPaymentChange,
  onNext,
}: {
  order: Order;
  onClose: () => void;

  onStatusChange: (
    status: OrderStatus
  ) => void;

  onPaymentChange: (
    payment: Order["payment"]
  ) => void;

  onNext: () => void;
}) {
  const hasNextStatus =
    order.status === "Pending" ||
    order.status === "Confirmed" ||
    order.status === "Packed" ||
    order.status === "Out for delivery";

  let nextStatus: OrderStatus | null =
    null;

  if (order.status === "Pending") {
    nextStatus = "Confirmed";
  } else if (
    order.status === "Confirmed"
  ) {
    nextStatus = "Packed";
  } else if (
    order.status === "Packed"
  ) {
    nextStatus = "Out for delivery";
  } else if (
    order.status === "Out for delivery"
  ) {
    nextStatus = "Delivered";
  }

  return (
    <div className="fixed inset-0 z-50">

      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close order"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
      />

      {/* DRAWER */}

      <div className="absolute inset-y-0 right-0 flex w-full max-w-[540px] flex-col overflow-hidden bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">

          <div className="min-w-0">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Delivery order
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-500 hover:bg-slate-200"
          >
            ×
          </button>

        </div>

        {/* BODY */}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">

          {/* CUSTOMER */}

          <section>

            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Customer
            </h3>

            <div className="mt-3 rounded-2xl border border-slate-200 p-4">

              <p className="text-base font-bold text-slate-900">
                {order.customer}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {order.phone}
              </p>

            </div>

          </section>

          {/* DELIVERY STATUS */}

          <section className="mt-6">

            <div className="flex items-center justify-between gap-3">

              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Delivery status
              </h3>

              <StatusBadge
                status={
                  order.status
                }
              />

            </div>

            <div className="mt-4 space-y-2">

              {DELIVERY_STATUSES.map(
                (status) => {
                  const current =
                    status ===
                    order.status;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        onStatusChange(
                          status
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                        current
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >

                      <span
                        className={`text-sm font-semibold ${
                          current
                            ? "text-blue-700"
                            : "text-slate-700"
                        }`}
                      >
                        {status}
                      </span>

                      {current && (
                        <span className="text-xs font-bold text-blue-600">
                          Current
                        </span>
                      )}

                    </button>
                  );
                }
              )}

            </div>

          </section>

          {/* NEXT STATUS */}

          {hasNextStatus &&
            nextStatus && (
              <section className="mt-5">

                <button
                  type="button"
                  onClick={onNext}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Move to {nextStatus}
                </button>

              </section>
            )}

          {/* ORDER ITEMS */}

          <section className="mt-6">

            <div className="flex items-center justify-between">

              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Order items
              </h3>

              <span className="text-xs text-slate-400">
                {order.items.length}{" "}
                product
                {order.items.length ===
                1
                  ? ""
                  : "s"}
              </span>

            </div>

            <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200">

              {order.items.map(
                (item) => (
                  <div
                    key={
                      item.productId
                    }
                    className="flex items-start justify-between gap-4 p-4"
                  >

                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-slate-800">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Qty {item.qty} ×{" "}
                        {money(
                          item.price
                        )}
                      </p>

                    </div>

                    <p className="shrink-0 text-sm font-bold text-slate-900">
                      {money(
                        item.price *
                          item.qty
                      )}
                    </p>

                  </div>
                )
              )}

            </div>

          </section>

          {/* PAYMENT */}

          <section className="mt-6">

            <div className="flex items-center justify-between gap-3">

              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Payment
              </h3>

              <PaymentBadge
                payment={
                  order.payment
                }
              />

            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 p-4">

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-slate-500">
                  Order total
                </span>

                <span className="text-lg font-bold text-slate-900">
                  {money(
                    order.total
                  )}
                </span>

              </div>

            </div>

          </section>

          {/* =================================================
              PAYMENT UPDATE
          ================================================= */}

          <section className="mt-6">

            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Update payment
            </h3>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">

              {/* PAID */}

              <button
                type="button"
                onClick={() =>
                  onPaymentChange(
                    "Paid"
                  )
                }
                className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                  order.payment ===
                  "Paid"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Paid

                {order.payment ===
                  "Paid" && (
                  <span className="ml-1">
                    ✓
                  </span>
                )}
              </button>

              {/* COD */}

              <button
                type="button"
                onClick={() =>
                  onPaymentChange(
                    "COD"
                  )
                }
                className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                  order.payment ===
                  "COD"
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                COD

                {order.payment ===
                  "COD" && (
                  <span className="ml-1">
                    ✓
                  </span>
                )}
              </button>

              {/* REFUNDED */}

              <button
                type="button"
                onClick={() =>
                  onPaymentChange(
                    "Refunded"
                  )
                }
                className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                  order.payment ===
                  "Refunded"
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Refunded

                {order.payment ===
                  "Refunded" && (
                  <span className="ml-1">
                    ✓
                  </span>
                )}
              </button>

            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Payment changes are saved immediately.
            </p>

          </section>

        </div>

        {/* FOOTER */}

        <div className="border-t border-slate-100 bg-white p-4 sm:p-5">

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyDelivery({
  search,
  onClear,
}: {
  search: string;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        🚚
      </div>

      <h2 className="mt-4 text-base font-bold text-slate-900">
        No delivery orders found
      </h2>

      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
        {search
          ? "Try a different search or clear the filters."
          : "Delivery orders will appear here when orders are created."}
      </p>

      {search && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Clear filters
        </button>
      )}

    </div>
  );
}