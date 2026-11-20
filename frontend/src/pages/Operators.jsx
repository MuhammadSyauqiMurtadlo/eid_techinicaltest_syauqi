import { useCallback, useEffect, useState } from "react";
import api, { errorMessage, fieldErrors } from "../lib/api";
import { useDebounce, useNotice } from "../hooks";
import { cleanParams } from "../lib/format";
import {
  Alert,
  ConfirmDialog,
  Field,
  Modal,
  Spinner,
  TableMessage,
  btn,
  inputCls,
  tdCls,
  thCls,
} from "../components/ui";

export default function Operators() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebounce(search);
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, showNotice] = useNotice();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/operators", {
        params: cleanParams({ q }),
      });
      setItems(data.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`/operators/${toDelete.id}`);
      showNotice("success", `Operator ${toDelete.name} berhasil dihapus.`);
      setToDelete(null);
      load();
    } catch (e) {
      setToDelete(null);
      showNotice("error", errorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Data Operator</h1>
        <button
          className={btn.primary}
          onClick={() => setModal({ operator: null })}
        >
          + Tambah Operator
        </button>
      </div>

      {notice && <Alert type={notice.type}>{notice.text}</Alert>}
      <Alert>{error}</Alert>

      <input
        className={`${inputCls} max-w-sm`}
        placeholder="Cari nama atau kode karyawan..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Kode</th>
              <th className={thCls}>Nama</th>
              <th className={thCls}>Email</th>
              <th className={thCls}>Telepon</th>
              <th className={thCls}>Status</th>
              <th className={`${thCls} text-right`}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading || items.length === 0 ? (
              <TableMessage colSpan={6} loading={loading}>
                Belum ada operator.
              </TableMessage>
            ) : (
              items.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className={`${tdCls} font-semibold`}>
                    {o.employee_code}
                  </td>
                  <td className={tdCls}>{o.name}</td>
                  <td className={tdCls}>{o.email}</td>
                  <td className={tdCls}>{o.phone ?? "-"}</td>
                  <td className={tdCls}>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        o.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {o.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className={`${tdCls} text-right`}>
                    <button
                      className={btn.link}
                      onClick={() => setModal({ operator: o })}
                    >
                      Edit
                    </button>
                    <button
                      className={btn.linkDanger}
                      onClick={() => setToDelete(o)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <OperatorFormModal
          key={modal.operator?.id ?? "new"}
          operator={modal.operator}
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
        title="Hapus operator?"
        message={
          toDelete &&
          `Operator ${toDelete.name} beserta akun loginnya akan dihapus.`
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function OperatorFormModal({ operator, onClose, onSaved }) {
  const editing = Boolean(operator);
  const [form, setForm] = useState({
    name: operator?.name ?? "",
    email: operator?.email ?? "",
    password: "",
    employee_code: operator?.employee_code ?? "",
    phone: operator?.phone ?? "",
    is_active: operator?.is_active ?? true,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const local = {};
    if (!form.name.trim()) local.name = "Nama wajib diisi.";
    if (!form.email.trim()) local.email = "Email wajib diisi.";
    if (!form.employee_code.trim())
      local.employee_code = "Kode karyawan wajib diisi.";
    if (!editing && form.password.length < 8)
      local.password = "Password minimal 8 karakter.";
    if (editing && form.password && form.password.length < 8)
      local.password = "Password minimal 8 karakter.";
    setErrors(local);
    if (Object.keys(local).length) return;

    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;

      if (editing) await api.put(`/operators/${operator.id}`, payload);
      else await api.post("/operators", payload);
      onSaved(
        editing
          ? "Operator berhasil diperbarui."
          : "Operator berhasil ditambahkan.",
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
      title={editing ? "Edit Operator" : "Tambah Operator"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Alert>{formError}</Alert>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama" error={errors.name}>
            <input
              className={inputCls}
              value={form.name}
              onChange={set("name")}
              autoFocus
            />
          </Field>
          <Field label="Kode karyawan" error={errors.employee_code}>
            <input
              className={inputCls}
              value={form.employee_code}
              onChange={set("employee_code")}
            />
          </Field>
        </div>

        <Field label="Email (untuk login)" error={errors.email}>
          <input
            type="email"
            className={inputCls}
            value={form.email}
            onChange={set("email")}
          />
        </Field>

        <Field
          label="Password"
          error={errors.password}
          hint={
            editing
              ? "Kosongkan jika tidak ingin mengubah password."
              : "Minimal 8 karakter."
          }
        >
          <input
            type="password"
            autoComplete="new-password"
            className={inputCls}
            value={form.password}
            onChange={set("password")}
          />
        </Field>

        <Field label="Telepon" error={errors.phone}>
          <input
            className={inputCls}
            value={form.phone}
            onChange={set("phone")}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={form.is_active}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_active: e.target.checked }))
            }
          />
          Operator aktif (boleh login)
        </label>

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
