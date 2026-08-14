export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Packed"
  | "Out for delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentStatus =
  | "Paid"
  | "COD"
  | "Refunded";

export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  sold: number;
  category: string;
  active: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  orders: number;
  spent: number;
  joined: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  price: number;
};

export type Order = {
  id: string;
  customerId: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  payment: PaymentStatus;
  date: string;
};

export type StoreData = {
  store: {
    name: string;
    owner: string;
    phone: string;
    email: string;
    currency: string;
    theme: string;
    font: string;
    logo: string;
  };

  products: Product[];
  customers: Customer[];
  orders: Order[];
};

/* =========================================================
   STORAGE
========================================================= */

export const STORAGE_KEY =
  "sellora-store-v1";

/*
  IMPORTANT:
  The old version used:
  sellora-demo-store-v1

  We intentionally use a new key so the old fake
  Rahul/Priya/Aman/etc. data is NOT loaded.
*/

/* =========================================================
   EMPTY STORE
========================================================= */

export const emptyStore: StoreData = {
  store: {
    name: "",
    owner: "",
    phone: "",
    email: "",
    currency: "INR",
    theme: "#2563eb",
    font: "Inter",
    logo: "",
  },

  /*
    NO FAKE PRODUCTS
  */
  products: [],

  /*
    NO FAKE CUSTOMERS
  */
  customers: [],

  /*
    NO FAKE ORDERS
  */
  orders: [],
};

/* =========================================================
   GET STORE
========================================================= */

export function getStore(): StoreData {
  if (
    typeof window ===
    "undefined"
  ) {
    return emptyStore;
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  /*
    First launch:
    create a completely empty store.
  */

  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        emptyStore
      )
    );

    return emptyStore;
  }

  try {
    const parsed =
      JSON.parse(raw);

    /*
      Safety:
      Make sure all required arrays exist.
    */

    return {
      store: {
        ...emptyStore.store,
        ...(parsed?.store ??
          {}),
      },

      products:
        Array.isArray(
          parsed?.products
        )
          ? parsed.products
          : [],

      customers:
        Array.isArray(
          parsed?.customers
        )
          ? parsed.customers
          : [],

      orders:
        Array.isArray(
          parsed?.orders
        )
          ? parsed.orders
          : [],
    };
  } catch {
    /*
      Corrupt storage:
      start clean instead of showing fake data.
    */

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        emptyStore
      )
    );

    return emptyStore;
  }
}

/* =========================================================
   SAVE STORE
========================================================= */

export function saveStore(
  store: StoreData
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(store)
  );

  window.dispatchEvent(
    new Event(
      "sellora-store-updated"
    )
  );
}

/* =========================================================
   RESET STORE
========================================================= */

export function resetStore() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  /*
    Also remove the old demo
    storage key from the previous
    version.
  */

  localStorage.removeItem(
    "sellora-demo-store-v1"
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      emptyStore
    )
  );

  window.dispatchEvent(
    new Event(
      "sellora-store-updated"
    )
  );
}

/* =========================================================
   MONEY
========================================================= */

export function money(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number.isFinite(value)
      ? value
      : 0
  );
}

/* =========================================================
   DATE
========================================================= */

export function shortDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* =========================================================
   ORDER STATUS CLASSES
========================================================= */

export const statusClasses: Record<
  OrderStatus,
  string
> = {
  Pending:
    "bg-amber-50 text-amber-700",

  Confirmed:
    "bg-blue-50 text-blue-700",

  Packed:
    "bg-violet-50 text-violet-700",

  "Out for delivery":
    "bg-cyan-50 text-cyan-700",

  Delivered:
    "bg-emerald-50 text-emerald-700",

  Cancelled:
    "bg-red-50 text-red-700",
};

/* =========================================================
   PAYMENT CLASSES
========================================================= */

export const paymentClasses: Record<
  PaymentStatus,
  string
> = {
  Paid:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  COD:
    "border-amber-200 bg-amber-50 text-amber-700",

  Refunded:
    "border-red-200 bg-red-50 text-red-700",
};