"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getStore,
  saveStore,
  money,
  type Product,
} from "@/lib/sellora-data";

/* =========================================================
   CATEGORY
   ========================================================= */

/*
  We DO NOT have a fixed category list.

  Whatever the seller enters becomes a category.

  Examples:

  food              -> Food
  FOOD              -> Food
  electronics       -> Electronics
  pet supplies      -> Pet Supplies
  mobile accessories -> Mobile Accessories
  automotive        -> Automotive
*/

function normalizeCategory(value: string) {
  const clean = value
    .trim()
    .replace(/\s+/g, " ");

  if (!clean) {
    return "Other";
  }

  return clean
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (!word) return "";

      return (
        word.charAt(0).toUpperCase() +
        word.slice(1)
      );
    })
    .join(" ");
}

/* =========================================================
   PRODUCTS PAGE
   ========================================================= */

export default function ProductsPage() {
  const [store, setStore] =
    useState<ReturnType<typeof getStore> | null>(
      null
    );

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [showAddProduct, setShowAddProduct] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

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
    const currentStore =
      getStore();

    setStore(
      currentStore
    );
  }

  /* =======================================================
     PRODUCTS
     ======================================================= */

  const products =
    store?.products ?? [];

  /* =======================================================
     REGISTERED CATEGORIES ONLY
     ======================================================= */

  const registeredCategories =
    useMemo(() => {
      const categoryMap =
        new Map<string, string>();

      products.forEach(
        (product) => {
          const category =
            normalizeCategory(
              product.category
            );

          const key =
            category.toLowerCase();

          if (
            !categoryMap.has(
              key
            )
          ) {
            categoryMap.set(
              key,
              category
            );
          }
        }
      );

      return Array.from(
        categoryMap.values()
      ).sort(
        (a, b) =>
          a.localeCompare(b)
      );
    }, [products]);

  /* =======================================================
     FILTER PRODUCTS
     ======================================================= */

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const productCategory =
            normalizeCategory(
              product.category
            );

          const matchesSearch =
            !query ||
            product.name
              .toLowerCase()
              .includes(query) ||
            product.sku
              .toLowerCase()
              .includes(query) ||
            productCategory
              .toLowerCase()
              .includes(query);

          const matchesCategory =
            categoryFilter ===
              "All" ||
            productCategory ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      products,
      search,
      categoryFilter,
    ]);

  /* =======================================================
     ADD PRODUCT
     ======================================================= */

  function handleAddProduct(
    product: Product
  ) {
    if (!store) return;

    const newProduct: Product = {
      ...product,

      category:
        normalizeCategory(
          product.category
        ),
    };

    const updatedStore = {
      ...store,

      products: [
        ...store.products,
        newProduct,
      ],
    };

    saveStore(
      updatedStore
    );

    setStore(
      updatedStore
    );

    setShowAddProduct(
      false
    );
  }

  /* =======================================================
     EDIT PRODUCT
     ======================================================= */

  function handleUpdateProduct(
    product: Product
  ) {
    if (!store) return;

    const updatedProduct: Product =
      {
        ...product,

        category:
          normalizeCategory(
            product.category
          ),
      };

    const updatedStore = {
      ...store,

      products:
        store.products.map(
          (item) =>
            item.id ===
            product.id
              ? updatedProduct
              : item
        ),
    };

    saveStore(
      updatedStore
    );

    setStore(
      updatedStore
    );

    setEditingProduct(
      null
    );
  }

  /* =======================================================
     DELETE PRODUCT
     ======================================================= */

  function handleDeleteProduct(
    productId: string
  ) {
    if (!store) return;

    const product =
      store.products.find(
        (item) =>
          item.id ===
          productId
      );

    if (!product) return;

    const confirmed =
      window.confirm(
        `Delete "${product.name}"?`
      );

    if (!confirmed) {
      return;
    }

    const updatedStore = {
      ...store,

      products:
        store.products.filter(
          (item) =>
            item.id !==
            productId
        ),
    };

    saveStore(
      updatedStore
    );

    setStore(
      updatedStore
    );
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (!store) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading products...
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

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div className="min-w-0">

            <p className="text-sm font-medium text-slate-500">
              Store management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Products
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Manage your products, prices, stock and seller-created categories.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setShowAddProduct(
                true
              )
            }
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
          >
            + Add product
          </button>

        </div>

        {/* =================================================
            CATEGORY INFO
        ================================================= */}

        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              ✓
            </div>

            <div className="min-w-0">

              <p className="text-sm font-bold text-blue-950">
                Your categories are created by you
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                Only categories used by your products appear here. There are no unnecessary default categories.
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="mb-4">

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
              placeholder="Search product, SKU or category..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

          </div>

        </div>

        {/* =================================================
            REGISTERED CATEGORY CHIPS
        ================================================= */}

        {registeredCategories.length >
          0 && (
          <div className="mb-5 flex max-w-full gap-2 overflow-x-auto pb-1">

            <CategoryButton
              active={
                categoryFilter ===
                "All"
              }
              onClick={() =>
                setCategoryFilter(
                  "All"
                )
              }
            >
              All
            </CategoryButton>

            {registeredCategories.map(
              (category) => (
                <CategoryButton
                  key={
                    category
                  }
                  active={
                    categoryFilter ===
                    category
                  }
                  onClick={() =>
                    setCategoryFilter(
                      category
                    )
                  }
                >
                  {category}
                </CategoryButton>
              )
            )}

          </div>
        )}

        {/* =================================================
            RESULT INFO
        ================================================= */}

        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-slate-500">

            Showing{" "}

            <span className="font-semibold text-slate-800">
              {
                filteredProducts.length
              }
            </span>{" "}

            of{" "}

            <span className="font-semibold text-slate-800">
              {products.length}
            </span>{" "}

            products

          </p>

          <p className="text-xs text-slate-400">

            {
              registeredCategories.length
            }{" "}
            registered categor
            {registeredCategories.length ===
            1
              ? "y"
              : "ies"}

          </p>

        </div>

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead className="border-b border-slate-100 bg-slate-50">

                <tr>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Product
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    SKU
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Category
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Price
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Stock
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Sold
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredProducts.map(
                  (product) => (
                    <tr
                      key={
                        product.id
                      }
                      className="transition hover:bg-slate-50/70"
                    >

                      {/* PRODUCT */}

                      <td className="px-5 py-4">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            □
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-bold text-slate-900">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {product.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* SKU */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {product.sku}
                      </td>

                      {/* CATEGORY */}

                      <td className="px-5 py-4">

                        <span className="inline-flex max-w-[220px] rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">

                          <span className="truncate">
                            {normalizeCategory(
                              product.category
                            )}
                          </span>

                        </span>

                      </td>

                      {/* PRICE */}

                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        {money(
                          product.price
                        )}
                      </td>

                      {/* STOCK */}

                      <td className="px-5 py-4">

                        <span
                          className={
                            product.stock <=
                            5
                              ? "text-sm font-semibold text-red-600"
                              : product.stock <=
                                  10
                                ? "text-sm font-semibold text-amber-600"
                                : "text-sm font-semibold text-slate-700"
                          }
                        >
                          {
                            product.stock
                          }
                        </span>

                      </td>

                      {/* SOLD */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {
                          product.sold
                        }
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              setEditingProduct(
                                product
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteProduct(
                                product.id
                              )
                            }
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =================================================
            MOBILE CARDS
        ================================================= */}

        <div className="space-y-3 md:hidden">

          {filteredProducts.map(
            (product) => (
              <div
                key={
                  product.id
                }
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >

                <div className="flex gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    □
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-slate-900">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {product.sku}
                        </p>

                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-900">
                        {money(
                          product.price
                        )}
                      </p>

                    </div>

                    {/* CATEGORY */}

                    <div className="mt-3">

                      <span className="inline-flex max-w-full rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">

                        <span className="truncate">
                          {normalizeCategory(
                            product.category
                          )}
                        </span>

                      </span>

                    </div>

                    {/* STOCK */}

                    <div className="mt-3 flex flex-wrap gap-2">

                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Stock:{" "}
                        {
                          product.stock
                        }
                      </span>

                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Sold:{" "}
                        {
                          product.sold
                        }
                      </span>

                    </div>

                    {/* ACTION */}

                    <div className="mt-4 flex gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          setEditingProduct(
                            product
                          )
                        }
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteProduct(
                            product.id
                          )
                        }
                        className="flex-1 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              </div>
            )
          )}

        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {filteredProducts.length ===
          0 && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">

            <div className="text-3xl">
              📦
            </div>

            <h2 className="mt-3 text-base font-bold text-slate-900">
              No products found
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              {products.length ===
              0
                ? "Add your first product to get started."
                : "Try changing your search or category filter."}
            </p>

            {products.length >
              0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter(
                    "All"
                  );
                }}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Clear filters
              </button>
            )}

          </div>
        )}

      </div>

      {/* =================================================
          ADD MODAL
      ================================================= */}

      {showAddProduct && (
        <ProductModal
          title="Add product"
          onClose={() =>
            setShowAddProduct(
              false
            )
          }
          onSave={
            handleAddProduct
          }
          existingProducts={
            products
          }
        />
      )}

      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {editingProduct && (
        <ProductModal
          title="Edit product"
          product={
            editingProduct
          }
          onClose={() =>
            setEditingProduct(
              null
            )
          }
          onSave={
            handleUpdateProduct
          }
          existingProducts={
            products
          }
        />
      )}

    </main>
  );
}

/* ============================================================
   CATEGORY BUTTON
============================================================ */

function CategoryButton({
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
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   PRODUCT MODAL
============================================================ */

function ProductModal({
  title,
  product,
  onClose,
  onSave,
  existingProducts,
}: {
  title: string;
  product?: Product;
  onClose: () => void;
  onSave: (
    product: Product
  ) => void;
  existingProducts: Product[];
}) {
  const [name, setName] =
    useState(
      product?.name || ""
    );

  const [sku, setSku] =
    useState(
      product?.sku || ""
    );

  const [price, setPrice] =
    useState(
      product?.price?.toString() ||
        ""
    );

  const [stock, setStock] =
    useState(
      product?.stock?.toString() ||
        ""
    );

  const [category, setCategory] =
    useState(
      product?.category || ""
    );

  const [error, setError] =
    useState("");

  /* =======================================================
     SUBMIT
     ======================================================= */

  function handleSubmit() {
    const cleanName =
      name.trim();

    const cleanSku =
      sku.trim();

    const cleanCategory =
      category.trim();

    const numericPrice =
      Number(price);

    const numericStock =
      Number(stock);

    if (!cleanName) {
      setError(
        "Enter the product name."
      );
      return;
    }

    if (!cleanSku) {
      setError(
        "Enter the SKU."
      );
      return;
    }

    if (
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      setError(
        "Enter a valid price."
      );
      return;
    }

    if (
      !Number.isFinite(
        numericStock
      ) ||
      numericStock < 0
    ) {
      setError(
        "Enter valid stock."
      );
      return;
    }

    if (!cleanCategory) {
      setError(
        "Enter a category."
      );
      return;
    }

    /* =====================================================
       DUPLICATE SKU
       ===================================================== */

    const duplicateSku =
      existingProducts.some(
        (item) =>
          item.sku
            .trim()
            .toLowerCase() ===
            cleanSku.toLowerCase() &&
          item.id !==
            product?.id
      );

    if (duplicateSku) {
      setError(
        "This SKU already exists."
      );
      return;
    }

    /* =====================================================
       CREATE PRODUCT
       ===================================================== */

    const newProduct: Product =
      {
        id:
          product?.id ||
          `P${String(
            Date.now()
          ).slice(-6)}`,

        /*
         * PRODUCT NAME IS
         * INDEPENDENT.
         */
        name:
          cleanName,

        sku:
          cleanSku,

        price:
          numericPrice,

        stock:
          numericStock,

        /*
         * Do not reset sold
         * while editing.
         */
        sold:
          product?.sold ??
          0,

        /*
         * CATEGORY IS WHATEVER
         * SELLER REGISTERED.
         */
        category:
          normalizeCategory(
            cleanCategory
          ),

        active:
          product?.active ??
          true,
      };

    onSave(
      newProduct
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">

      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close product form"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />

      {/* MODAL */}

      <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">

          <div className="min-w-0">

            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Add the product information below.
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

        {/* FORM */}

        <div className="space-y-4 p-5">

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* PRODUCT NAME */}

          <InputField
            label="Product name"
            value={name}
            onChange={
              setName
            }
            placeholder="Chicken Biryani"
          />

          {/* SKU */}

          <InputField
            label="SKU"
            value={sku}
            onChange={
              setSku
            }
            placeholder="FOOD-001"
          />

          {/* PRICE / STOCK */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <InputField
              label="Price"
              value={price}
              onChange={
                setPrice
              }
              type="number"
              placeholder="299"
            />

            <InputField
              label="Stock"
              value={stock}
              onChange={
                setStock
              }
              type="number"
              placeholder="50"
            />

          </div>

          {/* CATEGORY */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Category
            </label>

            <input
              type="text"
              value={
                category
              }
              onChange={(event) =>
                setCategory(
                  event.target
                    .value
                )
              }
              placeholder="Food"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

            <div className="mt-2 rounded-xl bg-slate-50 p-3">

              <p className="text-xs font-semibold text-slate-600">
                Enter your own category
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Example: Food, Electronics, Pet Supplies, Automotive, Jewellery, Stationery, or any category you want.
              </p>

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="flex gap-3 border-t border-slate-100 p-5">

          <button
            type="button"
            onClick={
              onClose
            }
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
            {product
              ? "Save product"
              : "Add product"}
          </button>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   INPUT FIELD
============================================================ */

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
            event.target
              .value
          )
        }
        placeholder={
          placeholder
        }
        min={
          type === "number"
            ? "0"
            : undefined
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      />

    </div>
  );
}