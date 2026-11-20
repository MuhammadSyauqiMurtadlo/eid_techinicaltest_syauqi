export const MACHINE_TYPES = ["CNC", "Milling", "Press", "Assembly"];
export const STATUS_KEYS = ["running", "idle", "maintenance", "error"];

export const STATUS = {
  running: {
    label: "Running",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    text: "text-emerald-600",
  },
  idle: {
    label: "Idle",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
    border: "border-l-amber-400",
    text: "text-amber-600",
  },
  maintenance: {
    label: "Maintenance",
    badge: "bg-sky-50 text-sky-700 ring-sky-600/20",
    dot: "bg-sky-500",
    border: "border-l-sky-500",
    text: "text-sky-600",
  },
  error: {
    label: "Error",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
    border: "border-l-red-500",
    text: "text-red-600",
  },
};

/** Ambang temperatur: <70 normal, 70-85 waspada, >85 panas */
export function tempLevel(temp) {
  if (temp === null || temp === undefined)
    return { text: "text-slate-400", dot: "bg-slate-300", label: "-" };
  if (temp < 70)
    return { text: "text-emerald-600", dot: "bg-emerald-500", label: "Normal" };
  if (temp <= 85)
    return { text: "text-amber-600", dot: "bg-amber-500", label: "Waspada" };
  return { text: "text-red-600", dot: "bg-red-500", label: "Panas" };
}

export const formatNumber = (n) =>
  new Intl.NumberFormat("id-ID").format(n ?? 0);

/** '2026-11-20' → '20 November 2026' (tanpa konversi timezone) */
export function formatDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

/** Tanggal lokal format YYYY-MM-DD */
export const toISODate = (date = new Date()) =>
  date.toLocaleDateString("en-CA");

export function timeAgo(iso, now = Date.now()) {
  if (!iso) return "Belum ada data";
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 5) return "baru saja";
  if (s < 60) return `${s} dtk lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const cleanParams = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== "" && v !== null && v !== undefined,
    ),
  );
