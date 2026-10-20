import {
  LayoutDashboard,
  Package,
  Database,
  BarChart3,
  Activity,
  Workflow,
} from "lucide-react";

const links = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "products", label: "محصولات", icon: Package },
  { id: "warehouse", label: "Data Warehouse", icon: Database },
  { id: "etl", label: "ETL Pipeline", icon: Workflow },
  { id: "reports", label: "گزارش‌ها", icon: BarChart3 },
];

export default function Sidebar({ activePage = "dashboard", onNavigate = () => {} }) {
  return (
    <aside className="w-full shrink-0 bg-slate-950 p-5 text-white md:min-h-screen md:w-64">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-300"><Activity size={24} /></div>
        <div>
          <h1 className="text-xl font-bold"><span className="text-cyan-400">DWH</span> Analytics</h1>
          <p className="mt-1 text-xs text-slate-400">Sales Data Warehouse</p>
        </div>
      </div>

      <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">منوی اصلی</p>
      <nav className="space-y-2">
        {links.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={activePage === id ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm transition ${
              activePage === id
                ? "bg-cyan-500 font-semibold text-white shadow-lg shadow-cyan-950/30"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-sm font-medium">ETL Pipeline</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <span className="rounded bg-slate-800 px-2 py-1">Source</span><span>→</span>
          <span className="rounded bg-slate-800 px-2 py-1">ETL</span><span>→</span>
          <span className="rounded bg-slate-800 px-2 py-1">DWH</span>
        </div>
      </div>
      <p className="mt-6 text-xs leading-5 text-slate-500">پروژه پوهنتونی تحلیل فروش با MySQL، Node.js و React</p>
    </aside>
  );
}
