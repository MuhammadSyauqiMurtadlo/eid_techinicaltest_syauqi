import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { btn } from "./ui";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/machines", label: "Mesin" },
  { to: "/operators", label: "Operator", adminOnly: true },
  { to: "/production", label: "Produksi" },
  { to: "/reports", label: "Laporan" },
];

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();

  const linkCls = ({ isActive }) =>
    `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              S
            </span>
            <span className="font-semibold">Smart Manufacturing</span>
          </div>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {links
              .filter((l) => !l.adminOnly || isAdmin)
              .map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>
                  {l.label}
                </NavLink>
              ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
            <button className={btn.secondary} onClick={logout}>
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
