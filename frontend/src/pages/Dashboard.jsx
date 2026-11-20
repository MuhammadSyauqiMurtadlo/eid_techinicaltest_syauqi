import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { errorMessage } from "../lib/api";
import { createEcho } from "../lib/echo";
import { useAuth } from "../context/AuthContext";
import { useNow } from "../hooks";
import {
  STATUS,
  STATUS_KEYS,
  formatNumber,
  tempLevel,
  timeAgo,
} from "../lib/format";
import { Alert, Spinner, StatCard, StatusBadge } from "../components/ui";

const CONNECTION = {
  live: {
    label: "Live",
    cls: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500 animate-pulse",
  },
  connecting: {
    label: "Menghubungkan...",
    cls: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500 animate-pulse",
  },
  disconnected: {
    label: "Disconnected",
    cls: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

const sortByCode = (list) =>
  [...list].sort((a, b) => a.code.localeCompare(b.code));

export default function Dashboard() {
  const { token } = useAuth();
  const now = useNow(1000);
  const [machines, setMachines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("connecting");
  const reconnected = useRef(false);

  const loadMachines = useCallback(async () => {
    try {
      const { data } = await api.get("/machines");
      setMachines(data.data);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/summary");
      setSummary(data);
    } catch {
      /* ringkasan bersifat pelengkap */
    }
  }, []);

  useEffect(() => {
    loadMachines();
    loadSummary();
    const t = setInterval(loadSummary, 30000); // total produksi hari ini disegarkan berkala
    return () => clearInterval(t);
  }, [loadMachines, loadSummary]);

  // WebSocket (Laravel Echo + Reverb, private channel)
  useEffect(() => {
    if (!token) return undefined;

    const echo = createEcho(token);
    const connection$ = echo.connector.pusher.connection;

    const onState = ({ current }) => {
      if (current === "connected") {
        setConnection("live");
        // setelah putus lalu tersambung lagi → sinkron ulang data yang terlewat
        if (reconnected.current) loadMachines();
        reconnected.current = true;
      } else if (current === "connecting" || current === "initialized") {
        setConnection("connecting");
      } else {
        setConnection("disconnected");
      }
    };
    connection$.bind("state_change", onState);

    echo
      .private("machines")
      .listen(".machine.updated", ({ machine, deleted }) => {
        setMachines((prev) => {
          if (deleted) return prev.filter((m) => m.id !== machine.id);
          const exists = prev.some((m) => m.id === machine.id);
          return sortByCode(
            exists
              ? prev.map((m) => (m.id === machine.id ? machine : m))
              : [...prev, machine],
          );
        });
      })
      .error(() => setConnection("disconnected")); // gagal auth channel

    return () => {
      connection$.unbind("state_change", onState);
      echo.leave("machines");
      echo.disconnect();
    };
  }, [token, loadMachines]);

  // Hitung ringkasan status langsung dari state (ikut real-time)
  const counts = useMemo(() => {
    const c = { running: 0, idle: 0, maintenance: 0, error: 0 };
    machines.forEach((m) => {
      c[m.status] += 1;
    });
    return c;
  }, [machines]);

  const totalOutput = useMemo(
    () => machines.reduce((sum, m) => sum + (m.output_per_minute ?? 0), 0),
    [machines],
  );
  const conn = CONNECTION[connection];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Monitoring Produksi</h1>
          <p className="text-sm text-slate-500">
            Status mesin diperbarui otomatis tanpa refresh.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${conn.cls}`}
        >
          <span className={`h-2 w-2 rounded-full ${conn.dot}`} />
          {conn.label}
        </span>
      </div>

      <Alert>{error}</Alert>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {STATUS_KEYS.map((key) => (
          <StatCard
            key={key}
            label={STATUS[key].label}
            value={counts[key]}
            accent={STATUS[key].text}
            hint={`dari ${machines.length} mesin`}
          />
        ))}
        <StatCard
          label="Total Produksi Hari Ini"
          value={summary ? formatNumber(summary.today.total_quantity) : "-"}
          hint={`${formatNumber(totalOutput)} barang/menit saat ini`}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-blue-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : machines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          Belum ada data mesin.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {machines.map((m) => (
            <MachineCard key={m.id} machine={m} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

function MachineCard({ machine: m, now }) {
  const status = STATUS[m.status] ?? STATUS.idle;
  const temp = tempLevel(m.temperature);

  // Animasi singkat setiap kali data mesin berubah
  const signature = `${m.status}|${m.temperature}|${m.output_per_minute}|${m.current_operator_id}`;
  const previous = useRef(signature);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (previous.current !== signature) {
      previous.current = signature;
      setPulse((p) => p + 1);
    }
  }, [signature]);

  return (
    <div
      className={`relative rounded-xl border border-l-4 border-slate-200 bg-white p-5 shadow-sm ${status.border}`}
    >
      {pulse > 0 && <span key={pulse} className="flash-overlay" />}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{m.code}</h3>
          <p className="text-sm text-slate-500">
            {m.type} · {m.name}
          </p>
        </div>
        <StatusBadge status={m.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400">Temperatur</p>
          <p
            className={`flex items-center gap-2 text-xl font-semibold tabular-nums ${temp.text}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${temp.dot}`} />
            {m.temperature !== null ? `${m.temperature.toFixed(1)}°C` : "-"}
          </p>
          <p className={`text-xs ${temp.text}`}>{temp.label}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Output / menit</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatNumber(m.output_per_minute)}
          </p>
          <p className="text-xs text-slate-400">barang</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>
          Operator:{" "}
          <b className="text-slate-700">{m.current_operator?.name ?? "—"}</b>
        </span>
        <span title={m.last_reported_at ?? ""}>
          {timeAgo(m.last_reported_at, now)}
        </span>
      </div>
    </div>
  );
}
