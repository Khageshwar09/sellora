"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getStore,
  money,
  shortDate,
  type Order,
} from "@/lib/sellora-data";

type PaymentFilter =
  | "All"
  | "Paid"
  | "COD"
  | "Refunded";

type StatusFilter =
  | "All"
  | Order["status"];

type SalesRange =
  | "Today"
  | "7 Days"
  | "30 Days"
  | "All Time";

/* =========================================================
   SALES PAGE
========================================================= */

export default function SalesPage() {
  const [store, setStore] =
    useState<ReturnType<typeof getStore> | null>(null);

  const [search, setSearch] =
    useState("");

  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>("All");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [salesRange, setSalesRange] =
    useState<SalesRange>("7 Days");

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
     TODAY KEY
  ======================================================= */

  const todayKey = useMemo(() => {
    const date = new Date();

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  /* =======================================================
     RANGE START DATE
  ======================================================= */

  const rangeStartDate = useMemo(() => {
    const date = new Date();

    date.setHours(
      0,
      0,
      0,
      0
    );

    if (
      salesRange === "Today"
    ) {
      return date;
    }

    if (
      salesRange === "7 Days"
    ) {
      date.setDate(
        date.getDate() - 6
      );

      return date;
    }

    if (
      salesRange === "30 Days"
    ) {
      date.setDate(
        date.getDate() - 29
      );

      return date;
    }

    return null;
  }, [salesRange]);

  /* =======================================================
     ORDERS FOR SELECTED SALES PERIOD
  ======================================================= */

  const periodOrders = useMemo(() => {
    if (
      salesRange === "All Time"
    ) {
      return orders;
    }

    return orders.filter(
      (order) => {
        const orderDate =
          new Date(
            `${order.date}T00:00:00`
          );

        orderDate.setHours(
          0,
          0,
          0,
          0
        );

        if (
          !rangeStartDate
        ) {
          return true;
        }

        if (
          salesRange === "Today"
        ) {
          return (
            order.date ===
            todayKey
          );
        }

        return (
          orderDate.getTime() >=
            rangeStartDate.getTime() &&
          orderDate.getTime() <=
            new Date(
              `${todayKey}T23:59:59`
            ).getTime()
        );
      }
    );
  }, [
    orders,
    salesRange,
    rangeStartDate,
    todayKey,
  ]);

  /* =======================================================
     SUCCESSFUL PERIOD ORDERS
  ======================================================= */

  const successfulPeriodOrders =
    useMemo(() => {
      return periodOrders.filter(
        (order) =>
          order.status !==
            "Cancelled" &&
          order.payment !==
            "Refunded"
      );
    }, [periodOrders]);

  /* =======================================================
     PERIOD TOTAL SALES
  ======================================================= */

  const totalSales = useMemo(() => {
    return successfulPeriodOrders.reduce(
      (sum, order) =>
        sum + order.total,
      0
    );
  }, [
    successfulPeriodOrders,
  ]);

  /* =======================================================
     PERIOD PAID SALES
  ======================================================= */

  const paidSales = useMemo(() => {
    return periodOrders
      .filter(
        (order) =>
          order.payment ===
          "Paid"
      )
      .reduce(
        (sum, order) =>
          sum + order.total,
        0
      );
  }, [periodOrders]);

  /* =======================================================
     PERIOD COD SALES
  ======================================================= */

  const codSales = useMemo(() => {
    return periodOrders
      .filter(
        (order) =>
          order.payment ===
          "COD"
      )
      .reduce(
        (sum, order) =>
          sum + order.total,
        0
      );
  }, [periodOrders]);

  /* =======================================================
     PERIOD REFUNDED SALES
  ======================================================= */

  const refundedSales =
    useMemo(() => {
      return periodOrders
        .filter(
          (order) =>
            order.payment ===
            "Refunded"
        )
        .reduce(
          (sum, order) =>
            sum + order.total,
          0
        );
    }, [periodOrders]);

  /* =======================================================
     PERIOD ORDERS
  ======================================================= */

  const totalOrders =
    successfulPeriodOrders.length;

  /* =======================================================
     AVERAGE ORDER VALUE
  ======================================================= */

  const averageOrderValue =
    totalOrders > 0
      ? totalSales /
        totalOrders
      : 0;

  /* =======================================================
     FILTERED ORDERS TABLE

     Table continues to show all orders.
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const query =
      search
        .trim()
        .toLowerCase();

    return orders
      .filter((order) => {
        const itemText =
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
          itemText.includes(
            query
          );

        const matchesPayment =
          paymentFilter ===
            "All" ||
          order.payment ===
            paymentFilter;

        const matchesStatus =
          statusFilter ===
            "All" ||
          order.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesPayment &&
          matchesStatus
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
    paymentFilter,
    statusFilter,
  ]);

  /* =======================================================
     TOP PRODUCTS FOR SELECTED PERIOD
  ======================================================= */

  const topProducts =
    useMemo(() => {
      const productMap =
        new Map<
          string,
          {
            name: string;
            qty: number;
            revenue: number;
          }
        >();

      successfulPeriodOrders.forEach(
        (order) => {
          order.items.forEach(
            (item) => {
              const existing =
                productMap.get(
                  item.productId
                );

              if (existing) {
                existing.qty +=
                  item.qty;

                existing.revenue +=
                  item.price *
                  item.qty;
              } else {
                productMap.set(
                  item.productId,
                  {
                    name:
                      item.name,
                    qty:
                      item.qty,
                    revenue:
                      item.price *
                      item.qty,
                  }
                );
              }
            }
          );
        }
      );

      return Array.from(
        productMap.values()
      )
        .sort(
          (a, b) =>
            b.revenue -
            a.revenue
        )
        .slice(0, 5);
    }, [
      successfulPeriodOrders,
    ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (!store) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading sales...
        </p>
      </main>
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
              Store performance
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Sales
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track your store revenue and order performance.
            </p>

          </div>

          <div className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:w-auto">

            <p className="text-xs text-slate-400">
              Average order value
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {money(
                averageOrderValue
              )}
            </p>

          </div>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <SalesStat
            label="Total sales"
            value={money(
              totalSales
            )}
            description={`${totalOrders} successful orders`}
          />

          <SalesStat
            label="Paid sales"
            value={money(
              paidSales
            )}
            description="Payments received"
          />

          <SalesStat
            label="COD sales"
            value={money(
              codSales
            )}
            description="Cash on delivery"
          />

          <SalesStat
            label="Refunded"
            value={money(
              refundedSales
            )}
            description="Refunded order value"
          />

        </div>

        {/* =================================================
            SALES OVERVIEW
        ================================================= */}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* HEADER */}

          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h2 className="text-sm font-bold text-slate-900">
                Sales overview
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Revenue distribution for the selected period.
              </p>

            </div>

            {/* =================================================
                PERIOD BUTTONS
            ================================================= */}

            <div className="flex w-full overflow-x-auto rounded-xl bg-slate-100 p-1 lg:w-auto">

              <RangeButton
                active={
                  salesRange ===
                  "Today"
                }
                onClick={() =>
                  setSalesRange(
                    "Today"
                  )
                }
              >
                Today
              </RangeButton>

              <RangeButton
                active={
                  salesRange ===
                  "7 Days"
                }
                onClick={() =>
                  setSalesRange(
                    "7 Days"
                  )
                }
              >
                7 Days
              </RangeButton>

              <RangeButton
                active={
                  salesRange ===
                  "30 Days"
                }
                onClick={() =>
                  setSalesRange(
                    "30 Days"
                  )
                }
              >
                30 Days
              </RangeButton>

              <RangeButton
                active={
                  salesRange ===
                  "All Time"
                }
                onClick={() =>
                  setSalesRange(
                    "All Time"
                  )
                }
              >
                All Time
              </RangeButton>

            </div>

          </div>

          {/* =================================================
              CIRCLE GRAPH
          ================================================= */}

          <div className="px-5 py-6 sm:px-6">

            <PaymentCircle
              paid={paidSales}
              cod={codSales}
              refunded={
                refundedSales
              }
              total={totalSales}
            />

          </div>

        </section>

        {/* =================================================
            TOP PRODUCTS + SUMMARY
        ================================================= */}

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">

          {/* TOP PRODUCTS */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-4">

              <h2 className="text-sm font-bold text-slate-900">
                Top products
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Highest revenue products for{" "}
                {salesRange.toLowerCase()}.
              </p>

            </div>

            {topProducts.length >
            0 ? (
              <div className="divide-y divide-slate-100">

                {topProducts.map(
                  (
                    product,
                    index
                  ) => (
                    <div
                      key={
                        product.name
                      }
                      className="flex items-center gap-4 px-5 py-4"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                        {index +
                          1}
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-semibold text-slate-800">
                          {
                            product.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            product.qty
                          }{" "}
                          units sold
                        </p>

                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-900">
                        {money(
                          product.revenue
                        )}
                      </p>

                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="px-5 py-12 text-center text-sm text-slate-400">
                No product sales for this period.
              </div>
            )}

          </section>

          {/* SUMMARY */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-sm font-bold text-slate-900">
                  Sales summary
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {salesRange}
                </p>

              </div>

            </div>

            <div className="mt-5 space-y-4">

              <SummaryRow
                label="Successful orders"
                value={String(
                  totalOrders
                )}
              />

              <SummaryRow
                label="Paid orders"
                value={String(
                  periodOrders.filter(
                    (order) =>
                      order.payment ===
                      "Paid"
                  ).length
                )}
              />

              <SummaryRow
                label="COD orders"
                value={String(
                  periodOrders.filter(
                    (order) =>
                      order.payment ===
                      "COD"
                  ).length
                )}
              />

              <SummaryRow
                label="Refunded orders"
                value={String(
                  periodOrders.filter(
                    (order) =>
                      order.payment ===
                      "Refunded"
                  ).length
                )}
              />

              <SummaryRow
                label="Cancelled orders"
                value={String(
                  periodOrders.filter(
                    (order) =>
                      order.status ===
                      "Cancelled"
                  ).length
                )}
              />

              <div className="border-t border-slate-100 pt-4">

                <p className="text-xs text-slate-400">
                  Period sales
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {money(
                    totalSales
                  )}
                </p>

              </div>

            </div>

          </section>

        </div>

        {/* =================================================
            SEARCH + FILTERS
        ================================================= */}

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_210px]">

          <div className="relative">

            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event
                    .target
                    .value
                )
              }
              placeholder="Search order, customer, phone or product..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

          </div>

          <select
            value={
              paymentFilter
            }
            onChange={(
              event
            ) =>
              setPaymentFilter(
                event
                  .target
                  .value as PaymentFilter
              )
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 outline-none shadow-sm focus:border-blue-500"
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

          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event
                  .target
                  .value as StatusFilter
              )
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 outline-none shadow-sm focus:border-blue-500"
          >

            <option value="All">
              All statuses
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Confirmed">
              Confirmed
            </option>

            <option value="Packed">
              Packed
            </option>

            <option value="Out for delivery">
              Out for delivery
            </option>

            <option value="Delivered">
              Delivered
            </option>

            <option value="Cancelled">
              Cancelled
            </option>

          </select>

        </div>

        {/* =================================================
            RESULT COUNT
        ================================================= */}

        <div className="mt-4 flex items-center justify-between gap-3">

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
            paymentFilter !==
              "All" ||
            statusFilter !==
              "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPaymentFilter(
                  "All"
                );
                setStatusFilter(
                  "All"
                );
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
                    Products
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Payment
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
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
                      key={
                        order.id
                      }
                      className="transition hover:bg-slate-50/70"
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
                              (
                                item
                              ) =>
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

          </div>

          {filteredOrders.length ===
            0 && (
            <EmptySales
              onClear={() => {
                setSearch("");
                setPaymentFilter(
                  "All"
                );
                setStatusFilter(
                  "All"
                );
              }}
            />
          )}

        </div>

        {/* =================================================
            MOBILE ORDERS
        ================================================= */}

        <div className="mt-3 space-y-3 md:hidden">

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
                className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
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

                <p className="mt-3 line-clamp-2 text-xs text-slate-500">
                  {order.items
                    .map(
                      (
                        item
                      ) =>
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

              <EmptySales
                onClear={() => {
                  setSearch("");
                  setPaymentFilter(
                    "All"
                  );
                  setStatusFilter(
                    "All"
                  );
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
        <SalesOrderDrawer
          order={
            selectedOrder
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

/* ============================================================
   SALES STAT
============================================================ */

function SalesStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

/* ============================================================
   RANGE BUTTON
============================================================ */

function RangeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   CIRCULAR SALES GRAPH
============================================================ */

function PaymentCircle({
  paid,
  cod,
  refunded,
  total,
}: {
  paid: number;
  cod: number;
  refunded: number;
  total: number;
}) {
  /*
    IMPORTANT:
    The circle is permanently 220px x 220px.
    Changing Today / 7 Days / 30 Days / All Time
    only changes the data inside it.
  */

  const paidPercent =
    total > 0
      ? (paid / total) * 100
      : 0;

  const codPercent =
    total > 0
      ? (cod / total) * 100
      : 0;

  const refundedPercent =
    total > 0
      ? (refunded / total) * 100
      : 0;

  const paidEnd =
    paidPercent;

  const codEnd =
    paidPercent +
    codPercent;

  const background =
    total > 0
      ? `conic-gradient(
          #2563eb 0% ${paidEnd}%,
          #f59e0b ${paidEnd}% ${codEnd}%,
          #ef4444 ${codEnd}% 100%
        )`
      : "#e2e8f0";

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-8 md:flex-row md:gap-14">

      {/* =================================================
          FIXED CIRCLE
      ================================================= */}

      <div
        className="relative h-[220px] w-[220px] shrink-0 rounded-full"
        style={{
          background,
        }}
      >

        {/* INNER CIRCLE */}

        <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-white">

          <p className="text-xs font-medium text-slate-400">
            Total sales
          </p>

          <p className="mt-1 max-w-[150px] truncate text-center text-2xl font-bold tracking-tight text-slate-900">
            {money(
              total
            )}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {total > 0
              ? "Selected period"
              : "No sales yet"}
          </p>

        </div>

      </div>

      {/* =================================================
          LEGEND
      ================================================= */}

      <div className="w-full max-w-[360px] space-y-4">

        <PaymentLegend
          label="Paid"
          value={paid}
          percentage={
            paidPercent
          }
          dotClass="bg-blue-600"
        />

        <PaymentLegend
          label="COD"
          value={cod}
          percentage={
            codPercent
          }
          dotClass="bg-amber-500"
        />

        <PaymentLegend
          label="Refunded"
          value={
            refunded
          }
          percentage={
            refundedPercent
          }
          dotClass="bg-red-500"
        />

        <div className="border-t border-slate-100 pt-4">

          <div className="flex items-center justify-between">

            <span className="text-xs text-slate-400">
              Total sales
            </span>

            <span className="text-sm font-bold text-slate-900">
              {money(
                total
              )}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   PAYMENT LEGEND
============================================================ */

function PaymentLegend({
  label,
  value,
  percentage,
  dotClass,
}: {
  label: string;
  value: number;
  percentage: number;
  dotClass: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <span
        className={`h-3 w-3 shrink-0 rounded-full ${dotClass}`}
      />

      <div className="min-w-0 flex-1">

        <div className="flex items-center justify-between gap-3">

          <span className="text-sm font-semibold text-slate-700">
            {label}
          </span>

          <span className="text-sm font-bold text-slate-900">
            {money(
              value
            )}
          </span>

        </div>

        <div className="mt-2 flex items-center gap-2">

          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">

            <div
              className={`h-full rounded-full ${dotClass}`}
              style={{
                width: `${Math.min(
                  percentage,
                  100
                )}%`,
              }}
            />

          </div>

          <span className="w-10 text-right text-[11px] font-semibold text-slate-400">
            {percentage.toFixed(
              0
            )}
            %
          </span>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   SUMMARY ROW
============================================================ */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-bold text-slate-900">
        {value}
      </span>

    </div>
  );
}

/* ============================================================
   PAYMENT BADGE

   Direct Order["payment"] type.
   No PaymentStatus.
   No paymentClasses lookup.
============================================================ */

function PaymentBadge({
  payment,
}: {
  payment: Order["payment"];
}) {
  let className =
    "border-slate-200 bg-slate-50 text-slate-600";

  if (
    payment === "Paid"
  ) {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (
    payment === "COD"
  ) {
    className =
      "border-amber-200 bg-amber-50 text-amber-700";
  } else if (
    payment === "Refunded"
  ) {
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
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: Order["status"];
}) {
  let className =
    "border-slate-200 bg-slate-50 text-slate-600";

  if (
    status === "Pending"
  ) {
    className =
      "border-amber-200 bg-amber-50 text-amber-700";
  } else if (
    status === "Confirmed"
  ) {
    className =
      "border-blue-200 bg-blue-50 text-blue-700";
  } else if (
    status === "Packed"
  ) {
    className =
      "border-violet-200 bg-violet-50 text-violet-700";
  } else if (
    status ===
    "Out for delivery"
  ) {
    className =
      "border-cyan-200 bg-cyan-50 text-cyan-700";
  } else if (
    status === "Delivered"
  ) {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (
    status === "Cancelled"
  ) {
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
   EMPTY SALES
============================================================ */

function EmptySales({
  onClear,
}: {
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        ₹
      </div>

      <h2 className="mt-4 text-base font-bold text-slate-900">
        No sales found
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        No orders match your current filters.
      </p>

      <button
        type="button"
        onClick={
          onClear
        }
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Clear filters
      </button>

    </div>
  );
}

/* ============================================================
   SALES ORDER DRAWER
============================================================ */

function SalesOrderDrawer({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">

      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close order"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
      />

      {/* DRAWER */}

      <div className="absolute inset-y-0 right-0 flex w-full max-w-[540px] flex-col overflow-hidden bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">

          <div className="min-w-0">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sales order
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {
                order.id
              }
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {shortDate(
                order.date
              )}
            </p>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-500 hover:bg-slate-200"
          >
            ×
          </button>

        </div>

        {/* BODY */}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">

          {/* CUSTOMER */}

          <section>

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Customer
            </p>

            <div className="mt-3 rounded-2xl border border-slate-200 p-4">

              <p className="text-base font-bold text-slate-900">
                {
                  order.customer
                }
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {
                  order.phone
                }
              </p>

            </div>

          </section>

          {/* PRODUCTS */}

          <section className="mt-6">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Products
            </p>

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

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Payment
              </p>

              <PaymentBadge
                payment={
                  order.payment
                }
              />

            </div>

          </section>

          {/* STATUS */}

          <section className="mt-5">

            <div className="flex items-center justify-between gap-3">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </p>

              <StatusBadge
                status={
                  order.status
                }
              />

            </div>

          </section>

          {/* TOTAL */}

          <div className="mt-6 rounded-2xl bg-slate-900 p-5">

            <div className="flex items-center justify-between gap-4">

              <span className="text-sm text-slate-300">
                Order total
              </span>

              <span className="text-xl font-bold text-white">
                {money(
                  order.total
                )}
              </span>

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="border-t border-slate-100 bg-white p-4">

          <button
            type="button"
            onClick={
              onClose
            }
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}