"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getStore,
  saveStore,
} from "@/lib/sellora-data";

type SettingsTab =
  | "General"
  | "Checkout";

type Settings = {
  storeName: string;
  ownerName: string;
  phone: string;
  email: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;

  upiId: string;
  paymentName: string;
  acceptUpi: boolean;
  acceptCod: boolean;

  qrExpiryMinutes: number;
};

const EMPTY_SETTINGS: Settings = {
  storeName: "",
  ownerName: "",
  phone: "",
  email: "",

  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",

  upiId: "",
  paymentName: "",
  acceptUpi: true,
  acceptCod: true,

  qrExpiryMinutes: 10,
};

const SETTINGS_KEY =
  "sellora-settings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>(
      "General"
    );

  const [settings, setSettings] =
    useState<Settings>(
      EMPTY_SETTINGS
    );

  const [loaded, setLoaded] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [showQr, setShowQr] =
    useState(false);

  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          SETTINGS_KEY
        );

      if (raw) {
        const parsed =
          JSON.parse(raw);

        setSettings({
          ...EMPTY_SETTINGS,
          ...parsed,
        });
      } else {
        const store =
          getStore();

        setSettings({
          ...EMPTY_SETTINGS,

          storeName:
            store.store.name ||
            "",

          ownerName:
            store.store.owner ||
            "",

          phone:
            store.store.phone ||
            "",

          email:
            store.store.email ||
            "",
        });
      }
    } catch {
      setSettings(
        EMPTY_SETTINGS
      );
    }

    setLoaded(true);
  }, []);

  /* =========================================================
     UPDATE
  ========================================================= */

  function updateField<
    K extends keyof Settings
  >(
    field: K,
    value: Settings[K]
  ) {
    setSettings(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setSaved(false);
  }

  /* =========================================================
     SAVE
  ========================================================= */

  function handleSave() {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(
        settings
      )
    );

    /*
      Keep the main store information
      synchronized with Settings.
    */

    const store =
      getStore();

    saveStore({
      ...store,

      store: {
        ...store.store,

        name:
          settings.storeName,

        owner:
          settings.ownerName,

        phone:
          settings.phone,

        email:
          settings.email,
      },
    });

    window.dispatchEvent(
      new CustomEvent(
        "sellora-settings-updated",
        {
          detail:
            settings,
        }
      )
    );

    setSaved(true);

    window.setTimeout(
      () => setSaved(false),
      2500
    );
  }

  /* =========================================================
     RESET
  ========================================================= */

  function resetSettings() {
    const confirmed =
      window.confirm(
        "Reset these settings?"
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      SETTINGS_KEY
    );

    setSettings(
      EMPTY_SETTINGS
    );

    setSaved(false);
  }

  /* =========================================================
     UPI QR
  ========================================================= */

  const upiUrl = useMemo(() => {
    if (
      !settings.upiId.trim()
    ) {
      return "";
    }

    const name =
      settings.paymentName.trim();

    return (
      "upi://pay?" +
      new URLSearchParams({
        pa: settings.upiId.trim(),
        pn:
          name ||
          settings.storeName ||
          "Store",
      }).toString()
    );
  }, [
    settings.upiId,
    settings.paymentName,
    settings.storeName,
  ]);

  /*
    The QR image is generated from the UPI URL.
    The actual checkout page should create a fresh
    10-minute checkout session when the customer pays.
  */

  const qrImage =
    upiUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          upiUrl
        )}`
      : "";

  /* =========================================================
     LOADING
  ========================================================= */

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading settings...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC]">

      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-medium text-slate-500">
              Account
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your store and checkout settings.
            </p>

          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={
                resetSettings
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={
                handleSave
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {saved
                ? "Saved"
                : "Save changes"}
            </button>

          </div>

        </div>

        {/* TABS */}

        <div className="mt-6 border-b border-slate-200">

          <div className="flex gap-6">

            <TabButton
              active={
                activeTab ===
                "General"
              }
              onClick={() =>
                setActiveTab(
                  "General"
                )
              }
            >
              General
            </TabButton>

            <TabButton
              active={
                activeTab ===
                "Checkout"
              }
              onClick={() =>
                setActiveTab(
                  "Checkout"
                )
              }
            >
              Checkout
            </TabButton>

          </div>

        </div>

        {/* =====================================================
            GENERAL
        ===================================================== */}

        {activeTab ===
          "General" && (
          <div className="mt-6 space-y-5">

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div>

                <h2 className="text-base font-bold text-slate-900">
                  Store information
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Use your actual business information here.
                </p>

              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <Field
                  label="Store name"
                  value={
                    settings.storeName
                  }
                  placeholder="Your store name"
                  onChange={(value) =>
                    updateField(
                      "storeName",
                      value
                    )
                  }
                />

                <Field
                  label="Owner name"
                  value={
                    settings.ownerName
                  }
                  placeholder="Your name"
                  onChange={(value) =>
                    updateField(
                      "ownerName",
                      value
                    )
                  }
                />

                <Field
                  label="Phone"
                  value={
                    settings.phone
                  }
                  placeholder="+91..."
                  onChange={(value) =>
                    updateField(
                      "phone",
                      value
                    )
                  }
                  type="tel"
                />

                <Field
                  label="Email"
                  value={
                    settings.email
                  }
                  placeholder="you@example.com"
                  onChange={(value) =>
                    updateField(
                      "email",
                      value
                    )
                  }
                  type="email"
                />

              </div>

            </section>

            {/* ADDRESS */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-base font-bold text-slate-900">
                Store address
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Enter the accurate address used for your store and deliveries.
              </p>

              <div className="mt-5 space-y-4">

                <Field
                  label="Address line 1"
                  value={
                    settings.addressLine1
                  }
                  placeholder="Building, street, area"
                  onChange={(value) =>
                    updateField(
                      "addressLine1",
                      value
                    )
                  }
                />

                <Field
                  label="Address line 2"
                  value={
                    settings.addressLine2
                  }
                  placeholder="Landmark, apartment, etc. (optional)"
                  onChange={(value) =>
                    updateField(
                      "addressLine2",
                      value
                    )
                  }
                />

                <div className="grid gap-4 sm:grid-cols-2">

                  <Field
                    label="City"
                    value={
                      settings.city
                    }
                    placeholder="City"
                    onChange={(value) =>
                      updateField(
                        "city",
                        value
                      )
                    }
                  />

                  <Field
                    label="State"
                    value={
                      settings.state
                    }
                    placeholder="State"
                    onChange={(value) =>
                      updateField(
                        "state",
                        value
                      )
                    }
                  />

                  <Field
                    label="PIN code"
                    value={
                      settings.pincode
                    }
                    placeholder="PIN code"
                    onChange={(value) =>
                      updateField(
                        "pincode",
                        value
                      )
                    }
                  />

                  <Field
                    label="Country"
                    value={
                      settings.country
                    }
                    placeholder="Country"
                    onChange={(value) =>
                      updateField(
                        "country",
                        value
                      )
                    }
                  />

                </div>

              </div>

            </section>

          </div>
        )}

        {/* =====================================================
            CHECKOUT
        ===================================================== */}

        {activeTab ===
          "Checkout" && (
          <div className="mt-6 space-y-5">

            {/* PAYMENT */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-base font-bold text-slate-900">
                Payment methods
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Choose which payment methods customers can use.
              </p>

              <div className="mt-5 space-y-3">

                <ToggleRow
                  title="UPI payments"
                  description="Allow customers to pay through UPI."
                  checked={
                    settings.acceptUpi
                  }
                  onChange={(value) =>
                    updateField(
                      "acceptUpi",
                      value
                    )
                  }
                />

                <ToggleRow
                  title="Cash on delivery"
                  description="Allow customers to place COD orders."
                  checked={
                    settings.acceptCod
                  }
                  onChange={(value) =>
                    updateField(
                      "acceptCod",
                      value
                    )
                  }
                />

              </div>

            </section>

            {/* UPI */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-base font-bold text-slate-900">
                UPI checkout
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Customers will use this UPI ID to make payments.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <Field
                  label="UPI ID"
                  value={
                    settings.upiId
                  }
                  placeholder="yourname@upi"
                  onChange={(value) =>
                    updateField(
                      "upiId",
                      value
                    )
                  }
                />

                <Field
                  label="Payment name"
                  value={
                    settings.paymentName
                  }
                  placeholder="Your business name"
                  onChange={(value) =>
                    updateField(
                      "paymentName",
                      value
                    )
                  }
                />

              </div>

              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

                <p className="text-sm font-semibold text-blue-900">
                  QR validity
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Checkout QR sessions are configured for 10 minutes.
                  After that the customer must generate a fresh QR/payment session.
                </p>

              </div>

            </section>

            {/* QR */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h2 className="text-base font-bold text-slate-900">
                    Payment QR
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Preview the UPI QR customers will use.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowQr(
                      (current) =>
                        !current
                    )
                  }
                  disabled={
                    !settings.upiId.trim()
                  }
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {showQr
                    ? "Hide QR"
                    : "Show QR"}
                </button>

              </div>

              {showQr &&
                settings.upiId.trim() && (
                  <div className="mt-6 flex flex-col items-center">

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                      <img
                        src={
                          qrImage
                        }
                        alt="UPI payment QR"
                        className="h-[260px] w-[260px]"
                      />

                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-800">
                      {
                        settings.upiId
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      QR checkout validity: 10 minutes
                    </p>

                  </div>
                )}

              {!settings.upiId.trim() && (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-6 text-center">

                  <p className="text-sm font-semibold text-slate-700">
                    Add your UPI ID first
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Your QR will appear here after a UPI ID is entered.
                  </p>

                </div>
              )}

            </section>

            {/* CHECKOUT SUMMARY */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-base font-bold text-slate-900">
                Checkout summary
              </h2>

              <div className="mt-4 divide-y divide-slate-100">

                <SummaryRow
                  label="UPI"
                  value={
                    settings.acceptUpi
                      ? "Enabled"
                      : "Disabled"
                  }
                  enabled={
                    settings.acceptUpi
                  }
                />

                <SummaryRow
                  label="Cash on delivery"
                  value={
                    settings.acceptCod
                      ? "Enabled"
                      : "Disabled"
                  }
                  enabled={
                    settings.acceptCod
                  }
                />

                <SummaryRow
                  label="QR validity"
                  value="10 minutes"
                  enabled
                />

              </div>

            </section>

          </div>
        )}

      </div>

    </main>
  );
}

/* =========================================================
   TAB
========================================================= */

function TabButton({
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
      className={`border-b-2 px-1 pb-3 text-sm font-semibold ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (
    value: string
  ) => void;
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
        placeholder={
          placeholder
        }
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

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
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
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
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
   SUMMARY
========================================================= */

function SummaryRow({
  label,
  value,
  enabled,
}: {
  label: string;
  value: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm font-semibold ${
          enabled
            ? "text-emerald-600"
            : "text-slate-400"
        }`}
      >
        {value}
      </span>

    </div>
  );
}