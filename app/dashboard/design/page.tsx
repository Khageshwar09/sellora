"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import {
  Check,
  ChevronDown,
  ImagePlus,
  Palette,
  RotateCcw,
  Smartphone,
  Upload,
} from "lucide-react";

type StoreDesign = {
  storeName: string;
  botName: string;
  welcomeMessage: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logo: string;
};

const EMPTY_DESIGN: StoreDesign = {
  storeName: "",
  botName: "",
  welcomeMessage: "",
  primaryColor: "#2563EB",
  secondaryColor: "#1D4ED8",
  font: "Inter",
  logo: "",
};

const FONT_OPTIONS = [
  {
    name: "Inter",
    family:
      "Inter, Arial, sans-serif",
  },
  {
    name: "Poppins",
    family:
      "Poppins, Arial, sans-serif",
  },
  {
    name: "Roboto",
    family:
      "Roboto, Arial, sans-serif",
  },
  {
    name: "DM Sans",
    family:
      "DM Sans, Arial, sans-serif",
  },
  {
    name: "Plus Jakarta Sans",
    family:
      "Plus Jakarta Sans, Arial, sans-serif",
  },
];

const COLOR_PRESETS = [
  "#2563EB",
  "#3730A3",
  "#059669",
  "#DB2777",
  "#EA580C",
  "#7C3AED",
  "#0891B2",
  "#111827",
];

export default function StoreDesignPage() {
  const [design, setDesign] =
    useState<StoreDesign>(
      EMPTY_DESIGN
    );

  const [loaded, setLoaded] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [logoName, setLogoName] =
    useState("");

  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          "sellora-store-design"
        );

      if (raw) {
        const parsed =
          JSON.parse(raw);

        setDesign({
          ...EMPTY_DESIGN,
          ...parsed,
        });

        setLogoName(
          parsed.logoName || ""
        );
      }
    } catch {
      setDesign(
        EMPTY_DESIGN
      );
    }

    setLoaded(true);
  }, []);

  /* =========================================================
     UPDATE
  ========================================================= */

  function updateDesign(
    field: keyof StoreDesign,
    value: string
  ) {
    setDesign(
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
    const data = {
      ...design,
      logoName,
    };

    localStorage.setItem(
      "sellora-store-design",
      JSON.stringify(data)
    );

    window.dispatchEvent(
      new CustomEvent(
        "sellora-design-updated",
        {
          detail: data,
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

  function handleReset() {
    const confirmed =
      window.confirm(
        "Reset your store design?"
      );

    if (!confirmed) {
      return;
    }

    setDesign(
      EMPTY_DESIGN
    );

    setLogoName("");

    localStorage.removeItem(
      "sellora-store-design"
    );

    window.dispatchEvent(
      new CustomEvent(
        "sellora-design-updated",
        {
          detail:
            EMPTY_DESIGN,
        }
      )
    );

    setSaved(true);

    window.setTimeout(
      () => setSaved(false),
      2000
    );
  }

  /* =========================================================
     LOGO
  ========================================================= */

  function handleLogoUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      window.alert(
        "Please select an image file."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const result =
        reader.result;

      if (
        typeof result ===
        "string"
      ) {
        updateDesign(
          "logo",
          result
        );

        setLogoName(
          file.name
        );
      }
    };

    reader.readAsDataURL(
      file
    );
  }

  /* =========================================================
     INITIALS
  ========================================================= */

  function getInitials(
    value: string
  ) {
    const words =
      value
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (
      words.length === 0
    ) {
      return "ST";
    }

    if (
      words.length === 1
    ) {
      return words[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      words[0][0] +
      words[1][0]
    ).toUpperCase();
  }

  const fontFamily =
    FONT_OPTIONS.find(
      (font) =>
        font.name ===
        design.font
    )?.family ||
    "Inter, Arial, sans-serif";

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC]">
        <p className="text-sm text-slate-500">
          Loading design...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC] text-[#111827]">

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="flex flex-col gap-4 border-b border-[#E7E9F3] pb-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="text-xs font-medium text-[#6B7280]">
              Store
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Design
            </h1>

            <p className="mt-1 text-sm text-[#6B7280]">
              Customize how your store looks to customers.
            </p>

          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={
                handleReset
              }
              className="inline-flex items-center gap-2 rounded-xl border border-[#E7E9F3] bg-white px-4 py-2.5 text-sm font-semibold text-[#4B5563] hover:bg-slate-50"
            >
              <RotateCcw
                size={15}
              />
              Reset
            </button>

            <button
              type="button"
              onClick={
                handleSave
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              {saved ? (
                <>
                  <Check
                    size={16}
                  />
                  Saved
                </>
              ) : (
                "Save changes"
              )}
            </button>

          </div>

        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">

          {/* SETTINGS */}

          <section className="space-y-5">

            {/* STORE IDENTITY */}

            <div className="rounded-2xl border border-[#E7E9F3] bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Palette
                    size={18}
                  />
                </div>

                <div>

                  <h2 className="text-sm font-bold">
                    Store identity
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    These details are shown to your customers.
                  </p>

                </div>

              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <Field
                  label="Store name"
                  value={
                    design.storeName
                  }
                  placeholder="Your store name"
                  onChange={(value) =>
                    updateDesign(
                      "storeName",
                      value
                    )
                  }
                />

                <Field
                  label="Assistant name"
                  value={
                    design.botName
                  }
                  placeholder="Your store assistant"
                  onChange={(value) =>
                    updateDesign(
                      "botName",
                      value
                    )
                  }
                />

              </div>

              <div className="mt-4">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Welcome message
                </label>

                <textarea
                  value={
                    design.welcomeMessage
                  }
                  onChange={(event) =>
                    updateDesign(
                      "welcomeMessage",
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Welcome to our store! How can we help you?"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

              </div>

            </div>

            {/* LOGO */}

            <div className="rounded-2xl border border-[#E7E9F3] bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-sm font-bold">
                Store logo
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Upload your real store logo.
              </p>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">

                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold text-white"
                  style={{
                    backgroundColor:
                      design.primaryColor,
                  }}
                >
                  {design.logo ? (
                    <img
                      src={
                        design.logo
                      }
                      alt="Store logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(
                      design.storeName
                    )
                  )}
                </div>

                <div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">

                    <Upload
                      size={15}
                    />

                    Upload logo

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleLogoUpload
                      }
                      className="hidden"
                    />

                  </label>

                  {logoName && (
                    <p className="mt-2 text-xs text-slate-400">
                      {logoName}
                    </p>
                  )}

                </div>

              </div>

            </div>

            {/* COLORS */}

            <div className="rounded-2xl border border-[#E7E9F3] bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-sm font-bold">
                Colors
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Choose your store's visual identity.
              </p>

              <div className="mt-5">

                <p className="text-sm font-medium text-slate-700">
                  Primary color
                </p>

                <div className="mt-3 flex flex-wrap gap-3">

                  {COLOR_PRESETS.map(
                    (color) => (
                      <button
                        key={
                          color
                        }
                        type="button"
                        onClick={() =>
                          updateDesign(
                            "primaryColor",
                            color
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200"
                        style={{
                          backgroundColor:
                            color,
                        }}
                      >
                        {design.primaryColor ===
                          color && (
                          <Check
                            size={
                              15
                            }
                            className="text-white"
                          />
                        )}
                      </button>
                    )
                  )}

                </div>

              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <ColorField
                  label="Primary"
                  value={
                    design.primaryColor
                  }
                  onChange={(value) =>
                    updateDesign(
                      "primaryColor",
                      value
                    )
                  }
                />

                <ColorField
                  label="Secondary"
                  value={
                    design.secondaryColor
                  }
                  onChange={(value) =>
                    updateDesign(
                      "secondaryColor",
                      value
                    )
                  }
                />

              </div>

            </div>

            {/* FONT */}

            <div className="rounded-2xl border border-[#E7E9F3] bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-sm font-bold">
                Typography
              </h2>

              <div className="relative mt-4">

                <select
                  value={
                    design.font
                  }
                  onChange={(event) =>
                    updateDesign(
                      "font",
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  {FONT_OPTIONS.map(
                    (font) => (
                      <option
                        key={
                          font.name
                        }
                        value={
                          font.name
                        }
                      >
                        {
                          font.name
                        }
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

              </div>

            </div>

          </section>

          {/* PREVIEW */}

          <section className="xl:sticky xl:top-6 xl:self-start">

            <div className="rounded-2xl border border-[#E7E9F3] bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <Smartphone
                      size={16}
                      className="text-slate-500"
                    />

                    <h2 className="text-sm font-bold">
                      Live preview
                    </h2>

                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Preview your customer experience.
                  </p>

                </div>

              </div>

              {/* STORE PREVIEW */}

              <div className="mt-5 overflow-hidden rounded-3xl border-[6px] border-slate-900 bg-white shadow-xl">

                <div
                  className="p-5 text-white"
                  style={{
                    backgroundColor:
                      design.primaryColor,
                    fontFamily,
                  }}
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/20 text-sm font-bold">

                      {design.logo ? (
                        <img
                          src={
                            design.logo
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(
                          design.storeName
                        )
                      )}

                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-base font-bold">
                        {design.storeName ||
                          "Your Store"}
                      </p>

                      <p className="mt-1 text-xs text-white/70">
                        Shop directly from our store
                      </p>

                    </div>

                  </div>

                </div>

                <div
                  className="min-h-[420px] bg-[#F8FAFC] p-4"
                  style={{
                    fontFamily,
                  }}
                >

                  <div className="rounded-2xl bg-white p-4 shadow-sm">

                    <div className="flex items-start gap-3">

                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{
                          backgroundColor:
                            design.secondaryColor,
                        }}
                      >
                        {getInitials(
                          design.botName
                        )}
                      </div>

                      <div className="rounded-2xl rounded-tl-none bg-slate-100 px-3 py-2.5">

                        <p className="text-xs leading-5 text-slate-700">
                          {design.welcomeMessage ||
                            "Your welcome message will appear here."}
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">

                    <PreviewBox
                      title="Products"
                      color={
                        design.primaryColor
                      }
                    />

                    <PreviewBox
                      title="Orders"
                      color={
                        design.secondaryColor
                      }
                    />

                  </div>

                </div>

              </div>

            </div>

          </section>

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
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        value={value}
        placeholder={
          placeholder
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
      />

    </div>
  );
}

/* =========================================================
   COLOR FIELD
========================================================= */

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="flex gap-2">

        <input
          type="color"
          value={
            /^#[0-9A-Fa-f]{6}$/.test(
              value
            )
              ? value
              : "#2563EB"
          }
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="h-11 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
        />

        <input
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
        />

      </div>

    </div>
  );
}

/* =========================================================
   PREVIEW BOX
========================================================= */

function PreviewBox({
  title,
  color,
}: {
  title: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">

      <div
        className="flex h-20 items-center justify-center rounded-xl text-xs font-bold text-white"
        style={{
          backgroundColor:
            color,
        }}
      >
        {title}
      </div>

      <p className="mt-2 text-xs font-semibold text-slate-700">
        {title}
      </p>

    </div>
  );
}