"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type StoreData = {
  storeName?: string;
  botName?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

const DEFAULT_STORE: StoreData = {
  storeName: "Your Store",
  botName: "Your Assistant",
  logo: "",
  primaryColor: "#3730A3",
  secondaryColor: "#6D28D9",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [store, setStore] =
    useState<StoreData>(DEFAULT_STORE);

  /* =====================================================
     LOAD STORE
  ===================================================== */

  useEffect(() => {
    function loadStore() {
      try {
        const savedStore =
          localStorage.getItem("sellora-store");

        const savedDesign =
          localStorage.getItem(
            "sellora-store-design"
          );

        let data: StoreData = {
          ...DEFAULT_STORE,
        };

        if (savedStore) {
          data = {
            ...data,
            ...JSON.parse(savedStore),
          };
        }

        if (savedDesign) {
          data = {
            ...data,
            ...JSON.parse(savedDesign),
          };
        }

        setStore(data);
      } catch (error) {
        console.error(
          "Failed to load store:",
          error
        );
      }
    }

    loadStore();

    const handleUpdate = () => {
      loadStore();
    };

    window.addEventListener(
      "sellora-store-updated",
      handleUpdate
    );

    window.addEventListener(
      "sellora-design-updated",
      handleUpdate
    );

    window.addEventListener(
      "focus",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "sellora-store-updated",
        handleUpdate
      );

      window.removeEventListener(
        "sellora-design-updated",
        handleUpdate
      );

      window.removeEventListener(
        "focus",
        handleUpdate
      );
    };
  }, []);

  /* =====================================================
     PAGE INFORMATION
  ===================================================== */

  function getPageInfo() {
    if (pathname === "/dashboard") {
      return {
        eyebrow: "Dashboard",
        title: "Overview",
      };
    }

    if (
      pathname.startsWith(
        "/dashboard/design"
      )
    ) {
      return {
        eyebrow: "Store",
        title: "Store Design",
      };
    }

    if (
      pathname.startsWith(
        "/dashboard/products"
      )
    ) {
      return {
        eyebrow: "Manage",
        title: "Products",
      };
    }

    if (
      pathname.startsWith(
        "/dashboard/orders"
      )
    ) {
      return {
        eyebrow: "Manage",
        title: "Orders",
      };
    }

    if (
      pathname.startsWith(
        "/dashboard/sales"
      )
    ) {
      return {
        eyebrow: "Analytics",
        title: "Sales",
      };
    }

    if (
      pathname.startsWith(
        "/dashboard/delivery"
      )
    ) {
      return {
        eyebrow: "Manage",
        title: "Delivery",
      };
    }

    if (
      pathname.startsWith(
        "/dashboard/customers"
      )
    ) {
      return {
        eyebrow: "Manage",
        title: "Customers",
      };
    }

    if (
      pathname.startsWith(
        "/dashboard/settings"
      )
    ) {
      return {
        eyebrow: "Account",
        title: "Settings",
      };
    }

    return {
      eyebrow: "Sellora",
      title: "Seller Panel",
    };
  }

  const pageInfo =
    getPageInfo();

  const primaryColor =
    store.primaryColor ||
    "#3730A3";

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#F7F8FC] text-[#111827]">

      <div className="flex min-h-screen">

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <Sidebar />

        {/* =================================================
            MAIN AREA
        ================================================= */}

        <section className="min-w-0 flex-1">

          {/* =================================================
              PERSISTENT CONTEXTUAL TOPBAR
          ================================================= */}

          <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-[#E7E9F3] bg-white px-5 py-3 sm:px-8">

            {/* =================================================
                CURRENT PAGE
            ================================================= */}

            <div className="min-w-0">

              <p className="text-xs font-medium text-[#6B7280]">
                {pageInfo.eyebrow}
              </p>

              <h2 className="mt-0.5 truncate text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">
                {pageInfo.title}
              </h2>

            </div>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">

              {/* SEARCH */}

              <button
                type="button"
                className="hidden h-10 items-center gap-2 rounded-xl border border-[#E7E9F3] px-3 text-sm text-[#6B7280] transition hover:bg-[#F7F8FC] sm:flex"
              >

                <span className="text-base">
                  🔍
                </span>

                <span>
                  Search
                </span>

                <kbd className="ml-3 rounded-md bg-[#F1F2FA] px-1.5 py-0.5 text-[10px]">
                  /
                </kbd>

              </button>

              {/* NOTIFICATIONS */}

              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7E9F3] text-[#374151] transition hover:bg-[#F7F8FC]"
              >

                <span>
                  🔔
                </span>

                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#4F46E5]" />

              </button>

              {/* PROFILE */}

              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{
                  background:
                    `linear-gradient(135deg, ${primaryColor}, #6D28D9)`,
                }}
              >
                {getInitials(
                  store.storeName ||
                    "Store"
                )}
              </div>

            </div>

          </header>

          {/* =================================================
              ONLY MIDDLE CONTENT CHANGES
          ================================================= */}

          {children}

        </section>

      </div>

    </main>
  );
}

/* =========================================================
   STORE INITIALS
========================================================= */

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