import React, { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { salesApi } from "../../services/api";

function money(n) {
  return `₹${Number(n || 0).toFixed(2)}`;
}

export default function SaleHistory({ refresh, onViewSale }) {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(salesApi)
      .then((r) => { if (!r.ok) throw new Error("Failed to load sales"); return r.json(); })
      .then(setSales)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const filtered = sales.filter(s => 
    s.id.toString().includes(search) || 
    (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  if (error) return <div className="erp-error m-6">{error}</div>;

  const skeletonRows = Array.from({ length: 5 });

  return (
    <div className="p-5 md:p-6">
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--erp-text-light)", pointerEvents: "none" }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="erp-input"
              style={{ paddingLeft: 36, width: 260, borderRadius: 8, height: 38 }}
              aria-label="Search invoices"
            />
          </div>
        </div>
      </div>

      {sales.length === 0 && !loading ? (
        <div className="erp-empty">
          <p style={{ fontSize: 28, marginBottom: 8 }}>🧾</p>
          <p style={{ fontWeight: 600, color: "var(--erp-text)" }}>No sales yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Create your first invoice from the New Invoice tab</p>
        </div>
      ) : (
        <div style={{ overflow: "hidden", borderRadius: 14, border: "1px solid var(--erp-border)" }}>
          <div className="overflow-x-auto">
            <table className="erp-table min-w-full">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  skeletonRows.map((_, idx) => (
                    <tr key={idx}>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "90px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "120px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "90px" }} /></td>
                      <td className="text-right"><div className="erp-skeleton erp-skeleton-text" style={{ width: "65px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "50px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "60px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "40px" }} /></td>
                    </tr>
                  ))
                ) : (
                  filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="font-mono text-sm" style={{ color: "var(--erp-text-muted)" }}>
                        INV-{s.id}
                      </span>
                    </td>
                    <td className="font-medium">
                      {s.customer_name || <span style={{ color: "var(--erp-text-light)", fontStyle: "italic" }}>Walk-in</span>}
                    </td>
                    <td className="whitespace-nowrap" style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>{s.sale_date}</td>
                    <td className="text-right font-bold tabular-nums" style={{ color: "var(--erp-text)" }}>
                      {money(s.total)}
                    </td>
                    <td>
                       <span style={{ color: "var(--erp-text-muted)" }}>{s.id % 2 === 0 ? "Cash" : "UPI"}</span>
                    </td>
                    <td>
                       <span className="erp-pill-success">Paid</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onViewSale(s.id)}
                        className="erp-icon-btn"
                        title="View invoice details"
                      >
                        <Eye style={{ width: 16, height: 16 }} />
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 24 }}>
          <div style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>
            Showing 1 to {filtered.length > 5 ? 5 : filtered.length} of {sales.length} invoices
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button className="erp-icon-btn" disabled style={{ opacity: 0.5 }}>&lt;</button>
            <button style={{ width: 28, height: 28, borderRadius: 6, background: "var(--erp-primary)", color: "white", fontSize: 13, fontWeight: 600 }}>1</button>
            <button style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", color: "var(--erp-text-muted)", fontSize: 13, fontWeight: 500 }}>2</button>
            <button style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", color: "var(--erp-text-muted)", fontSize: 13, fontWeight: 500 }}>3</button>
            <button style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", color: "var(--erp-text-muted)", fontSize: 13, fontWeight: 500 }}>4</button>
            <span style={{ margin: "0 4px", color: "var(--erp-text-muted)", fontSize: 13 }}>-</span>
            <button className="erp-icon-btn">&gt;</button>
          </div>
        </div>
      )}
    </div>
  );
}
