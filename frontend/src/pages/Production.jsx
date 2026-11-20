import { useCallback, useEffect, useMemo, useState } from "react";
import api, { errorMessage, fieldErrors } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLookups, useNotice } from "../hooks";
import {
  cleanParams,
  formatDate,
  formatNumber,
  toISODate,
} from "../lib/format";
import FilterBar from "../components/FilterBar";
import {
  Alert,
  ConfirmDialog,
  Field,
  Modal,
  Pagination,
  Spinner,
  TableMessage,
  btn,
  inputCls,
  tdCls,
  thCls,
} from "../components/ui";

const emptyFilters = {
  date_from: "",
  date_to: "",
  machine_id: "",
  shift_id: "",
};

export default function Production() {
  const { isAdmin } = useAuth();
  const { lookups } = useLookups();
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { record: obj | null }
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, showNotice] = useNotice();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/production-records", {
        params: cleanParams({ ...filters, page, per_page: 10 }),
      });
      setRecords(data.data);
      setMeta(data.meta);
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

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`/production-records/${toDelete.id}`);
      showNotice("success", "Data produksi berhasil dihapus.");
      setToDelete(null);
      load();
    } catch (e) {
      setToDelete(null);
      showNotice("error", errorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  const colSpan = isAdmin ? 8 : 7;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Data Produksi</h1>
        <button
          className={btn.primary}
          onClick={() => setModal({ record: null })}
        >
          + Input Produksi
        </button>
      </div>

      {notice && <Alert type={notice.type}>{notice.text}</Alert>}
      <Alert>{error}</Alert>

      <FilterBar
        filters={filters}
        onChange={changeFilters}
        lookups={lookups}
        onReset={() => changeFilters(emptyFilters)}
      />

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
                <th className={thCls}>Catatan</th>
                {isAdmin && <th className={`${thCls} text-right`}>Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading || records.length === 0 ? (
                <TableMessage colSpan={colSpan} loading={loading}>
                  Belum ada data produksi.
                </TableMessage>
              ) : (
                records.map((r) => (
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
                    <td className={`${tdCls} max-w-xs truncate text-slate-500`}>
                      {r.notes ?? "-"}
                    </td>
                    {isAdmin && (
                      <td className={`${tdCls} text-right`}>
                        <button
                          className={btn.link}
                          onClick={() => setModal({ record: r })}
                        >
                          Edit
                        </button>
                        <button
                          className={btn.linkDanger}
                          onClick={() => setToDelete(r)}
                        >
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {modal && (
        <ProductionFormModal
          key={modal.record?.id ?? "new"}
          record={modal.record}
          lookups={lookups}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onSaved={(message) => {
            setModal(null);
            showNotice("success", message);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Hapus data produksi?"
        message={
          toDelete &&
          `Data ${toDelete.machine.code} tanggal ${formatDate(toDelete.production_date)} (${toDelete.shift.name}) akan dihapus.`
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function ProductionFormModal({ record, lookups, isAdmin, onClose, onSaved }) {
  const editing = Boolean(record);

  // Role operator: operator dikunci ke dirinya sendiri (server juga memaksa hal yang sama)
  const operatorOptions = useMemo(() => {
    const list = [...lookups.operators];
    if (record?.operator && !list.some((o) => o.id === record.operator_id))
      list.push(record.operator);
    return list;
  }, [lookups.operators, record]);

  const [form, setForm] = useState({
    machine_id: record?.machine_id ?? "",
    operator_id:
      record?.operator_id ?? (isAdmin ? "" : (lookups.operators[0]?.id ?? "")),
    shift_id: record?.shift_id ?? "",
    production_date: record?.production_date ?? toISODate(),
    quantity: record?.quantity ?? "",
    reject_quantity: record?.reject_quantity ?? 0,
    notes: record?.notes ?? "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const operatorId = form.operator_id || lookups.operators[0]?.id || "";

  async function submit(e) {
    e.preventDefault();
    const local = {};
    if (!form.machine_id) local.machine_id = "Pilih mesin.";
    if (!operatorId) local.operator_id = "Operator wajib dipilih.";
    if (!form.shift_id) local.shift_id = "Pilih shift.";
    if (!form.production_date) local.production_date = "Tanggal wajib diisi.";
    if (form.quantity === "" || Number(form.quantity) < 0)
      local.quantity = "Jumlah produksi wajib diisi (≥ 0).";
    if (Number(form.reject_quantity || 0) > Number(form.quantity || 0))
      local.reject_quantity = "Reject tidak boleh melebihi jumlah produksi.";
    setErrors(local);
    if (Object.keys(local).length) return;

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        operator_id: operatorId,
        quantity: Number(form.quantity),
        reject_quantity: Number(form.reject_quantity || 0),
      };
      if (editing) await api.put(`/production-records/${record.id}`, payload);
      else await api.post("/production-records", payload);
      onSaved(
        editing
          ? "Data produksi diperbarui."
          : "Data produksi berhasil disimpan.",
      );
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={editing ? "Edit Data Produksi" : "Input Produksi"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Alert>{formError}</Alert>
        {!isAdmin && lookups.operators.length === 0 && (
          <Alert>
            Akun Anda belum terhubung dengan data operator aktif. Hubungi
            administrator.
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mesin" error={errors.machine_id}>
            <select
              className={inputCls}
              value={form.machine_id}
              onChange={set("machine_id")}
            >
              <option value="">Pilih mesin</option>
              {lookups.machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} · {m.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Operator"
            error={errors.operator_id}
            hint={!isAdmin ? "Otomatis sesuai akun Anda." : undefined}
          >
            <select
              className={inputCls}
              value={operatorId}
              onChange={set("operator_id")}
              disabled={!isAdmin}
            >
              <option value="">Pilih operator</option>
              {operatorOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.employee_code})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Shift" error={errors.shift_id}>
            <select
              className={inputCls}
              value={form.shift_id}
              onChange={set("shift_id")}
            >
              <option value="">Pilih shift</option>
              {lookups.shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tanggal produksi" error={errors.production_date}>
            <input
              type="date"
              className={inputCls}
              value={form.production_date}
              max={toISODate()}
              onChange={set("production_date")}
            />
          </Field>

          <Field label="Jumlah produksi" error={errors.quantity}>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={form.quantity}
              onChange={set("quantity")}
            />
          </Field>

          <Field label="Jumlah reject" error={errors.reject_quantity}>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={form.reject_quantity}
              onChange={set("reject_quantity")}
            />
          </Field>
        </div>

        <Field label="Catatan" error={errors.notes}>
          <textarea
            rows={3}
            maxLength={500}
            className={inputCls}
            value={form.notes}
            onChange={set("notes")}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className={btn.secondary}
            onClick={onClose}
            disabled={saving}
          >
            Batal
          </button>
          <button type="submit" className={btn.primary} disabled={saving}>
            {saving && <Spinner className="h-4 w-4" />} Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}
