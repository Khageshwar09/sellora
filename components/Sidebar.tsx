"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  LayoutDashboard,
  Package,
  Palette,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Store Design",
    href: "/dashboard/design",
    icon: Palette,
  },
  {
    name: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    name: "Sales",
    href: "/dashboard/sales",
    icon: BarChart3,
  },
  {
    name: "Delivery",
    href: "/dashboard/delivery",
    icon: Truck,
  },
  {
    name: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

type StoreData = {
  storeName?: string;
  botName?: string;
  category?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
};

const DEFAULT_STORE: StoreData = {
  storeName: "Your Store",
  botName: "Your Assistant",
  category: "Business",
  primaryColor: "#3730A3",
  secondaryColor: "#6D28D9",
  logo: "",
};

export default function Sidebar() {
  const pathname = usePathname();

  const [store, setStore] =
    useState<StoreData>(DEFAULT_STORE);

  const [loaded, setLoaded] =
    useState(false);

  /* =====================================================
     LOAD STORE
  ===================================================== */

  useEffect(() => {
    function loadStore() {
      try {
        const savedStore =
          localStorage.getItem(
            "sellora-store"
          );

        const savedDesign =
          localStorage.getItem(
            "sellora-store-design"
          );

        let storeData: StoreData = {
          ...DEFAULT_STORE,
        };

        if (savedStore) {
          const parsedStore =
            JSON.parse(savedStore);

          storeData = {
            ...storeData,
            ...parsedStore,
          };
        }

        /*
         * Design data can contain the latest
         * logo/colors after the seller edits
         * Store Design.
         */
        if (savedDesign) {
          const parsedDesign =
            JSON.parse(savedDesign);

          storeData = {
            ...storeData,
            storeName:
              parsedDesign.storeName ||
              storeData.storeName,

            botName:
              parsedDesign.botName ||
              storeData.botName,

            primaryColor:
              parsedDesign.primaryColor ||
              storeData.primaryColor,

            secondaryColor:
              parsedDesign.secondaryColor ||
              storeData.secondaryColor,

            logo:
              parsedDesign.logo ||
              storeData.logo,
          };
        }

        setStore(storeData);
      } catch (error) {
        console.error(
          "Failed to load Sellora store:",
          error
        );
      }

      setLoaded(true);
    }

    loadStore();

    /*
     * Listen for design/store changes
     * while the dashboard is open.
     */
    const handleStoreUpdate = () => {
      loadStore();
    };

    window.addEventListener(
      "sellora-design-updated",
      handleStoreUpdate
    );

    window.addEventListener(
      "sellora-store-updated",
      handleStoreUpdate
    );

    /*
     * Also refresh when returning to the tab.
     */
    window.addEventListener(
      "focus",
      handleStoreUpdate
    );

    return () => {
      window.removeEventListener(
        "sellora-design-updated",
        handleStoreUpdate
      );

      window.removeEventListener(
        "sellora-store-updated",
        handleStoreUpdate
      );

      window.removeEventListener(
        "focus",
        handleStoreUpdate
      );
    };
  }, []);

  /* =====================================================
     GET INITIALS
  ===================================================== */

  function getInitials(
    name: string
  ) {
    const cleanName =
      name.trim();

    if (!cleanName) {
      return "S";
    }

    const words =
      cleanName
        .split(/\s+/)
        .filter(Boolean);

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

  const storeName =
    store.storeName ||
    "Your Store";

  const initials =
    getInitials(storeName);

  const primaryColor =
    store.primaryColor ||
    "#3730A3";

  const secondaryColor =
    store.secondaryColor ||
    "#6D28D9";

  /* =====================================================
     LOADING
  ===================================================== */

  if (!loaded) {
    return (
      <aside className="hidden w-[250px] flex-shrink-0 border-r border-[#E7E9F3] bg-white lg:flex lg:flex-col">

        {/* LOGO */}

        <div className="flex h-[76px] items-center border-b border-[#EEF0F8] px-6">

          <div>

            <h1 className="text-[24px] font-bold tracking-[-0.8px] text-[#374151]">
              Sellora
            </h1>

            <p className="text-[11px] font-medium tracking-wide text-[#9CA3AF]">
              SELLER PLATFORM
            </p>

          </div>

        </div>

        {/* LOADING STORE */}

        <div className="border-b border-[#EEF0F8] p-4">

          <div className="h-[66px] animate-pulse rounded-xl bg-[#F7F8FC]" />

        </div>

      </aside>
    );
  }

  /* =====================================================
     SIDEBAR
  ===================================================== */

  return (
    <aside className="hidden w-[250px] flex-shrink-0 border-r border-[#E7E9F3] bg-white lg:flex lg:flex-col">

      {/* =================================================
          SELLORA LOGO
      ================================================= */}

      <div className="flex h-[76px] items-center border-b border-[#EEF0F8] px-6">

        <div>

          <h1 className="text-[24px] font-bold tracking-[-0.8px] text-[#374151]">
            Sellora
          </h1>

          <p className="text-[11px] font-medium tracking-wide text-[#9CA3AF]">
            SELLER PLATFORM
          </p>

        </div>

      </div>

      {/* =================================================
          STORE CARD
      ================================================= */}

      <div className="border-b border-[#EEF0F8] p-4">

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-[#E7E9F3] bg-white p-3 text-left transition hover:bg-[#F7F8FC]"
        >

          {/* STORE LOGO */}

          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
          >

            {store.logo ? (
              <img
                src={store.logo}
                alt={`${storeName} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}

          </div>

          {/* STORE DETAILS */}

          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-semibold text-[#374151]">
              {storeName}
            </p>

            <div className="mt-0.5 flex items-center gap-1.5">

              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <span className="text-[11px] text-[#9CA3AF]">
                Store is live
              </span>

            </div>

          </div>

          <ChevronDown
            size={15}
            className="shrink-0 text-[#B5BAD1]"
          />

        </button>

      </div>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="flex-1 overflow-y-auto px-3 py-5">

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#B5BAD1]">
          Manage
        </p>

        <div className="space-y-1">

          {navigation.map(
            (item) => {
              const Icon =
                item.icon;

              const isActive =
                pathname ===
                  item.href ||
                (item.href !==
                  "/dashboard" &&
                  pathname.startsWith(
                    item.href
                  ));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#EEF0FE] text-[#3730A3]"
                      : "text-[#6B7280] hover:bg-[#F7F8FC] hover:text-[#374151]"
                  }`}
                >

                  <Icon
                    size={17}
                    strokeWidth={
                      isActive
                        ? 2.2
                        : 1.8
                    }
                  />

                  <span>
                    {item.name}
                  </span>

                </Link>
              );
            }
          )}

        </div>

      </nav>

      {/* =================================================
          PLAN
      ================================================= */}

      <div className="border-t border-[#EEF0F8] p-4">

        <div className="rounded-xl bg-gradient-to-br from-[#EEF0FE] to-[#F5F0FF] p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-semibold text-[#374151]">
                Your plan
              </p>

              <p className="mt-1 text-[11px] text-[#8A8FB0]">
                Professional
              </p>

            </div>

            <button
              type="button"
              className="text-[11px] font-semibold text-[#3730A3] hover:underline"
            >
              Upgrade
            </button>

          </div>

        </div>

      </div>

    </aside>
  );
}