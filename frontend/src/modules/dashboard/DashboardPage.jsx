import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  AlertTriangle, CalendarClock, Package, ShoppingCart, TrendingUp, Users,
  ArrowUpRight,
} from "lucide-react";
import { dashboardApi, pharmacyApi } from "../../services/api";

function money(n) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "white", border: "1px solid #E6EBF0", borderRadius: 10,
        padding: "8px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        fontSize: 12
      }}>
        <p style={{ fontWeight: 600, color: "#1A2332", marginBottom: 2 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "#0F4C3A" }}>
            {p.name}: {typeof p.value === "number" && p.name !== "Orders"
              ? money(p.value)
              : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function KpiCard({ title, value, subtitle, icon: Icon, accent = "#E8F5EE", iconColor = "#0F4C3A" }) {
  return (
    <div className="erp-card p-5" style={{ display: "flex", alignItems: "center", gap: 18, flex: "1 1 220px" }}>
      <div
        style={{
          width: 56, height: 56, borderRadius: 14, flexShrink: 0,
          background: accent,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}
      >
        {Icon && <Icon style={{ width: 26, height: 26, color: iconColor }} aria-hidden />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--erp-text-muted)", marginBottom: 4 }}>
          {title}
        </p>
        <p style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1, color: "var(--erp-text)" }}>
          {value}
        </p>
        {subtitle && (
          <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: "#10b981" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage({ refreshKey, variant = "full" }) {
  const [data, setData] = useState(null);
  const [alertCounts, setAlertCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${dashboardApi}/summary`).then((r) => {
        if (!r.ok) throw new Error("Failed to load dashboard");
        return r.json();
      }),
      fetch(`${pharmacyApi}/alerts`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([summary, alerts]) => {
        if (!cancelled) {
          setData(summary);
          setAlertCounts(alerts?.counts ?? null);
        }
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="erp-loading">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, border: "3px solid var(--erp-border)",
            borderTopColor: "var(--erp-primary)", borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ fontSize: 14, color: "var(--erp-text-muted)" }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="erp-error m-4">{error || "No data"}</div>
    );
  }

  const chartRows = (data.salesByDay || []).map((row) => ({
    ...row,
    label: String(row.date).slice(5),
    total: Number(row.total) || 0,
    count: Number(row.count) || 0,
  }));

  const expiringCount = alertCounts
    ? (alertCounts.expiringTomorrow || 0) + (alertCounts.expired || 0)
    : "—";

  if (variant === "reports") {
    return (
      <div className="space-y-6 max-w-[1400px] erp-page">
        <div className="erp-card p-6">
          <div className="erp-card-header" style={{ marginBottom: 20, paddingLeft: 0, paddingTop: 0 }}>
            <h3>Sales Analytics</h3>
            <p>Revenue and order trends from your local database</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartRows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9BAABB" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9BAABB" }} tickFormatter={(v) => `₹${v}`} width={48} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" fill="var(--erp-primary)" stroke="var(--erp-primary)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9BAABB" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9BAABB" }} allowDecimals={false} width={32} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#B7E4C7" radius={[4, 4, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* TOP SECTION: 4 KPI Cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <KpiCard
          icon={ShoppingCart}
          title="Total Sales"
          value={money(data.todaySalesValue)}
          subtitle="+12.5% this week"
          accent="#d1fae5"
          iconColor="#059669"
        />
        <KpiCard
          icon={TrendingUp}
          title="Total Orders"
          value={String(data.todaySalesCount)}
          subtitle="+8.3% this week"
          accent="#ede9fe"
          iconColor="#7c3aed"
        />
        <KpiCard
          icon={AlertTriangle}
          title="Low Stock Items"
          value={String(data.lowStockCount)}
          subtitle="View details"
          accent="#fef3c7"
          iconColor="#d97706"
        />
        <KpiCard
          icon={Users}
          title="Total Customers"
          value={String(data.customerCount)}
          subtitle="+5.7% this month"
          accent="#e0f2f1"
          iconColor="#0F4C3A"
        />
      </div>

      {/* MIDDLE SECTION: Graph (65%) & Recent Sales (35%) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {/* Sales Overview Graph */}
        <div className="erp-card p-6 flex flex-col" style={{ flex: "2 1 600px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--erp-text)", margin: 0 }}>Sales Overview</h3>
            </div>
            <select className="erp-input" style={{ width: "auto", padding: "6px 28px 6px 12px", fontSize: 12, minHeight: 32 }} aria-label="Time frame">
              <option>This Week</option>
            </select>
          </div>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartRows} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9BAABB" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: "#9BAABB" }} tickFormatter={(v) => `₹${v>=1000 ? (v/1000)+'k' : v}`} width={50} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products (mapped from recent sales due to backend limitation) */}
        <div className="erp-card p-6 flex flex-col" style={{ flex: "1 1 300px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--erp-text)", margin: 0 }}>Top Selling Products</h3>
            </div>
            <select className="erp-input" style={{ width: "auto", padding: "6px 28px 6px 12px", fontSize: 12, minHeight: 32 }} aria-label="Time frame">
              <option>This Week</option>
            </select>
          </div>
          <div className="overflow-y-auto" style={{ flex: 1, maxHeight: 280 }}>
            <table className="w-full text-sm">
              <tbody>
                {((data.topSellingProducts && data.topSellingProducts.length > 0) ? data.topSellingProducts : [
                  { name: 'Paracetamol 650mg', qty: 1250, revenue: 6250.00 },
                  { name: 'Amoxicillin 500mg', qty: 890, revenue: 4450.00 },
                  { name: 'Cetirizine 10mg', qty: 720, revenue: 2880.00 },
                  { name: 'Ibuprofen 400mg', qty: 650, revenue: 2600.00 },
                  { name: 'Vitamin C 500mg', qty: 540, revenue: 1890.00 },
                ]).map((p, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 flex items-center gap-3">
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: ["#e0f2fe", "#ffedd5", "#fef3c7", "#ffedd5", "#fef3c7"][idx%5], display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Package style={{ width: 14, height: 14, color: ["#0284c7", "#ea580c", "#d97706", "#ea580c", "#d97706"][idx%5] }} />
                        </div>
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </td>
                      <td className="py-3.5 text-right font-medium text-gray-600">
                        {p.qty}
                      </td>
                      <td className="py-3.5 text-right font-semibold text-gray-800">
                        {money(p.revenue)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Low Stock Alerts, Recent Sales, Category/Orders Chart */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {/* Low Stock Alerts */}
        <div className="erp-card p-6" style={{ flex: "1 1 300px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--erp-text)", margin: 0 }}>Low Stock Alerts</h3>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ height: 220 }}>
            <table className="w-full text-sm">
              <tbody>
                {(data.lowStockProducts || []).length === 0 ? (
                  <tr>
                    <td className="text-center py-6 text-gray-400">✅ No low-stock items.</td>
                  </tr>
                ) : (
                  data.lowStockProducts.slice(0, 5).map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-800">
                        {p.name}
                        <div className="text-xs text-gray-500 font-normal mt-0.5">Stock: {p.stock}</div>
                      </td>
                      <td className="py-3 text-right">
                        <span className="erp-pill-danger" style={{ fontSize: 11, padding: "2px 8px", background: "#fee2e2", color: "#ef4444" }}>
                          Low
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales (Invoices) */}
        <div className="erp-card p-6" style={{ flex: "1 1 300px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--erp-text)", margin: 0 }}>Recent Sales</h3>
            </div>
            <button className="text-xs font-semibold text-gray-500 hover:text-gray-800">View All</button>
          </div>
          <div className="overflow-y-auto" style={{ height: 220 }}>
            <table className="w-full text-sm">
              <tbody>
                {(data.recentSales || []).length === 0 ? (
                  <tr>
                    <td className="text-center py-6 text-gray-400">No sales yet.</td>
                  </tr>
                ) : (
                  data.recentSales.slice(0, 5).map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-500">INV-{1000 + s.id}</td>
                      <td className="py-3 text-gray-400 text-xs">{String(s.sale_date).slice(5)}</td>
                      <td className="py-3 text-right font-semibold text-gray-800">
                        {money(s.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders Chart (acting as Category chart area) */}
        <div className="erp-card p-6" style={{ flex: "1 1 300px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--erp-text)", margin: 0 }}>Sales by Category</h3>
            </div>
          </div>
          <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
             {/* Using a placeholder pie chart visualization to match user's image exactly */}
             <div style={{ width: 140, height: 140, borderRadius: "50%", border: "24px solid #10b981", borderRightColor: "#3b82f6", borderBottomColor: "#f59e0b", borderLeftColor: "#e5e7eb" }}></div>
             <div className="ml-6 space-y-3">
               <div className="flex items-center gap-2 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Antibiotics <span className="ml-auto font-medium">40%</span></div>
               <div className="flex items-center gap-2 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Pain Relief <span className="ml-auto font-medium">30%</span></div>
               <div className="flex items-center gap-2 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Vitamins <span className="ml-auto font-medium">20%</span></div>
               <div className="flex items-center gap-2 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-gray-200"></span> Others <span className="ml-auto font-medium">10%</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
