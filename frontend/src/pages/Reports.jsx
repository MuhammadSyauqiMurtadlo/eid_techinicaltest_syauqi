import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api, { errorMessage } from "../lib/api";
import { useLookups } from "../hooks";
import {
  cleanParams,
  formatDate,
  formatNumber,
  formatShortDate,
  toISODate,
} from "../lib/format";
import FilterBar from "../components/FilterBar";
import {
  Alert,
  Pagination,
  Spinner,
  StatCard,
  TableMessage,
  btn,
  tdCls,
  thCls,
} from "../components/ui";

const defaultFilters = () => {
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return {
    date_from: toISODate(from),
    date_to: toISODate(),
    machine_id: "",
    shift_id: "",
  };
};

export default function Reports() {
  const { lookups } = useLookups();
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/reports", {
        params: cleanParams({ ...filters, page, per_page: 10 }),
      });
      setReport(data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const changeFilters = (next) => {
    setFilters(next);
    setPage(1);
  };

  // Data grafik: produksi bersih + reject ditumpuk (total = jumlah produksi)
  const byDate = useMemo(
    () =>
      (report?.by_date ?? []).map((d) => ({
        label: formatShortDate(d.date),
        good: d.quantity - d.reject,
        reject: d.reject,
      })),
    [report],
  );
  const byMachine = useMemo(
    () =>
      (report?.by_machine ?? []).map((m) => ({
        label: m.code,
        good: m.quantity - m.reject,
        reject: m.reject,
      })),
    [report],
  );

  async function exportCsv() {
    setExporting(true);
    setError("");
    try {
      const res = await api.get("/reports/export", {
        params: cleanParams(filters),
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-produksi-${filters.date_from || "semua"}_${filters.date_to || "semua"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(errorMessage(e, "Gagal mengekspor CSV."));
    } finally {
      setExporting(false);
    }
  }

  const summary = report?.summary;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Laporan Produksi</h1>
        <button
          className={btn.secondary}
          onClick={exportCsv}
          disabled={exporting || loading}
        >
          {exporting && <Spinner className="h-4 w-4" />} Ekspor CSV
        </button>
      </div>

      <Alert>{error}</Alert>

      <FilterBar
        filters={filters}
        onChange={changeFilters}
        lookups={lookups}
        onReset={() => changeFilters(defaultFilters())}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Produksi"
          value={summary ? formatNumber(summary.total_quantity) : "-"}
        />
        <StatCard
          label="Total Reject"
          value={summary ? formatNumber(summary.total_reject) : "-"}
          accent="text-red-600"
        />
        <StatCard
          label="Produksi Bersih"
          value={summary ? formatNumber(summary.total_good) : "-"}
          accent="text-emerald-600"
        />
        <StatCard
          label="Jumlah Catatan"
          value={summary ? formatNumber(summary.records_count) : "-"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Produksi per Tanggal"
          data={byDate}
          loading={loading}
        />
        <ChartCard
          title="Produksi per Mesin"
          data={byMachine}
          loading={loading}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className={thCls}>Tanggal</th>
                <th className={thCls}>Mesin</th>
                <th className={thCls}>Shift</th>
                <th className={thCls}>Operator</th>
                <th className={`${thCls} text-right`}>Jumlah</th>
                <th className={`${thCls} text-right`}>Reject</th>
                <th className={`${thCls} text-right`}>Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading || !report || report.records.data.length === 0 ? (
                <TableMessage colSpan={7} loading={loading}>
                  Tidak ada data pada filter ini.
                </TableMessage>
              ) : (
                report.records.data.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className={tdCls}>{formatDate(r.production_date)}</td>
                    <td className={tdCls}>
                      <span className="font-semibold">{r.machine.code}</span>{" "}
                      <span className="text-slate-500">{r.machine.name}</span>
                    </td>
                    <td className={tdCls}>{r.shift.name}</td>
                    <td className={tdCls}>{r.operator.name}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>
                      {formatNumber(r.quantity)}
                    </td>
                    <td
                      className={`${tdCls} text-right tabular-nums text-red-600`}
                    >
                      {formatNumber(r.reject_quantity)}
                    </td>
                    <td
                      className={`${tdCls} text-right tabular-nums text-emerald-600`}
                    >
                      {formatNumber(r.quantity - r.reject_quantity)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination meta={report?.records.meta} onPage={setPage} />
      </div>
    </div>
  );
}

function ChartCard({ title, data, loading }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
      {loading ? (
        <div className="flex h-[280px] items-center justify-center text-blue-600">
          <Spinner className="h-6 w-6" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
          Tidak ada data.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatNumber} />
            <Tooltip formatter={(value) => formatNumber(value)} />
            <Legend />
            <Bar
              dataKey="good"
              name="Produksi bersih"
              stackId="p"
              fill="#10b981"
            />
            <Bar dataKey="reject" name="Reject" stackId="p" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
