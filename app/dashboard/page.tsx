"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getStore,
  money,
  shortDate,
  statusClasses,
} from "@/lib/sellora-data";

export default function DashboardPage() {
  const [store, setStore] = useState<any>(null);

  const loadStore = () => {
    setStore(getStore());
  };

  useEffect(() => {
    loadStore();

    window.addEventListener(
      "sellora-store-updated",
      loadStore
    );

    return () => {
      window.removeEventListener(
        "sellora-store-updated",
        loadStore
      );
    };
  }, []);

  const stats = useMemo(() => {
    if (!store) return null;

    const validOrders = store.orders.filter(
      (order: any) =>
        order.status !== "Cancelled" &&
        order.payment !== "Refunded"
    );

    const revenue = validOrders.reduce(
      (sum: number, order: any) =>
        sum + order.total,
      0
    );

    const delivered = store.orders.filter(
      (order: any) =>
        order.status === "Delivered"
    ).length;

    const pending = store.orders.filter(
      (order: any) =>
        [
          "Pending",
          "Confirmed",
          "Packed",
          "Out for delivery",
        ].includes(order.status)
    ).length;

    const averageOrderValue =
      validOrders.length > 0
        ? Math.round(
            revenue / validOrders.length
          )
        : 0;

    return {
      revenue,
      orders: validOrders.length,
      customers: store.customers.length,
      delivered,
      pending,
      averageOrderValue,
    };
  }, [store]);

  if (!store || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">
          Loading dashboard...
        </div>
      </div>
    );
  }

  const recentOrders = store.orders.slice(0, 6);

  const salesData = [
    {
      date: "09 Aug",
      value: 6400,
    },
    {
      date: "10 Aug",
      value: 8200,
    },
    {
      date: "11 Aug",
      value: 10400,
    },
    {
      date: "12 Aug",
      value: 7600,
    },
    {
      date: "13 Aug",
      value: 11800,
    },
    {
      date: "14 Aug",
      value: 5092,
    },
  ];

  const maxSales = Math.max(
    ...salesData.map((item) => item.value)
  );

  const topProducts = [...store.products]
    .sort(
      (a: any, b: any) =>
        b.sold - a.sold
    )
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Overview
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Good morning 👋
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Welcome back to{" "}
              <span className="font-medium text-slate-700">
                {store.store.name}
              </span>
            </p>
          </div>

          <Link
            href="/dashboard/orders"
            className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + New order
          </Link>
        </div>

        {/* STAT CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Revenue */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total revenue
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {money(stats.revenue)}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  From active orders
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                ₹
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Orders
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {stats.orders}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {stats.pending} currently active
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                #
              </div>
            </div>
          </div>

          {/* Customers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Customers
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {stats.customers}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Total customers
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                ◎
              </div>
            </div>
          </div>

          {/* AOV */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Avg. order value
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {money(stats.averageOrderValue)}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Per active order
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                ↗
              </div>
            </div>
          </div>
        </div>

        {/* SALES + PRODUCTS */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">

          {/* SALES */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Sales overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Revenue for the last 6 days
                </p>
              </div>

              <Link
                href="/dashboard/sales"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View sales →
              </Link>
            </div>

            <div className="flex h-64 items-end gap-3">

              {salesData.map((item) => {

                const height =
                  (item.value /
                    maxSales) *
                  100;

                return (
                  <div
                    key={item.date}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >

                    <div className="text-[10px] font-medium text-slate-400">
                      ₹
                      {(
                        item.value /
                        1000
                      ).toFixed(1)}
                      k
                    </div>

                    <div
                      className="w-full max-w-12 rounded-t-lg bg-blue-600 transition hover:bg-blue-700"
                      style={{
                        height: `${Math.max(
                          8,
                          height
                        )}%`,
                      }}
                      title={money(
                        item.value
                      )}
                    />

                    <span className="text-[11px] text-slate-400">
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* TOP PRODUCTS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Top products
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Best selling products
                </p>
              </div>

              <Link
                href="/dashboard/products"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Products →
              </Link>
            </div>

            <div className="space-y-5">

              {topProducts.map(
                (product: any, index: number) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3"
                  >

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                      #{index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {product.sold} sold ·{" "}
                        {product.stock} in stock
                      </p>
                    </div>

                    <div className="text-sm font-bold text-slate-800">
                      {money(
                        product.price
                      )}
                    </div>
                  </div>
                )
              )}

            </div>
          </section>
        </div>

        {/* QUICK STATUS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Pending / Active
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {stats.pending}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Orders still being processed
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Delivered
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {stats.delivered}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Successfully delivered
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Inventory
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {store.products.reduce(
                (sum: number, product: any) =>
                  sum + product.stock,
                0
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Total units in stock
            </p>
          </div>

        </div>

        {/* RECENT ORDERS */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 p-6">

            <div>
              <h2 className="font-bold text-slate-900">
                Recent orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest customer orders
              </p>
            </div>

            <Link
              href="/dashboard/orders"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[760px] text-left text-sm">

              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-4">
                    Order
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>

                {recentOrders.map(
                  (order: any) => (
                    <tr
                      key={order.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 font-bold text-slate-800">
                        {order.id}
                      </td>

                      <td>
                        <div className="font-medium text-slate-800">
                          {order.customer}
                        </div>

                        <div className="mt-0.5 text-xs text-slate-400">
                          {order.phone}
                        </div>
                      </td>

                      <td className="text-slate-500">
                        {shortDate(
                          order.date
                        )}
                      </td>

                      <td className="font-semibold text-slate-800">
                        {money(
                          order.total
                        )}
                      </td>

                      <td>

                       <span
  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
    statusClasses[
      String(order.status) as keyof typeof statusClasses
    ] || "bg-slate-100 text-slate-600"
  }`}
>
  {order.status}
</span>

                      </td>

                    </tr>
                  )
                )}

              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}