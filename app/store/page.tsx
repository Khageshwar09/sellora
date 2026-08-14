"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getStore,
  saveStore,
  money,
  type Product,
  type Order,
} from "@/lib/sellora-data";

type CartItem = {
  product: Product;
  qty: number;
};

type PaymentMethod = "UPI" | "COD";

const STORE_KEY = "sellora-store-v1";

export default function StorePage() {
  const [store, setStore] = useState<
    ReturnType<typeof getStore> | null
  >(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState("All");

  const [cart, setCart] = useState<CartItem[]>(
    []
  );

  const [cartOpen, setCartOpen] =
    useState(false);

  const [checkoutOpen, setCheckoutOpen] =
    useState(false);

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [payment, setPayment] =
    useState<PaymentMethod>("COD");

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

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
    const currentStore = getStore();
    setStore(currentStore);
  }

  /*
   * ONLY ACTIVE PRODUCTS ARE SHOWN
   */

  const products = useMemo(() => {
    if (!store) {
      return [];
    }

    return store.products.filter(
      (product) =>
        product.active &&
        product.stock > 0
    );
  }, [store]);

  /*
   * CATEGORIES COME FROM SELLER'S
   * ACTUAL PRODUCTS.
   */

  const categories = useMemo(() => {
    const unique = new Set<string>();

    products.forEach((product) => {
      if (product.category.trim()) {
        unique.add(
          product.category.trim()
        );
      }
    });

    return [
      "All",
      ...Array.from(unique),
    ];
  }, [products]);

  /*
   * FILTER PRODUCTS
   */

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return products.filter(
      (product) => {
        const matchesSearch =
          !query ||
          product.name
            .toLowerCase()
            .includes(query) ||
          product.sku
            .toLowerCase()
            .includes(query) ||
          product.category
            .toLowerCase()
            .includes(query);

        const matchesCategory =
          category === "All" ||
          product.category ===
            category;

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );
  }, [
    products,
    search,
    category,
  ]);

  /*
   * CART TOTAL
   */

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        item.product.price *
          item.qty,
      0
    );
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.qty,
      0
    );
  }, [cart]);

  /*
   * ADD PRODUCT
   */

  function addToCart(
    product: Product
  ) {
    setError("");
    setSuccess("");

    setCart((current) => {
      const existing =
        current.find(
          (item) =>
            item.product.id ===
            product.id
        );

      if (existing) {
        if (
          existing.qty >=
          product.stock
        ) {
          return current;
        }

        return current.map(
          (item) =>
            item.product.id ===
            product.id
              ? {
                  ...item,
                  qty:
                    item.qty + 1,
                }
              : item
        );
      }

      return [
        ...current,
        {
          product,
          qty: 1,
        },
      ];
    });

    setCartOpen(true);
  }

  /*
   * CHANGE QUANTITY
   */

  function changeQuantity(
    productId: string,
    change: number
  ) {
    setCart((current) =>
      current
        .map((item) => {
          if (
            item.product.id !==
            productId
          ) {
            return item;
          }

          const nextQty =
            item.qty + change;

          if (nextQty <= 0) {
            return null;
          }

          if (
            nextQty >
            item.product.stock
          ) {
            return item;
          }

          return {
            ...item,
            qty: nextQty,
          };
        })
        .filter(
          (
            item
          ): item is CartItem =>
            item !== null
        )
    );
  }

  /*
   * REMOVE ITEM
   */

  function removeFromCart(
    productId: string
  ) {
    setCart((current) =>
      current.filter(
        (item) =>
          item.product.id !==
          productId
      )
    );
  }

  /*
   * OPEN CHECKOUT
   */

  function openCheckout() {
    if (cart.length === 0) {
      return;
    }

    setCartOpen(false);
    setCheckoutOpen(true);
    setError("");
    setSuccess("");
  }

  /*
   * CREATE REAL CUSTOMER + ORDER
   */

  function placeOrder() {
    if (!store) {
      return;
    }

    setError("");
    setSuccess("");

    if (!customerName.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!phone.trim()) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    if (!address.trim()) {
      setError(
        "Please enter your delivery address."
      );
      return;
    }

    if (cart.length === 0) {
      setError(
        "Your cart is empty."
      );
      return;
    }

    setPlacingOrder(true);

    /*
     * Check stock again before creating
     * the order.
     */

    for (const item of cart) {
      const currentProduct =
        store.products.find(
          (product) =>
            product.id ===
            item.product.id
        );

      if (
        !currentProduct ||
        !currentProduct.active ||
        currentProduct.stock <
          item.qty
      ) {
        setError(
          `${item.product.name} is no longer available in the requested quantity.`
        );

        setPlacingOrder(false);
        loadStore();
        return;
      }
    }

    const normalizedPhone =
      phone.replace(
        /\D/g,
        ""
      );

    const existingCustomer =
      store.customers.find(
        (customer) =>
          customer.phone.replace(
            /\D/g,
            ""
          ) ===
          normalizedPhone
      );

    const customerId =
      existingCustomer?.id ||
      createCustomerId(
        store.customers
      );

    const date =
      new Date()
        .toISOString()
        .split("T")[0];

    const newCustomer =
      existingCustomer
        ? {
            ...existingCustomer,
            name:
              customerName.trim(),
            phone:
              phone.trim(),
            orders:
              existingCustomer.orders +
              1,
            spent:
              existingCustomer.spent +
              cartTotal,
          }
        : {
            id: customerId,
            name:
              customerName.trim(),
            phone:
              phone.trim(),
            email: "",
            orders: 1,
            spent: cartTotal,
            joined: date,
          };

    const order: Order = {
      id: createOrderId(
        store.orders
      ),

      customerId,

      customer:
        customerName.trim(),

      phone:
        phone.trim(),

      items: cart.map(
        (item) => ({
          productId:
            item.product.id,

          name:
            item.product.name,

          qty: item.qty,

          price:
            item.product.price,
        })
      ),

      total: cartTotal,

      status:
        payment === "COD"
          ? "Confirmed"
          : "Pending",

      payment:
        payment === "COD"
          ? "COD"
          : "Paid",

      date,
    };

    /*
     * Reduce stock and increase sold
     * using the real products.
     */

    const updatedProducts =
      store.products.map(
        (product) => {
          const cartItem =
            cart.find(
              (item) =>
                item.product.id ===
                product.id
            );

          if (!cartItem) {
            return product;
          }

          return {
            ...product,

            stock:
              product.stock -
              cartItem.qty,

            sold:
              product.sold +
              cartItem.qty,
          };
        }
      );

    const updatedCustomers =
      existingCustomer
        ? store.customers.map(
            (customer) =>
              customer.id ===
              existingCustomer.id
                ? newCustomer
                : customer
          )
        : [
            ...store.customers,
            newCustomer,
          ];

    const updatedStore = {
      ...store,

      products:
        updatedProducts,

      customers:
        updatedCustomers,

      orders: [
        ...store.orders,
        order,
      ],
    };

    saveStore(
      updatedStore
    );

    setStore(
      updatedStore
    );

    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);

    setCustomerName("");
    setPhone("");
    setAddress("");

    setSuccess(
      `Order ${order.id} placed successfully.`
    );

    setPlacingOrder(false);
  }

  /*
   * LOADING
   */

  if (!store) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading store...
        </p>
      </main>
    );
  }

  /*
   * THEME
   * Every accent on this page derives from
   * one seller-controlled color, so the store
   * always feels on-brand regardless of what
   * the seller picks. An optional custom font
   * is respected if the seller has set one.
   */

  const theme = store.store.theme || "#2563eb";
  const themeDark = shadeColor(theme, -28);
  const storeFont = (store.store as any).font as
    | string
    | undefined;

  return (
    <main
      className="min-h-screen bg-[#f7f8fa]"
      style={
        {
          "--store-primary": theme,
          "--store-primary-dark": themeDark,
          fontFamily:
            storeFont ||
            undefined,
        } as React.CSSProperties
      }
    >
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_10px_rgba(15,23,42,0.04)] backdrop-blur supports-[backdrop-filter]:bg-white/85">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          <div className="flex min-w-0 items-center gap-3">

            {store.store.logo ? (
              <img
                src={
                  store.store.logo
                }
                alt={
                  store.store.name
                }
                className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${theme}, var(--store-primary-dark))`,
                }}
              >
                {getInitials(
                  store.store.name
                )}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-800 sm:text-base">
                {store.store.name}
              </h1>

              <p className="hidden text-xs text-slate-400 sm:block">
                Online Store
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setCartOpen(true)
            }
            className="relative flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97]"
          >
            <CartIcon className="h-4 w-4" />

            <span className="hidden sm:inline">
              Cart
            </span>

            {cartCount > 0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
                style={{
                  backgroundColor: theme,
                }}
              >
                {cartCount}
              </span>
            )}
          </button>

        </div>

      </header>

      {/* SUCCESS */}

      {success && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        </div>
      )}

      {/* STORE */}

      <div className="mx-auto max-w-7xl px-4 py-7 pb-24 sm:px-6 sm:py-9 sm:pb-10 lg:px-8">

        {/* STORE INTRO */}

        <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80">

          <div
            className="p-6 sm:p-9"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(
                theme,
                0.08
              )}, ${hexToRgba(
                theme,
                0.02
              )})`,
            }}
          >

            <div className="max-w-2xl">

              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor:
                    hexToRgba(
                      theme,
                      0.12
                    ),
                  color: themeDark,
                }}
              >
                Welcome
              </span>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Shop from{" "}
                {store.store.name}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Browse our available products and place your order directly — no app required.
              </p>

            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme }} />
                {products.length} {products.length === 1 ? "product" : "products"} available
              </div>

              {store.store.phone && (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600">
                  <span>☎</span>
                  {store.store.phone}
                </div>
              )}
            </div>

            {/* SEARCH */}

            <div className="relative mt-6">

              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search products..."
                className="w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--store-primary)] focus:ring-4 focus:ring-[var(--store-primary)]/10"
              />

            </div>

            {/* CATEGORIES */}

            <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">

              {categories.map(
                (item) => {
                  const isActive =
                    category === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setCategory(
                          item
                        )
                      }
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "text-white shadow-sm"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                      style={
                        isActive
                          ? {
                              background: `linear-gradient(135deg, ${theme}, var(--store-primary-dark))`,
                            }
                          : undefined
                      }
                    >
                      {item}
                    </button>
                  );
                }
              )}

            </div>

          </div>

        </section>

        {/* PRODUCTS */}

        <section className="mt-8">

          <div className="mb-5 flex items-end justify-between gap-4">

            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Products
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {filteredProducts.length}{" "}
                {filteredProducts.length ===
                1
                  ? "product"
                  : "products"}{" "}
                available
              </p>
            </div>

          </div>

          {filteredProducts.length ===
          0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                📦
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-800">
                No products found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                There are no active products matching your search or category.
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">

              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                    theme={theme}
                    themeDark={
                      themeDark
                    }
                    qtyInCart={
                      cart.find(
                        (item) =>
                          item
                            .product
                            .id ===
                          product.id
                      )?.qty || 0
                    }
                    onAdd={() =>
                      addToCart(
                        product
                      )
                    }
                  />
                )
              )}

            </div>
          )}

        </section>

      </div>

      {/* MOBILE STICKY CART BAR */}

      {cartCount > 0 &&
        !cartOpen &&
        !checkoutOpen && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur sm:hidden">

            <button
              type="button"
              onClick={() =>
                setCartOpen(true)
              }
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${theme}, var(--store-primary-dark))`,
              }}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-bold">
                  {cartCount}
                </span>
                View cart
              </span>

              <span>
                {money(cartTotal)}
              </span>
            </button>

          </div>
        )}

      {/* CART DRAWER */}

      {cartOpen && (
        <div className="fixed inset-0 z-50">

          <button
            type="button"
            aria-label="Close cart"
            onClick={() =>
              setCartOpen(false)
            }
            className="absolute inset-0 bg-slate-900/40"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-[0_0_50px_rgba(15,23,42,0.18)]">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Your cart
                </h2>

                <p className="text-xs text-slate-400">
                  {cartCount} items
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCartOpen(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <CloseIcon className="h-4 w-4" />
              </button>

            </div>

            <div className="flex-1 overflow-y-auto p-5">

              {cart.length ===
              0 ? (
                <div className="py-16 text-center">

                  <div className="text-4xl">
                    🛒
                  </div>

                  <h3 className="mt-4 font-bold text-slate-800">
                    Your cart is empty
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Add products to continue.
                  </p>

                </div>
              ) : (
                <div className="space-y-4">

                  {cart.map(
                    (item) => (
                      <div
                        key={
                          item
                            .product
                            .id
                        }
                        className="rounded-xl border border-slate-200 p-4"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-800">
                              {
                                item
                                  .product
                                  .name
                              }
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {money(
                                item
                                  .product
                                  .price
                              )}
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item
                                  .product
                                  .id
                              )
                            }
                            className="text-xs font-medium text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>

                        </div>

                        <div className="mt-3 flex items-center justify-between">

                          <div className="flex items-center rounded-lg border border-slate-200">

                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(
                                  item
                                    .product
                                    .id,
                                  -1
                                )
                              }
                              className="px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                            >
                              −
                            </button>

                            <span className="min-w-8 text-center text-sm font-semibold text-slate-700">
                              {
                                item.qty
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(
                                  item
                                    .product
                                    .id,
                                  1
                                )
                              }
                              className="px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                            >
                              +
                            </button>

                          </div>

                          <p className="text-sm font-bold text-slate-800">
                            {money(
                              item
                                .product
                                .price *
                                item.qty
                            )}
                          </p>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {cart.length >
              0 && (
              <div className="border-t border-slate-200 p-5">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Total
                  </span>

                  <span className="text-xl font-bold text-slate-800">
                    {money(
                      cartTotal
                    )}
                  </span>

                </div>

                <button
                  type="button"
                  onClick={
                    openCheckout
                  }
                  className="mt-4 w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${theme}, var(--store-primary-dark))`,
                  }}
                >
                  Continue to checkout
                </button>

              </div>
            )}

          </aside>

        </div>
      )}

      {/* CHECKOUT */}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">

          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:rounded-[24px]">

            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Checkout
                </h2>

                <p className="text-xs text-slate-400">
                  Complete your order
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCheckoutOpen(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <CloseIcon className="h-4 w-4" />
              </button>

            </div>

            <div className="space-y-5 p-5">

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* CUSTOMER */}

              <div>

                <h3 className="text-sm font-bold text-slate-800">
                  Customer details
                </h3>

                <div className="mt-3 space-y-3">

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                      Full name
                    </label>

                    <input
                      value={
                        customerName
                      }
                      onChange={(event) =>
                        setCustomerName(
                          event.target
                            .value
                        )
                      }
                      placeholder="Your name"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--store-primary)] focus:ring-4 focus:ring-[var(--store-primary)]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                      Phone number
                    </label>

                    <input
                      value={
                        phone
                      }
                      onChange={(event) =>
                        setPhone(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 98765 43210"
                      type="tel"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--store-primary)] focus:ring-4 focus:ring-[var(--store-primary)]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                      Delivery address
                    </label>

                    <textarea
                      value={
                        address
                      }
                      onChange={(event) =>
                        setAddress(
                          event.target
                            .value
                        )
                      }
                      placeholder="House number, street, area, city, PIN code"
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--store-primary)] focus:ring-4 focus:ring-[var(--store-primary)]/10"
                    />
                  </div>

                </div>

              </div>

              {/* PAYMENT */}

              <div>

                <h3 className="text-sm font-bold text-slate-800">
                  Payment
                </h3>

                <div className="mt-3 grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setPayment(
                        "COD"
                      )
                    }
                    className="rounded-xl border p-4 text-left transition"
                    style={
                      payment ===
                      "COD"
                        ? {
                            borderColor: theme,
                            backgroundColor:
                              hexToRgba(
                                theme,
                                0.06
                              ),
                          }
                        : {
                            borderColor:
                              "#e2e8f0",
                          }
                    }
                  >
                    <p className="text-sm font-bold text-slate-800">
                      COD
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Pay on delivery
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPayment(
                        "UPI"
                      )
                    }
                    className="rounded-xl border p-4 text-left transition"
                    style={
                      payment ===
                      "UPI"
                        ? {
                            borderColor: theme,
                            backgroundColor:
                              hexToRgba(
                                theme,
                                0.06
                              ),
                          }
                        : {
                            borderColor:
                              "#e2e8f0",
                          }
                    }
                  >
                    <p className="text-sm font-bold text-slate-800">
                      UPI
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Pay online
                    </p>
                  </button>

                </div>

                {payment ===
                  "UPI" && (
                  <div
                    className="mt-3 rounded-xl border p-4"
                    style={{
                      borderColor:
                        hexToRgba(
                          theme,
                          0.25
                        ),
                      backgroundColor:
                        hexToRgba(
                          theme,
                          0.06
                        ),
                    }}
                  >

                    <p
                      className="text-sm font-semibold"
                      style={{
                        color: themeDark,
                      }}
                    >
                      UPI payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your store's configured UPI payment details will be used.
                    </p>

                  </div>
                )}

              </div>

              {/* ORDER */}

              <div className="rounded-xl bg-slate-50 p-4">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Items
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    {cartCount}
                  </span>

                </div>

                <div className="mt-2 flex items-center justify-between">

                  <span className="text-sm font-medium text-slate-600">
                    Total
                  </span>

                  <span className="text-xl font-bold tracking-tight text-slate-900">
                    {money(
                      cartTotal
                    )}
                  </span>

                </div>

              </div>

              <button
                type="button"
                disabled={
                  placingOrder
                }
                onClick={
                  placeOrder
                }
                className="w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${theme}, var(--store-primary-dark))`,
                }}
              >
                {placingOrder
                  ? "Placing order..."
                  : `Place order • ${money(
                      cartTotal
                    )}`}
              </button>

            </div>

          </div>

        </div>
      )}

      <footer className="mx-auto mt-4 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-200/80 pt-6 text-xs text-slate-400 sm:flex-row">
          <span>{store.store.name}</span>
          <span>Powered by Sellora</span>
        </div>
      </footer>

    </main>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  theme,
  themeDark,
  qtyInCart,
  onAdd,
}: {
  product: Product;
  theme: string;
  themeDark: string;
  qtyInCart: number;
  onAdd: () => void;
}) {
  const atMaxStock =
    qtyInCart >= product.stock;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.09)]">

      <div
        className="flex aspect-[1.08/1] items-center justify-center"
        style={{
          backgroundColor:
            hexToRgba(theme, 0.06),
        }}
      >

        <div
          className="flex h-16 w-16 items-center justify-center rounded-[20px] text-xl font-bold text-white shadow-sm transition duration-200 group-hover:scale-105 sm:h-24 sm:w-24 sm:text-3xl"
          style={{
            background: `linear-gradient(135deg, ${theme}, ${themeDark})`,
          }}
        >
          {getInitials(
            product.name
          )}
        </div>

      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">

        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {product.category}
        </p>

        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold text-slate-800">
          {product.name}
        </h3>

        <div className="mt-auto pt-3">

          <div className="flex items-center justify-between gap-2">

            <p className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {money(
                product.price
              )}
            </p>

            <p className="text-[11px] text-slate-400">
              {product.stock} left
            </p>

          </div>

          <button
            type="button"
            onClick={onAdd}
            disabled={
              atMaxStock
            }
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200 hover:brightness-[0.98] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            style={{
              background: `linear-gradient(135deg, ${theme}, ${themeDark})`,
            }}
          >
            {qtyInCart > 0 ? (
              <>In cart · {qtyInCart}</>
            ) : (
              "Add to cart"
            )}
          </button>

        </div>

      </div>

    </article>
  );
}

/* =========================================================
   ICONS
   (inline, dependency-free)
========================================================= */

function CartIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function SearchIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CloseIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/* =========================================================
   COLOR HELPERS
   Every accent color on the page is derived from
   the seller's single theme color using these, so
   the storefront always looks cohesive no matter
   what color the seller picks.
========================================================= */

function hexToRgba(
  hex: string,
  alpha: number
) {
  const clean = hex
    .replace("#", "")
    .trim();

  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const num = parseInt(
    full || "2563eb",
    16
  );

  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shadeColor(
  hex: string,
  percent: number
) {
  const clean = hex
    .replace("#", "")
    .trim();

  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const num = parseInt(
    full || "2563eb",
    16
  );

  let r = (num >> 16) + percent;
  let g =
    ((num >> 8) & 0x00ff) +
    percent;
  let b =
    (num & 0x0000ff) + percent;

  r = Math.min(
    255,
    Math.max(0, r)
  );
  g = Math.min(
    255,
    Math.max(0, g)
  );
  b = Math.min(
    255,
    Math.max(0, b)
  );

  return `#${(
    0x1000000 +
    r * 0x10000 +
    g * 0x100 +
    b
  )
    .toString(16)
    .slice(1)}`;
}

/* =========================================================
   HELPERS
========================================================= */

function getInitials(
  value: string
) {
  const words =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (words.length === 0) {
    return "S";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase();
}

function createCustomerId(
  customers: { id: string }[]
) {
  const numbers =
    customers
      .map((customer) => {
        const match =
          customer.id.match(
            /^C(\d+)$/
          );

        return match
          ? Number(match[1])
          : 0;
      })
      .filter(
        (value) =>
          Number.isFinite(
            value
          )
      );

  const next =
    numbers.length > 0
      ? Math.max(
          ...numbers
        ) + 1
      : 1;

  return `C${String(
    next
  ).padStart(3, "0")}`;
}

function createOrderId(
  orders: { id: string }[]
) {
  const numbers =
    orders
      .map((order) => {
        const match =
          order.id.match(
            /^SO-(\d+)$/
          );

        return match
          ? Number(match[1])
          : 0;
      })
      .filter(
        (value) =>
          Number.isFinite(
            value
          )
      );

  const next =
    numbers.length > 0
      ? Math.max(
          ...numbers
        ) + 1
      : 1001;

  return `SO-${next}`;
}