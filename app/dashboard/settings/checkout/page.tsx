"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getStore,
  saveStore,
  type Order,
  type PaymentStatus,
} from "@/lib/sellora-data";

type CheckoutSettings = {
  upiId: string;
  paymentName: string;
  acceptUpi: boolean;
  acceptCod: boolean;
  qrExpiryMinutes: number;
};

type CheckoutForm = {
  customerName: string;
  phone: string;
  email: string;
  productName: string;
  quantity: number;
  amount: string;
};

type GeneratedQR = {
  upiUrl: string;
  expiresAt: number;
};

const SETTINGS_KEY = "sellora-settings";

const DEFAULT_SETTINGS: CheckoutSettings = {
  upiId: "",
  paymentName: "",
  acceptUpi: true,
  acceptCod: true,
  qrExpiryMinutes: 10,
};

const EMPTY_FORM: CheckoutForm = {
  customerName: "",
  phone: "",
  email: "",
  productName: "",
  quantity: 1,
  amount: "",
};

export default function CheckoutSettingsPage() {
  const [store, setStore] = useState<
    ReturnType<typeof getStore> | null
  >(null);

  const [settings, setSettings] =
    useState<CheckoutSettings>(DEFAULT_SETTINGS);

  const [form, setForm] =
    useState<CheckoutForm>(EMPTY_FORM);

  const [qr, setQr] =
    useState<GeneratedQR | null>(null);

  const [secondsLeft, setSecondsLeft] =
    useState(0);

  const [paymentMethod, setPaymentMethod] =
    useState<"UPI" | "COD">("UPI");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(
      "sellora-store-updated",
      handleUpdate
    );

    window.addEventListener(
      "sellora-settings-updated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "sellora-store-updated",
        handleUpdate
      );

      window.removeEventListener(
        "sellora-settings-updated",
        handleUpdate
      );
    };
  }, []);

  function loadData() {
    const currentStore = getStore();

    setStore(currentStore);

    try {
      const raw = localStorage.getItem(SETTINGS_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          qrExpiryMinutes: 10,
        });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }

  /*
   * QR TIMER
   */

  useEffect(() => {
    if (!qr) {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (qr.expiresAt - Date.now()) / 1000
        )
      );

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        setQr(null);
        setMessage(
          "This QR has expired. Generate a new QR."
        );
      }
    };

    updateTimer();

    const timer = window.setInterval(
      updateTimer,
      1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [qr]);

  const amount = Number(form.amount) || 0;

  const upiUrl = useMemo(() => {
    if (!settings.upiId.trim() || amount <= 0) {
      return "";
    }

    return (
      "upi://pay?" +
      new URLSearchParams({
        pa: settings.upiId.trim(),
        pn:
          settings.paymentName.trim() ||
          store?.store.name ||
          "Store",
        am: amount.toFixed(2),
        cu: "INR",
        tn:
          form.productName.trim() ||
          "Store Payment",
      }).toString()
    );
  }, [
    settings.upiId,
    settings.paymentName,
    store?.store.name,
    amount,
    form.productName,
  ]);

  const qrImage = qr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
        qr.upiUrl
      )}`
    : "";

  function updateForm(
    field: keyof CheckoutForm,
    value: string | number
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setMessage("");
  }

  function generateQR() {
    setError("");
    setMessage("");

    if (!settings.acceptUpi) {
      setError(
        "UPI payments are disabled."
      );
      return;
    }

    if (!settings.upiId.trim()) {
      setError(
        "Please add your UPI ID in Checkout settings."
      );
      return;
    }

    if (amount <= 0) {
      setError(
        "Please enter a valid amount."
      );
      return;
    }

    const expiresAt =
      Date.now() + 10 * 60 * 1000;

    const paymentUrl =
      "upi://pay?" +
      new URLSearchParams({
        pa: settings.upiId.trim(),
        pn:
          settings.paymentName.trim() ||
          store?.store.name ||
          "Store",
        am: amount.toFixed(2),
        cu: "INR",
        tn:
          form.productName.trim() ||
          "Store Payment",
      }).toString();

    setQr({
      upiUrl: paymentUrl,
      expiresAt,
    });

    setSecondsLeft(600);

    setMessage(
      "QR generated. This QR is valid for 10 minutes."
    );
  }

  function clearQR() {
    setQr(null);
    setSecondsLeft(0);
  }

  function formatTimer(
    seconds: number
  ) {
    const minutes = Math.floor(
      seconds / 60
    );

    const secs = seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }

  /*
   * CREATE REAL ORDER IN CURRENT STORE DATA
   */

  function createOrder(
    payment: PaymentStatus
  ) {
    if (!store) {
      return;
    }

    setError("");
    setMessage("");

    const customerName =
      form.customerName.trim();

    const phone =
      form.phone.trim();

    const email =
      form.email.trim();

    const productName =
      form.productName.trim();

    if (!customerName) {
      setError(
        "Customer name is required."
      );
      return;
    }

    if (!phone) {
      setError(
        "Customer phone is required."
      );
      return;
    }

    if (!productName) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (form.quantity < 1) {
      setError(
        "Quantity must be at least 1."
      );
      return;
    }

    if (amount <= 0) {
      setError(
        "Enter a valid amount."
      );
      return;
    }

    setSaving(true);

    const normalizedPhone =
      phone.replace(/\D/g, "");

    const existingCustomer =
      store.customers.find(
        (customer) =>
          customer.phone.replace(
            /\D/g,
            ""
          ) === normalizedPhone
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

    const customer = existingCustomer
      ? {
          ...existingCustomer,
          name: customerName,
          phone,
          email:
            email ||
            existingCustomer.email,
          orders:
            existingCustomer.orders + 1,
          spent:
            existingCustomer.spent +
            (payment === "Refunded"
              ? 0
              : amount),
        }
      : {
          id: customerId,
          name: customerName,
          phone,
          email,
          orders: 1,
          spent:
            payment === "Refunded"
              ? 0
              : amount,
          joined: date,
        };

    const order: Order = {
      id: createOrderId(
        store.orders
      ),
      customerId,
      customer: customerName,
      phone,
      items: [
        {
          productId:
            "MANUAL-" +
            Date.now().toString(),
          name: productName,
          qty: form.quantity,
          price:
            amount / form.quantity,
        },
      ],
      total: amount,
      status:
        payment === "COD"
          ? "Confirmed"
          : "Pending",
      payment,
      date,
    };

    const customers =
      existingCustomer
        ? store.customers.map(
            (item) =>
              item.id ===
              existingCustomer.id
                ? customer
                : item
          )
        : [
            ...store.customers,
            customer,
          ];

    const updatedStore = {
      ...store,
      customers,
      orders: [
        ...store.orders,
        order,
      ],
    };

    saveStore(updatedStore);

    setStore(updatedStore);

    setSaving(false);

    setMessage(
      `Order ${order.id} created successfully.`
    );

    setForm(EMPTY_FORM);

    clearQR();
  }

  if (!store) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading checkout...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-6">
          <p className="text-sm font-medium text-slate-500">
            Settings / Checkout
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Checkout
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Configure payments and create customer orders.
          </p>
        </div>

        {/* MESSAGE */}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">

          {/* LEFT */}

          <div className="space-y-5">

            {/* PAYMENT SETTINGS */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-base font-bold text-slate-900">
                Payment settings
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                These settings control how customers can pay.
              </p>

              <div className="mt-5 space-y-3">

                <Toggle
                  title="UPI payments"
                  description="Allow customers to pay using UPI."
                  checked={
                    settings.acceptUpi
                  }
                  onChange={(checked) => {
                    const next = {
                      ...settings,
                      acceptUpi: checked,
                    };

                    setSettings(next);

                    localStorage.setItem(
                      SETTINGS_KEY,
                      JSON.stringify(next)
                    );
                  }}
                />

                <Toggle
                  title="Cash on delivery"
                  description="Allow customers to place COD orders."
                  checked={
                    settings.acceptCod
                  }
                  onChange={(checked) => {
                    const next = {
                      ...settings,
                      acceptCod: checked,
                    };

                    setSettings(next);

                    localStorage.setItem(
                      SETTINGS_KEY,
                      JSON.stringify(next)
                    );
                  }}
                />

              </div>

            </section>

            {/* UPI */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-base font-bold text-slate-900">
                UPI details
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <Field
                  label="UPI ID"
                  value={
                    settings.upiId
                  }
                  placeholder="yourname@upi"
                  onChange={(value) => {
                    const next = {
                      ...settings,
                      upiId: value,
                    };

                    setSettings(next);

                    localStorage.setItem(
                      SETTINGS_KEY,
                      JSON.stringify(next)
                    );
                  }}
                />

                <Field
                  label="Payment name"
                  value={
                    settings.paymentName
                  }
                  placeholder={
                    store.store.name ||
                    "Your business name"
                  }
                  onChange={(value) => {
                    const next = {
                      ...settings,
                      paymentName: value,
                    };

                    setSettings(next);

                    localStorage.setItem(
                      SETTINGS_KEY,
                      JSON.stringify(next)
                    );
                  }}
                />

              </div>

              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">

                <p className="text-sm font-semibold text-blue-900">
                  QR validity
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Every generated payment QR stays active for exactly 10 minutes.
                  After expiry, generate a new QR.
                </p>

              </div>

            </section>

            {/* CUSTOMER */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-base font-bold text-slate-900">
                Customer
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Enter real customer information.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <Field
                  label="Customer name"
                  value={
                    form.customerName
                  }
                  placeholder="Customer name"
                  onChange={(value) =>
                    updateForm(
                      "customerName",
                      value
                    )
                  }
                />

                <Field
                  label="Phone"
                  value={
                    form.phone
                  }
                  placeholder="+91..."
                  type="tel"
                  onChange={(value) =>
                    updateForm(
                      "phone",
                      value
                    )
                  }
                />

                <div className="sm:col-span-2">
                  <Field
                    label="Email"
                    value={
                      form.email
                    }
                    placeholder="customer@example.com"
                    type="email"
                    onChange={(value) =>
                      updateForm(
                        "email",
                        value
                      )
                    }
                  />
                </div>

              </div>

            </section>

            {/* ORDER */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-base font-bold text-slate-900">
                Order
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_130px]">

                <Field
                  label="Product"
                  value={
                    form.productName
                  }
                  placeholder="Product name"
                  onChange={(value) =>
                    updateForm(
                      "productName",
                      value
                    )
                  }
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={
                      form.quantity
                    }
                    onChange={(event) =>
                      updateForm(
                        "quantity",
                        Math.max(
                          1,
                          Number(
                            event.target
                              .value
                          ) || 1
                        )
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

              </div>

              <div className="mt-4">
                <Field
                  label="Total amount"
                  value={
                    form.amount
                  }
                  placeholder="0"
                  type="number"
                  onChange={(value) =>
                    updateForm(
                      "amount",
                      value
                    )
                  }
                />
              </div>

            </section>

            {/* METHOD */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-base font-bold text-slate-900">
                Payment method
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                {settings.acceptUpi && (
                  <PaymentOption
                    title="UPI"
                    description="Generate a payment QR"
                    selected={
                      paymentMethod ===
                      "UPI"
                    }
                    onClick={() =>
                      setPaymentMethod(
                        "UPI"
                      )
                    }
                  />
                )}

                {settings.acceptCod && (
                  <PaymentOption
                    title="Cash on delivery"
                    description="Create a COD order"
                    selected={
                      paymentMethod ===
                      "COD"
                    }
                    onClick={() =>
                      setPaymentMethod(
                        "COD"
                      )
                    }
                  />
                )}

              </div>

              {!settings.acceptUpi &&
                !settings.acceptCod && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    Enable at least one payment method above.
                  </div>
                )}

            </section>

            {/* ACTION */}

            {paymentMethod ===
              "UPI" &&
              settings.acceptUpi && (
                <button
                  type="button"
                  onClick={
                    generateQR
                  }
                  className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Generate QR — 10 minutes
                </button>
              )}

            {paymentMethod ===
              "COD" &&
              settings.acceptCod && (
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    createOrder(
                      "COD"
                    )
                  }
                  className="w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating order..."
                    : "Create COD order"}
                </button>
              )}

          </div>

          {/* RIGHT */}

          <aside className="xl:sticky xl:top-6 xl:self-start">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Payment
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    ₹
                    {amount.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  INR
                </span>

              </div>

              {qr ? (
                <div className="mt-6">

                  <div className="rounded-2xl border border-slate-200 p-4">

                    <img
                      src={qrImage}
                      alt="UPI payment QR"
                      className="mx-auto aspect-square w-full max-w-[300px]"
                    />

                  </div>

                  <div className="mt-4 rounded-xl bg-slate-900 p-4 text-center">

                    <p className="text-xs text-slate-400">
                      QR expires in
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-wider text-white">
                      {formatTimer(
                        secondsLeft
                      )}
                    </p>

                  </div>

                  <p className="mt-4 break-all text-center text-sm font-semibold text-slate-700">
                    {
                      settings.upiId
                    }
                  </p>

                  <button
                    type="button"
                    onClick={
                      clearQR
                    }
                    className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel QR
                  </button>

                  {secondsLeft >
                    0 && (
                    <button
                      type="button"
                      disabled={
                        saving
                      }
                      onClick={() =>
                        createOrder(
                          "Paid"
                        )
                      }
                      className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {saving
                        ? "Creating order..."
                        : "Payment received — create order"}
                    </button>
                  )}

                </div>
              ) : (
                <div className="mt-6 flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-600">
                    ₹
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    No active QR
                  </h3>

                  <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
                    Enter the order details and generate a fresh payment QR.
                  </p>

                </div>
              )}

              {/* SUMMARY */}

              <div className="mt-6 border-t border-slate-100 pt-5">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Order summary
                </p>

                <div className="mt-4 space-y-3">

                  <SummaryRow
                    label="Customer"
                    value={
                      form.customerName ||
                      "Not entered"
                    }
                  />

                  <SummaryRow
                    label="Phone"
                    value={
                      form.phone ||
                      "Not entered"
                    }
                  />

                  <SummaryRow
                    label="Product"
                    value={
                      form.productName ||
                      "Not entered"
                    }
                  />

                  <SummaryRow
                    label="Quantity"
                    value={String(
                      form.quantity
                    )}
                  />

                  <SummaryRow
                    label="Payment"
                    value={
                      paymentMethod
                    }
                  />

                </div>

              </div>

            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      />
    </div>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!checked)
      }
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50"
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>

      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-blue-600"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

/* =========================================================
   PAYMENT OPTION
========================================================= */

function PaymentOption({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm font-bold ${
              selected
                ? "text-blue-700"
                : "text-slate-800"
            }`}
          >
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <span
          className={`h-4 w-4 rounded-full border-2 ${
            selected
              ? "border-blue-600 bg-blue-600"
              : "border-slate-300"
          }`}
        />
      </div>
    </button>
  );
}

/* =========================================================
   SUMMARY
========================================================= */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="max-w-[220px] truncate text-right text-sm font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   CUSTOMER ID
========================================================= */

function createCustomerId(
  customers: { id: string }[]
) {
  const numbers = customers
    .map((customer) => {
      const match =
        customer.id.match(
          /^C(\d+)$/
        );

      return match
        ? Number(match[1])
        : 0;
    })
    .filter((value) =>
      Number.isFinite(value)
    );

  const next =
    numbers.length > 0
      ? Math.max(...numbers) + 1
      : 1;

  return `C${String(
    next
  ).padStart(3, "0")}`;
}

/* =========================================================
   ORDER ID
========================================================= */

function createOrderId(
  orders: { id: string }[]
) {
  const numbers = orders
    .map((order) => {
      const match =
        order.id.match(
          /^SO-(\d+)$/
        );

      return match
        ? Number(match[1])
        : 0;
    })
    .filter((value) =>
      Number.isFinite(value)
    );

  const next =
    numbers.length > 0
      ? Math.max(...numbers) + 1
      : 1001;

  return `SO-${next}`;
}