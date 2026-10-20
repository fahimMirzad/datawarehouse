import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users, ShoppingCart, DollarSign, CheckCircle, RefreshCw, Package,
  Database, CalendarDays, Search, AlertCircle, BarChart3, Layers3, Workflow, Clock3, CheckCircle2, XCircle, Play,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LineChart, Line,
} from "recharts";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";

const API_URL = "http://localhost:5000/api";
const money = (value) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 2,
}).format(Number(value) || 0);
const number = (value) => new Intl.NumberFormat("en-US").format(Number(value) || 0);
const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

function PageHeading({ eyebrow, title, description, action }) {
  return <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
    <div><p className="text-sm font-medium text-cyan-700">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p></div>
    {action}
  </header>;
}

function RefreshButton({ onClick, loading }) {
  return <button onClick={onClick} disabled={loading} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
    <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> بروزرسانی اطلاعات
  </button>;
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouse, setWarehouse] = useState({ tables: [], sales: [] });
  const [reports, setReports] = useState({ monthly: [], topProducts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [etlStatus, setEtlStatus] = useState({ state: "loading", stage: "در حال خواندن وضعیت ETL", logs: [], counts: {} });
  const [etlBusy, setEtlBusy] = useState(false);
  const [etlMessage, setEtlMessage] = useState("");

  const fetchDashboard = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const endpoints = [
        `${API_URL}/dashboard/summary`, `${API_URL}/products`,
        `${API_URL}/warehouse/overview`, `${API_URL}/warehouse/recent-sales`,
        `${API_URL}/reports/sales`,
      ];
      const responses = await Promise.all(endpoints.map((url) => fetch(url)));
      const failed = responses.find((response) => !response.ok);
      if (failed) throw new Error(`API request failed (${failed.status})`);
      const [summaryData, productsData, warehouseData, salesData, reportsData] =
        await Promise.all(responses.map((response) => response.json()));
      setSummary(summaryData);
      setProducts(productsData);
      setWarehouse({ tables: warehouseData.tables || [], sales: salesData || [] });
      setReports({ monthly: reportsData.monthly || [], topProducts: reportsData.topProducts || [] });
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setError("اطلاعات از Backend دریافت نشد. مطمئن شوید MySQL و Backend فعال اند و دیتابیس Data Warehouse ایجاد شده است.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const fetchEtlStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/etl/status`);
      if (!response.ok) throw new Error(`ETL status API failed (${response.status})`);
      const data = await response.json();
      setEtlStatus(data);
      setEtlBusy(data.state === "running");
    } catch (err) {
      setEtlMessage("وضعیت ETL دریافت نشد. مطمئن شوید Backend فعال است.");
    }
  }, []);

  useEffect(() => { fetchEtlStatus(); }, [fetchEtlStatus]);
  useEffect(() => {
    if (activePage !== "etl" || etlStatus.state !== "running") return undefined;
    const timer = setInterval(fetchEtlStatus, 1500);
    return () => clearInterval(timer);
  }, [activePage, etlStatus.state, fetchEtlStatus]);

  const runEtl = async () => {
    setEtlMessage("");
    setEtlBusy(true);
    try {
      const response = await fetch(`${API_URL}/etl/run`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "اجرای ETL شروع نشد.");
      setEtlStatus(result.status);
      setEtlMessage("فرآیند واقعی ETL شروع شد؛ وضعیت و لاگ‌ها به‌صورت خودکار تازه می‌شوند.");
    } catch (err) {
      setEtlMessage(err.message || "اجرای ETL ناموفق بود.");
      setEtlBusy(false);
    }
    fetchEtlStatus();
  };


  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) =>
      String(product.product_name || "").toLowerCase().includes(query) ||
      String(product.source_product_id || product.product_id || "").includes(query)
    );
  }, [products, search]);

  const renderProductsTable = () => <div className={`${panel} overflow-hidden !p-0`}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
      <div><h3 className="font-bold text-slate-900">فهرست محصولات</h3><p className="mt-1 text-sm text-slate-500">داده‌ها از جدول dim_product در انبار داده خوانده می‌شوند.</p></div>
      <div className="relative"><Search size={16} className="absolute right-3 top-3 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی محصول..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-3 pr-9 text-sm outline-none focus:border-cyan-500 sm:w-64" /></div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-right text-sm">
      <thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-4 font-medium">کلید DWH</th><th className="px-5 py-4 font-medium">شناسه منبع</th><th className="px-5 py-4 font-medium">نام محصول</th><th className="px-5 py-4 font-medium">قیمت فعلی</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{filteredProducts.map((p) => <tr key={p.product_id} className="hover:bg-slate-50"><td className="px-5 py-4">{p.product_id}</td><td className="px-5 py-4">{p.source_product_id ?? "—"}</td><td className="px-5 py-4 font-medium text-slate-800">{p.product_name}</td><td className="px-5 py-4">{money(p.price)}</td></tr>)}
      {!filteredProducts.length && <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-400">محصولی پیدا نشد.</td></tr>}</tbody>
    </table></div>
  </div>;

  const renderDashboard = () => <>
    <PageHeading eyebrow="Sales Data Warehouse" title="داشبورد فروش" description="خلاصه شاخص‌های کلیدی و وضعیت فروش" action={<RefreshButton onClick={fetchDashboard} loading={loading} />} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="مجموع فروش تکمیل‌شده" value={summary ? money(summary.total_sales) : "—"} icon={DollarSign} color="bg-emerald-100 text-emerald-700" />
      <StatCard title="تمام سفارش‌ها" value={summary ? number(summary.total_orders) : "—"} icon={ShoppingCart} color="bg-blue-100 text-blue-700" />
      <StatCard title="سفارش‌های تکمیل‌شده" value={summary ? number(summary.completed_orders) : "—"} icon={CheckCircle} color="bg-violet-100 text-violet-700" />
      <StatCard title="مشتریان" value={summary ? number(summary.total_customers) : "—"} icon={Users} color="bg-amber-100 text-amber-700" />
    </section>
    <section className="mt-6 grid gap-6 xl:grid-cols-3">
      <div className={`${panel} xl:col-span-2`}><h3 className="font-bold text-slate-900">فروش ماهانه</h3><p className="mb-5 mt-1 text-sm text-slate-500">جمع مبلغ فروش بر اساس سال و ماه ثبت‌شده در dim_date</p><div className="h-72">
        {reports.monthly.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={reports.monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Line type="monotone" dataKey="sales" name="فروش" stroke="#0891b2" strokeWidth={3} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer> : <EmptyState loading={loading} />}</div></div>
      <div className={panel}><h3 className="font-bold text-slate-900">وضعیت اتصال</h3><div className="mt-5 space-y-4"><StatusRow label="Backend API" value={error ? "خطا" : summary ? "متصل" : "در انتظار"} good={!error && Boolean(summary)} /><StatusRow label="محصولات در انبار" value={number(products.length)} /><StatusRow label="جدول‌های DWH" value={number(warehouse.tables.length)} /><div className="rounded-xl bg-cyan-50 p-4"><Database className="mb-2 text-cyan-700" size={22} /><p className="font-semibold text-slate-800">ساختار Star Schema</p><p className="mt-1 text-xs leading-5 text-slate-600">Fact Sales همراه با ابعاد مشتری، محصول و تاریخ.</p></div></div></div>
    </section>
    <section className="mt-6">{renderProductsTable()}</section>
  </>;

  const renderWarehouse = () => <>
    <PageHeading eyebrow="Warehouse Explorer" title="انبار داده (Data Warehouse)" description="بررسی جدول‌های ابعادی و جدول واقعیت فروش" action={<RefreshButton onClick={fetchDashboard} loading={loading} />} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{warehouse.tables.map((table) => <div className={panel} key={table.table_name}><div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-50 p-3 text-cyan-700"><Database size={20} /></div><div><p className="text-sm text-slate-500">جدول</p><p className="font-bold">{table.table_name}</p></div></div><p className="mt-5 text-3xl font-bold">{number(table.row_count)}</p><p className="mt-1 text-xs text-slate-500">تعداد رکوردها</p></div>)}</div>
    <div className={`${panel} mt-6`}><h3 className="font-bold">جریان داده</h3><div className="mt-4 grid gap-3 text-center sm:grid-cols-3"><FlowBox title="Source Database" detail="sales_source" /><FlowBox title="ETL Process" detail="Extract → Transform → Load" /><FlowBox title="Data Warehouse" detail="sales_warehouse" /></div><p className="mt-4 text-sm leading-6 text-slate-600">در این مدل، اطلاعات فروش در fact_sales ذخیره می‌شود و از طریق کلیدهای خارجی به dim_customer، dim_product و dim_date وصل است. این طراحی تحلیل فروش بر اساس مشتری، محصول و زمان را آسان می‌کند.</p></div>
    <div className={`${panel} mt-6`}><h3 className="mb-4 font-bold">آخرین ۱۰۰ رکورد فروش از fact_sales</h3><div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Order ID", "مشتری", "محصول", "تاریخ", "تعداد", "مبلغ", "وضعیت"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{warehouse.sales.map((s) => <tr key={s.sales_key}><td className="px-4 py-3">{s.source_order_id}</td><td className="px-4 py-3">{s.customer_name || "—"}</td><td className="px-4 py-3">{s.product_name || "—"}</td><td className="px-4 py-3">{s.full_date || "—"}</td><td className="px-4 py-3">{number(s.quantity)}</td><td className="px-4 py-3">{money(s.total_amount)}</td><td className="px-4 py-3">{s.order_status || "—"}</td></tr>)}{!warehouse.sales.length && <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400">هنوز رکورد فروش موجود نیست.</td></tr>}</tbody></table></div></div>
  </>;

  const renderReports = () => <>
    <PageHeading eyebrow="Business Intelligence" title="گزارش‌های فروش" description="تحلیل فروش ماهانه و محصولات پرفروش از جداول انبار داده" action={<RefreshButton onClick={fetchDashboard} loading={loading} />} />
    <section className="grid gap-6 xl:grid-cols-2"><div className={panel}><h3 className="font-bold">مقایسه فروش ماهانه</h3><p className="mb-5 mt-1 text-sm text-slate-500">مبلغ فروش تکمیل‌شده بر حسب ماه</p><div className="h-80">{reports.monthly.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={reports.monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="sales" name="فروش" fill="#0891b2" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyState loading={loading} />}</div></div>
      <div className={panel}><h3 className="font-bold">ده محصول پرفروش</h3><p className="mb-5 mt-1 text-sm text-slate-500">مرتب‌شده بر اساس مجموع مبلغ فروش</p><div className="h-80">{reports.topProducts.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={reports.topProducts} layout="vertical" margin={{ left: 15 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis type="category" dataKey="product_name" width={110} tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="sales" name="فروش" fill="#7c3aed" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer> : <EmptyState loading={loading} />}</div></div></section>
    <div className={`${panel} mt-6`}><h3 className="mb-4 font-bold">خلاصه محصولات پرفروش</h3><div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">رتبه</th><th className="px-4 py-3">محصول</th><th className="px-4 py-3">تعداد فروخته‌شده</th><th className="px-4 py-3">مجموع فروش</th></tr></thead><tbody className="divide-y divide-slate-100">{reports.topProducts.map((p, i) => <tr key={p.product_name}><td className="px-4 py-3">{i + 1}</td><td className="px-4 py-3 font-medium">{p.product_name}</td><td className="px-4 py-3">{number(p.quantity)}</td><td className="px-4 py-3">{money(p.sales)}</td></tr>)}{!reports.topProducts.length && <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">داده‌ای برای گزارش موجود نیست.</td></tr>}</tbody></table></div></div>
  </>;

  const renderEtl = () => {
    const state = etlStatus.state || "idle";
    const statusStyle = state === "success" ? "bg-emerald-100 text-emerald-700" : state === "failed" ? "bg-rose-100 text-rose-700" : state === "running" ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-600";
    const countItems = Object.entries(etlStatus.counts || {}).filter(([key, value]) => typeof value === "number" && /source|loaded|rejected|extracted|transformed/.test(key));
    return <>
      <PageHeading eyebrow="Extract · Transform · Load" title="مدیریت ETL Pipeline" description="اجرای واقعی اسکریپت ETL، مشاهده مرحله فعلی، تعداد رکوردها و گزارش خطاها" action={<div className="flex flex-wrap gap-2"><button onClick={fetchEtlStatus} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium"><RefreshCw size={16}/> تازه‌سازی وضعیت</button><button onClick={runEtl} disabled={etlBusy} className="flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"><Play size={16}/> {etlBusy ? "ETL در حال اجراست..." : "اجرای ETL واقعی"}</button></div>} />
      {etlMessage && <div role="status" className="mb-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">{etlMessage}</div>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={panel}><p className="text-sm text-slate-500">وضعیت اجرا</p><div className="mt-3 flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusStyle}`}>{state === "idle" ? "اجرا نشده" : state === "running" ? "در حال اجرا" : state === "success" ? "موفق" : state === "failed" ? "ناموفق" : state}</span>{state === "success" ? <CheckCircle2 className="text-emerald-600"/> : state === "failed" ? <XCircle className="text-rose-600"/> : state === "running" ? <RefreshCw className="animate-spin text-cyan-700"/> : <Workflow className="text-slate-400"/>}</div></div>
        <div className={panel}><p className="text-sm text-slate-500">مرحله فعلی</p><p className="mt-3 font-bold text-slate-900">{etlStatus.stage || "در انتظار اجرا"}</p></div>
        <div className={panel}><p className="text-sm text-slate-500">شروع آخرین اجرا</p><p className="mt-3 font-semibold text-slate-900">{etlStatus.startedAt ? new Date(etlStatus.startedAt).toLocaleString() : "—"}</p></div>
        <div className={panel}><p className="text-sm text-slate-500">مدت اجرا</p><p className="mt-3 flex items-center gap-2 font-semibold text-slate-900"><Clock3 size={17}/>{etlStatus.durationMs != null ? `${(etlStatus.durationMs / 1000).toFixed(1)} ثانیه` : state === "running" && etlStatus.startedAt ? "در حال محاسبه..." : "—"}</p></div>
      </section>
      <section className={`${panel} mt-6`}><h3 className="font-bold text-slate-900">جریان واقعی داده</h3><p className="mt-1 text-sm text-slate-500">این مراحل با اجرای فایل‌های etl/extract.js، transform.js و load.js به‌روزرسانی می‌شوند.</p><div className="mt-5 grid gap-3 text-center md:grid-cols-3"><FlowBox title="1. Extract" detail="خواندن customers, products, orders, order_items از sales_source"/><FlowBox title="2. Transform" detail="پاک‌سازی و اعتبارسنجی رکوردها"/><FlowBox title="3. Load" detail="درج/به‌روزرسانی dim tables و fact_sales در sales_warehouse"/></div></section>
      <section className={`${panel} mt-6`}><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold">آمار رکوردهای پردازش‌شده</h3><p className="mt-1 text-sm text-slate-500">مقادیر از خروجی واقعی اجرای ETL دریافت می‌شوند؛ نه ارقام نمونه.</p></div><span className="text-xs text-slate-400">{countItems.length} شاخص</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{countItems.map(([key, value]) => <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="break-words text-xs text-slate-500">{key.replaceAll("_", " ")}</p><p className="mt-2 text-2xl font-bold text-slate-900">{number(value)}</p></div>)}{!countItems.length && <p className="col-span-full py-5 text-center text-sm text-slate-400">پس از اجرای ETL، شمار رکوردهای استخراج‌شده، تبدیل‌شده، بارگذاری‌شده و ردشده اینجا نمایش داده می‌شود.</p>}</div></section>
      {etlStatus.error && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><strong>خطا:</strong> {etlStatus.error}</div>}
      <section className={`${panel} mt-6`}><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold">گزارش اجرای ETL (Logs)</h3><p className="mt-1 text-sm text-slate-500">آخرین ۱۵۰ پیام از فرآیند واقعی Backend</p></div><span className="text-xs text-slate-400">{(etlStatus.logs || []).length} پیام</span></div><div className="max-h-96 space-y-2 overflow-y-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200" aria-live="polite">{(etlStatus.logs || []).slice().reverse().map((log, index) => <div key={`${log.time}-${index}`} className="border-b border-slate-800 pb-2 last:border-0"><span className="text-cyan-400">[{new Date(log.time).toLocaleTimeString()}]</span> <span className={/ERROR|failed|Failed/i.test(log.message) ? "text-rose-300" : ""}>{log.message}</span></div>)}{!(etlStatus.logs || []).length && <p className="text-slate-500">هنوز گزارشی ثبت نشده است. برای شروع روی «اجرای ETL واقعی» کلیک کنید.</p>}</div></section>
      <p className="mt-4 text-xs leading-5 text-slate-500">نکته: اجرای ETL به فعال بودن MySQL و وجود دیتابیس‌های sales_source و sales_warehouse با ساختار سازگار نیاز دارد. اگر اتصال یا SQL خطا داشته باشد، خطا در همین صفحه ثبت می‌شود.</p>
    </>;
  };

  return <div className="min-h-screen bg-slate-50 md:flex" dir="rtl">
    <Sidebar activePage={activePage} onNavigate={setActivePage} />
    <main className="min-w-0 flex-1 p-4 md:p-8">
      {error && <div role="alert" className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertCircle className="shrink-0" size={20} /><div>{error}<button onClick={fetchDashboard} className="mr-3 font-bold underline">تلاش دوباره</button></div></div>}
      {loading && !summary && <div className="mb-6 rounded-xl bg-white p-4 text-sm text-slate-500">در حال دریافت اطلاعات از انبار داده...</div>}
      {activePage === "dashboard" && renderDashboard()}
      {activePage === "products" && <><PageHeading eyebrow="Product Dimension" title="محصولات" description="جستجو و بررسی محصولات ثبت‌شده در dim_product" action={<RefreshButton onClick={fetchDashboard} loading={loading} />} />{renderProductsTable()}</>}
      {activePage === "warehouse" && renderWarehouse()}
      {activePage === "etl" && renderEtl()}
      {activePage === "reports" && renderReports()}
      <footer className="py-7 text-center text-xs text-slate-400">Sales Data Warehouse Project · React + Node.js + MySQL · Star Schema</footer>
    </main>
  </div>;
}

function EmptyState({ loading }) { return <div className="flex h-full items-center justify-center text-sm text-slate-400">{loading ? "در حال بارگذاری..." : "داده کافی برای نمایش نمودار موجود نیست."}</div>; }
function StatusRow({ label, value, good }) { return <div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-600">{label}</span><span className={`rounded-full px-3 py-1 text-xs ${good ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{value}</span></div>; }
function FlowBox({ title, detail }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><Layers3 className="mx-auto mb-2 text-cyan-700" size={22} /><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }
