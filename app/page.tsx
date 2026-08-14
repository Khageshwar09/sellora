"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const THEMES = [
  {
    name: "Indigo",
    primary: "#3730A3",
    secondary: "#6D28D9",
  },
  {
    name: "Blue",
    primary: "#2563EB",
    secondary: "#1D4ED8",
  },
  {
    name: "Green",
    primary: "#059669",
    secondary: "#047857",
  },
  {
    name: "Pink",
    primary: "#DB2777",
    secondary: "#BE185D",
  },
  {
    name: "Orange",
    primary: "#EA580C",
    secondary: "#C2410C",
  },
];

const CATEGORIES = [
  "Fashion & Clothing",
  "Beauty & Cosmetics",
  "Electronics",
  "Food & Restaurant",
  "Jewellery",
  "Home & Lifestyle",
  "Grocery",
  "Services",
  "Other",
];

export default function HomePage() {
  const router = useRouter();

  const [storeName, setStoreName] =
    useState("");

  const [botName, setBotName] =
    useState("");

  const [category, setCategory] =
    useState("Fashion & Clothing");

  const [selectedTheme, setSelectedTheme] =
    useState(THEMES[0]);

  const [logo, setLogo] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =====================================================
     CHECK IF STORE ALREADY EXISTS
  ===================================================== */

  useEffect(() => {
    const existingStore =
      localStorage.getItem(
        "sellora-store"
      );

    if (existingStore) {
      try {
        const store =
          JSON.parse(existingStore);

        if (store.storeName) {
          setStoreName(
            store.storeName
          );
        }

        if (store.botName) {
          setBotName(
            store.botName
          );
        }

        if (store.category) {
          setCategory(
            store.category
          );
        }

        if (store.primaryColor) {
          setSelectedTheme({
            name: "Custom",
            primary:
              store.primaryColor,
            secondary:
              store.secondaryColor ||
              store.primaryColor,
          });
        }

        if (store.logo) {
          setLogo(store.logo);
        }
      } catch {
        // Ignore invalid local storage
      }
    }
  }, []);

  /* =====================================================
     LOGO
  ===================================================== */

  function handleLogo(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setLogo(
        reader.result as string
      );
    };

    reader.readAsDataURL(file);
  }

  /* =====================================================
     INITIALS
  ===================================================== */

  function getInitials(
    name: string
  ) {
    const words =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!words.length) {
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

  const initials =
    getInitials(storeName);

  /* =====================================================
     CREATE STORE
  ===================================================== */

  function handleCreateStore(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (!storeName.trim()) {
      setError(
        "Please enter your store name."
      );
      return;
    }

    if (!botName.trim()) {
      setError(
        "Please enter your WhatsApp bot name."
      );
      return;
    }

    setSaving(true);

    const store = {
      storeName:
        storeName.trim(),

      botName:
        botName.trim(),

      category,

      primaryColor:
        selectedTheme.primary,

      secondaryColor:
        selectedTheme.secondary,

      logo,

      createdAt:
        new Date().toISOString(),

      storeCreated:
        true,
    };

    /* Save store */

    localStorage.setItem(
      "sellora-store",
      JSON.stringify(store)
    );

    /* Also save design */

    localStorage.setItem(
      "sellora-store-design",
      JSON.stringify({
        storeName:
          store.storeName,

        botName:
          store.botName,

        welcomeMessage:
          `👋 Welcome to ${store.storeName}! How can we help you today?`,

        primaryColor:
          store.primaryColor,

        secondaryColor:
          store.secondaryColor,

        font: "Inter",

        logo:
          store.logo,
      })
    );

    /*
      Give the browser a moment to save,
      then open seller dashboard.
    */

    setTimeout(() => {
      router.push(
        "/dashboard"
      );
    }, 500);
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC] text-[#111827]">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="border-b border-[#E7E9F3] bg-white">

        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 sm:px-8">

          {/* LOGO */}

          <div className="flex items-center gap-3">

            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, #3730A3, #6D28D9)",
              }}
            >
              S
            </div>

            <div>

              <p className="text-lg font-bold tracking-tight">
                Sellora
              </p>

              <p className="text-[10px] font-medium uppercase tracking-wider text-[#8A8FB0]">
                WhatsApp Commerce
              </p>

            </div>

          </div>

          <div className="hidden text-sm text-[#6B7280] sm:block">
            Create your store
          </div>

        </div>

      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-5 pb-8 pt-10 sm:px-8 sm:pt-14">

        <div className="max-w-3xl">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E7E9F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#3730A3] shadow-sm">

            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            Build your WhatsApp store

          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">

            Turn your WhatsApp into
            <span className="text-[#3730A3]">
              {" "}a complete store.
            </span>

          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6B7280] sm:text-base">

            Sellora gives sellers a professional storefront,
            product catalogue, orders, payments, sales analytics
            and delivery tracking — all managed from one simple
            seller panel.

          </p>

        </div>

      </section>

      {/* =====================================================
          MAIN BUILDER
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-5 pb-16 sm:px-8">

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">

          {/* =================================================
              SETUP
          ================================================= */}

          <form
            onSubmit={handleCreateStore}
            className="space-y-5"
          >

            {/* STORE DETAILS */}

            <div className="rounded-2xl border border-[#E7E9F3] bg-white p-6 sm:p-7">

              <div className="mb-6">

                <p className="text-xs font-bold uppercase tracking-wider text-[#3730A3]">
                  Step 1
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Create your store
                </h2>

                <p className="mt-1 text-sm text-[#6B7280]">
                  Tell us a little about your business.
                </p>

              </div>

              <div className="space-y-5">

                {/* STORE NAME */}

                <div>

                  <label className="mb-2 block text-xs font-bold">
                    Store Name
                  </label>

                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) =>
                      setStoreName(
                        e.target.value
                      )
                    }
                    placeholder="Example: Kavya Fashion"
                    className="h-12 w-full rounded-xl border border-[#E1E4EE] bg-white px-4 text-sm outline-none transition placeholder:text-[#9CA3AF] focus:border-[#3730A3] focus:ring-4 focus:ring-indigo-50"
                  />

                  <p className="mt-2 text-[11px] text-[#8A8FB0]">
                    This name will appear on your customer store.
                  </p>

                </div>

                {/* CATEGORY */}

                <div>

                  <label className="mb-2 block text-xs font-bold">
                    Business Category
                  </label>

                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-[#E1E4EE] bg-white px-4 text-sm outline-none focus:border-[#3730A3] focus:ring-4 focus:ring-indigo-50"
                  >

                    {CATEGORIES.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* BOT NAME */}

                <div>

                  <label className="mb-2 block text-xs font-bold">
                    WhatsApp Bot Name
                  </label>

                  <input
                    type="text"
                    value={botName}
                    onChange={(e) =>
                      setBotName(
                        e.target.value
                      )
                    }
                    placeholder="Example: Kavya Assistant"
                    className="h-12 w-full rounded-xl border border-[#E1E4EE] bg-white px-4 text-sm outline-none transition placeholder:text-[#9CA3AF] focus:border-[#3730A3] focus:ring-4 focus:ring-indigo-50"
                  />

                  <p className="mt-2 text-[11px] text-[#8A8FB0]">
                    Customers will see this name when they chat with your store.
                  </p>

                </div>

                {/* LOGO */}

                <div>

                  <label className="mb-2 block text-xs font-bold">
                    Store Logo
                  </label>

                  <div className="flex items-center gap-4">

                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold text-white"
                      style={{
                        background:
                          `linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary})`,
                      }}
                    >

                      {logo ? (
                        <img
                          src={logo}
                          alt="Store logo"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}

                    </div>

                    <label className="cursor-pointer rounded-xl border border-[#E1E4EE] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#F7F8FC]">

                      Upload Logo

                      <input
                        type="file"
                        accept="image/*"
                        onChange={
                          handleLogo
                        }
                        className="hidden"
                      />

                    </label>

                  </div>

                  <p className="mt-2 text-[11px] text-[#8A8FB0]">
                    Optional. Use a square PNG or JPG.
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                THEME
            ================================================= */}

            <div className="rounded-2xl border border-[#E7E9F3] bg-white p-6 sm:p-7">

              <div className="mb-6">

                <p className="text-xs font-bold uppercase tracking-wider text-[#3730A3]">
                  Step 2
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Choose your store style
                </h2>

                <p className="mt-1 text-sm text-[#6B7280]">
                  Pick a theme. You can customize everything later.
                </p>

              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">

                {THEMES.map(
                  (theme) => {

                    const active =
                      selectedTheme.name ===
                      theme.name;

                    return (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() =>
                          setSelectedTheme(
                            theme
                          )
                        }
                        className={`rounded-2xl border p-3 text-left transition ${
                          active
                            ? "border-[#3730A3] bg-[#F5F3FF] ring-2 ring-indigo-100"
                            : "border-[#E7E9F3] hover:border-[#C9CCE0]"
                        }`}
                      >

                        <div
                          className="h-16 rounded-xl"
                          style={{
                            background:
                              `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                          }}
                        />

                        <div className="mt-3 flex items-center justify-between">

                          <span className="text-xs font-bold">
                            {theme.name}
                          </span>

                          {active && (
                            <span className="text-[10px] font-bold text-[#3730A3]">
                              Selected
                            </span>
                          )}

                        </div>

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* =================================================
                WHAT SELLORA GIVES THEM
            ================================================= */}

            <div className="rounded-2xl border border-[#E7E9F3] bg-white p-6 sm:p-7">

              <div className="mb-5">

                <h2 className="text-xl font-bold">
                  What you'll get
                </h2>

                <p className="mt-1 text-sm text-[#6B7280]">
                  Everything you need to run your store.
                </p>

              </div>

              <div className="grid gap-3 sm:grid-cols-2">

                {[
                  [
                    "🛍️",
                    "Online Store",
                    "Your own branded customer storefront.",
                  ],
                  [
                    "📱",
                    "WhatsApp Bot",
                    "Customers can browse and order through WhatsApp.",
                  ],
                  [
                    "📦",
                    "Order Management",
                    "Manage every order from your seller panel.",
                  ],
                  [
                    "📊",
                    "Sales Analytics",
                    "See which products are selling and how much you earn.",
                  ],
                  [
                    "🚚",
                    "Delivery Tracking",
                    "Add tracking IDs and update customers automatically.",
                  ],
                  [
                    "🎨",
                    "Custom Branding",
                    "Choose your colors, fonts, logo and store design.",
                  ],
                ].map(
                  ([icon, title, description]) => (

                    <div
                      key={title}
                      className="rounded-xl border border-[#EEF0F8] p-4"
                    >

                      <div className="text-xl">
                        {icon}
                      </div>

                      <p className="mt-3 text-sm font-bold">
                        {title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                        {description}
                      </p>

                    </div>

                  )
                )}

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* CREATE BUTTON */}

            <button
              type="submit"
              disabled={saving}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#3730A3] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating your store...
                </>
              ) : (
                <>
                  Create Store & Open Dashboard
                  <span>→</span>
                </>
              )}

            </button>

            <p className="text-center text-[11px] text-[#8A8FB0]">
              You can change all of these settings later from Store Design.
            </p>

          </form>

          {/* =================================================
              RIGHT SIDE LIVE PREVIEW
          ================================================= */}

          <aside className="xl:sticky xl:top-6">

            <div className="rounded-2xl border border-[#E7E9F3] bg-white p-5 sm:p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-[#3730A3]">
                    Live Preview
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    Your customer store
                  </h2>

                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                  Preview
                </span>

              </div>

              {/* CUSTOMER STORE */}

              <div
                className="overflow-hidden rounded-2xl border border-[#E7E9F3] bg-white"
                style={{
                  fontFamily:
                    "Inter, Arial, sans-serif",
                }}
              >

                {/* STORE HEADER */}

                <div
                  className="p-6 text-white"
                  style={{
                    background:
                      `linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary})`,
                  }}
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/20 text-sm font-bold">

                      {logo ? (
                        <img
                          src={logo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}

                    </div>

                    <div>

                      <p className="text-lg font-bold">
                        {storeName ||
                          "Your Store"}
                      </p>

                      <p className="mt-1 text-xs text-white/75">
                        {category}
                      </p>

                    </div>

                  </div>

                  <p className="mt-5 text-sm font-medium text-white/90">
                    Shop directly from our store.
                  </p>

                </div>

                {/* PRODUCTS */}

                <div className="p-4">

                  <div className="mb-3 flex items-center justify-between">

                    <p className="text-xs font-bold">
                      Featured Products
                    </p>

                    <span className="text-[10px] text-[#8A8FB0]">
                      View all
                    </span>

                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <PreviewProduct
                      name="Premium T-Shirt"
                      price="₹599"
                      color={
                        selectedTheme.primary
                      }
                    />

                    <PreviewProduct
                      name="Classic Jeans"
                      price="₹999"
                      color={
                        selectedTheme.secondary
                      }
                    />

                    <PreviewProduct
                      name="Sneakers"
                      price="₹1,499"
                      color={
                        selectedTheme.primary
                      }
                    />

                    <PreviewProduct
                      name="Hoodie"
                      price="₹899"
                      color={
                        selectedTheme.secondary
                      }
                    />

                  </div>

                </div>

              </div>

              {/* =================================================
                  WHATSAPP PREVIEW
              ================================================= */}

              <div className="mt-6">

                <div className="mb-3">

                  <p className="text-sm font-bold">
                    WhatsApp experience
                  </p>

                  <p className="mt-1 text-[11px] text-[#8A8FB0]">
                    This is what your customer can interact with.
                  </p>

                </div>

                <div className="overflow-hidden rounded-[26px] border-[6px] border-[#202124] bg-[#EFEAE2]">

                  {/* HEADER */}

                  <div
                    className="px-4 py-3 text-white"
                    style={{
                      background:
                        selectedTheme.primary,
                    }}
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/20 text-[10px] font-bold">

                        {logo ? (
                          <img
                            src={logo}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials
                        )}

                      </div>

                      <div>

                        <p className="text-sm font-semibold">
                          {botName ||
                            "Your Assistant"}
                        </p>

                        <p className="text-[10px] text-white/70">
                          Online
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* CHAT */}

                  <div className="min-h-[360px] bg-[#EFEAE2] p-3">

                    <div className="mb-4 flex">

                      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 shadow-sm">

                        <p className="text-[11px] leading-relaxed text-[#374151]">
                          👋 Welcome to{" "}
                          {storeName ||
                            "our store"}
                          ! How can we help you today?
                        </p>

                        <p className="mt-1 text-right text-[8px] text-[#9CA3AF]">
                          10:30 AM
                        </p>

                      </div>

                    </div>

                    <div className="space-y-2">

                      {[
                        "🛍️ Browse Products",
                        "🔎 Search Products",
                        "🛒 My Cart",
                        "📦 My Orders",
                        "🚚 Track My Order",
                      ].map(
                        (item) => (

                          <button
                            key={item}
                            type="button"
                            className="block w-full rounded-xl bg-white px-3 py-2.5 text-left text-[11px] font-medium text-[#374151] shadow-sm"
                            style={{
                              borderLeft:
                                `3px solid ${selectedTheme.primary}`,
                            }}
                          >
                            {item}
                          </button>

                        )
                      )}

                    </div>

                    <div className="mt-5 flex justify-center">

                      <span
                        className="rounded-full px-3 py-1 text-[9px] font-medium text-white"
                        style={{
                          background:
                            selectedTheme.secondary,
                        }}
                      >
                        Powered by Sellora
                      </span>

                    </div>

                  </div>

                  <div className="bg-white p-2">

                    <div className="rounded-full bg-[#F1F2F4] px-3 py-2">

                      <span className="text-[10px] text-[#9CA3AF]">
                        Type a message...
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </aside>

        </div>

      </section>

    </main>
  );
}

/* =========================================================
   PREVIEW PRODUCT
========================================================= */

function PreviewProduct({
  name,
  price,
  color,
}: {
  name: string;
  price: string;
  color: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#EEF0F8]">

      <div
        className="flex aspect-square items-center justify-center"
        style={{
          background:
            `${color}12`,
        }}
      >

        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-xs font-bold text-white"
          style={{
            background:
              color,
          }}
        >
          {name
            .slice(0, 2)
            .toUpperCase()}
        </div>

      </div>

      <div className="p-2.5">

        <p className="truncate text-[10px] font-bold">
          {name}
        </p>

        <p className="mt-1 text-xs font-bold">
          {price}
        </p>

      </div>

    </div>
  );
}