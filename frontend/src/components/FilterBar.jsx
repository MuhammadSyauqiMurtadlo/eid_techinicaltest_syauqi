import { Field, btn, inputCls } from "./ui";

export default function FilterBar({ filters, onChange, lookups, onReset }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <Field label="Dari tanggal">
        <input
          type="date"
          className={inputCls}
          value={filters.date_from}
          max={filters.date_to || undefined}
          onChange={set("date_from")}
        />
      </Field>
      <Field label="Sampai tanggal">
        <input
          type="date"
          className={inputCls}
          value={filters.date_to}
          min={filters.date_from || undefined}
          onChange={set("date_to")}
        />
      </Field>
      <Field label="Mesin">
        <select
          className={inputCls}
          value={filters.machine_id}
          onChange={set("machine_id")}
        >
          <option value="">Semua mesin</option>
          {lookups.machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.code} · {m.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Shift">
        <select
          className={inputCls}
          value={filters.shift_id}
          onChange={set("shift_id")}
        >
          <option value="">Semua shift</option>
          {lookups.shifts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)})
            </option>
          ))}
        </select>
      </Field>
      <button type="button" className={btn.secondary} onClick={onReset}>
        Reset filter
      </button>
    </div>
  );
}
