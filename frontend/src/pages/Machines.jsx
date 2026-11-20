import { useCallback, useEffect, useState } from "react";
import api, { errorMessage, fieldErrors } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useDebounce, useNotice } from "../hooks";
import {
  MACHINE_TYPES,
  STATUS,
  STATUS_KEYS,
  cleanParams,
  formatNumber,
  tempLevel,
} from "../lib/format";
import {
  Alert,
  ConfirmDialog,
  Field,
  Modal,
  Spinner,
  StatusBadge,
  TableMessage,
  btn,
  inputCls,
  tdCls,
  thCls,
} from "../components/ui";

export default function Machines() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ q: "", type: "", status: "" });
  const q = useDebounce(filters.q);
  const [modal, setModal] = useState(null); // { machine: obj | null }
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, showNotice] = useNotice();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/machines", {
        params: cleanParams({ q, type: filters.type, status: filters.status }),
      });
      setItems(data.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [q, filters.type, filters.status]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`/machines/${toDelete.id}`);
      showNotice("success", `Mesin ${toDelete.code} berhasil dihapus.`);
      setToDelete(null);
      load();
    } catch (e) {
      setToDelete(null);
      showNotice("error", errorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  const colSpan = isAdmin ? 9 : 8;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Data Mesin</h1>
          {!isAdmin && (
            <p className="text-sm text-slate-500">Mode baca saja.</p>
          )}
        </div>
        {isAdmin && (
          <button
            className={btn.primary}
            onClick={() => setModal({ machine: null })}
          >
            + Tambah Mesin
          </button>
        )}
      </div>

      {notice && <Alert type={notice.type}>{notice.text}</Alert>}
      <Alert>{error}</Alert>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <input
          className={inputCls}
          placeholder="Cari kode atau nama mesin..."
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          className={inputCls}
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">Semua tipe</option>
          {MACHINE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          className={inputCls}
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="">Semua status</option>
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s}>
              {STATUS[s].label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Kode</th>
              <th className={thCls}>Nama</th>
              <th className={thCls}>Tipe</th>
              <th className={thCls}>Lokasi</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Temperatur</th>
              <th className={thCls}>Output/menit</th>
              <th className={thCls}>Operator</th>
              {isAdmin && <th className={`${thCls} text-right`}>Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading || items.length === 0 ? (
              <TableMessage colSpan={colSpan} loading={loading}>
                Tidak ada mesin yang cocok.
              </TableMessage>
            ) : (
              items.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className={`${tdCls} font-semibold`}>{m.code}</td>
                  <td className={tdCls}>{m.name}</td>
                  <td className={tdCls}>{m.type}</td>
                  <td className={tdCls}>{m.location ?? "-"}</td>
                  <td className={tdCls}>
                    <StatusBadge status={m.status} />
                  </td>
                  <td
                    className={`${tdCls} tabular-nums ${tempLevel(m.temperature).text}`}
                  >
                    {m.temperature !== null
                      ? `${m.temperature.toFixed(1)}°C`
                      : "-"}
                  </td>
                  <td className={`${tdCls} tabular-nums`}>
                    {formatNumber(m.output_per_minute)}
                  </td>
                  <td className={tdCls}>{m.current_operator?.name ?? "-"}</td>
                  {isAdmin && (
                    <td className={`${tdCls} text-right`}>
                      <button
                        className={btn.link}
                        onClick={() => setModal({ machine: m })}
                      >
                        Edit
                      </button>
                      <button
                        className={btn.linkDanger}
                        onClick={() => setToDelete(m)}
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

      {modal && (
        <MachineFormModal
          key={modal.machine?.id ?? "new"}
          machine={modal.machine}
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
        title="Hapus mesin?"
        message={
          toDelete &&
          `Mesin ${toDelete.code} (${toDelete.name}) akan dihapus permanen.`
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function MachineFormModal({ machine, onClose, onSaved }) {
  const editing = Boolean(machine);
  const [form, setForm] = useState({
    code: machine?.code ?? "",
    name: machine?.name ?? "",
    type: machine?.type ?? "CNC",
    location: machine?.location ?? "",
    status: machine?.status ?? "idle",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const local = {};
    if (!form.code.trim()) local.code = "Kode wajib diisi.";
    if (!form.name.trim()) local.name = "Nama wajib diisi.";
    setErrors(local);
    if (Object.keys(local).length) return;

    setSaving(true);
    setFormError("");
    try {
      if (editing) await api.put(`/machines/${machine.id}`, form);
      else await api.post("/machines", form);
      onSaved(
        editing ? "Mesin berhasil diperbarui." : "Mesin berhasil ditambahkan.",
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
      title={editing ? "Edit Mesin" : "Tambah Mesin"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Alert>{formError}</Alert>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kode" error={errors.code} hint="Contoh: CNC-01">
            <input
              className={inputCls}
              value={form.code}
              onChange={set("code")}
              autoFocus
            />
          </Field>
          <Field label="Tipe" error={errors.type}>
            <select
              className={inputCls}
              value={form.type}
              onChange={set("type")}
            >
              {MACHINE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Nama mesin" error={errors.name}>
          <input
            className={inputCls}
            value={form.name}
            onChange={set("name")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lokasi" error={errors.location}>
            <input
              className={inputCls}
              value={form.location}
              onChange={set("location")}
            />
          </Field>
          <Field label="Status" error={errors.status}>
            <select
              className={inputCls}
              value={form.status}
              onChange={set("status")}
            >
              {STATUS_KEYS.map((s) => (
                <option key={s} value={s}>
                  {STATUS[s].label}
                </option>
              ))}
            </select>
          </Field>
        </div>

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
