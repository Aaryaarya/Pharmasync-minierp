import React, { useEffect, useState } from "react";
import { Search, Pencil, Trash2, Clock, SlidersHorizontal } from "lucide-react";
import CustomerEdit from "./CustomerEdit";
import PatientHistoryPanel from "../pharmacy/PatientHistoryPanel";
import { customersApi } from "../../services/api";

export default function CustomerList({ refresh, onMutate, onAddClick }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [historyCustomerId, setHistoryCustomerId] = useState(null);
  const [localRefresh, setLocalRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    const url = params.toString() ? `${customersApi}?${params}` : customersApi;
    fetch(url)
      .then((res) => { if (!res.ok) throw new Error("Failed to load customers"); return res.json(); })
      .then(setCustomers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refresh, localRefresh, search]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this customer?")) return;
    await fetch(`${customersApi}/${id}`, { method: "DELETE" });
    window.showToast?.("Customer deleted successfully!", "info");
    setLocalRefresh((r) => r + 1);
    if (onMutate) onMutate();
  }

  if (error) return <div className="erp-error m-6">{error}</div>;

  const skeletonRows = Array.from({ length: 5 });

  return (
    <div className="p-5 md:p-6">
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", flex: 1 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              width: 15, height: 15, color: "var(--erp-text-light)", pointerEvents: "none"
            }} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="erp-input"
              style={{ paddingLeft: 36, width: 260, borderRadius: 8, height: 38 }}
              aria-label="Search customers"
            />
          </div>
          
          {/* Filter Dummy Button */}
          <button className="erp-btn-secondary" style={{ padding: "8px 16px", height: 38, borderRadius: 8 }}>
            <SlidersHorizontal style={{ width: 14, height: 14, marginRight: 6 }} />
            Filter
          </button>
        </div>

        {/* Add Customer Button */}
        <button 
          className="erp-btn-primary" 
          onClick={onAddClick}
          style={{ borderRadius: 8, height: 38, padding: "0 16px", background: "#10b981" }}
        >
          + Add Customer
        </button>
      </div>

      {customers.length === 0 && !loading && (
        <div className="erp-empty">
          <p style={{ fontSize: 28, marginBottom: 8 }}>👥</p>
          <p style={{ fontWeight: 600, color: "var(--erp-text)" }}>No customers found</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Add your first customer using the form above</p>
        </div>
      )}

      {(customers.length > 0 || loading) && (
        <div style={{ overflow: "hidden", borderRadius: 14, border: "1px solid var(--erp-border)" }}>
          <div className="overflow-x-auto">
            <table className="erp-table min-w-full">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  skeletonRows.map((_, idx) => (
                    <tr key={idx}>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "140px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "100px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "200px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "60px" }} /></td>
                    </tr>
                  ))
                ) : (
                  customers.map((c) => (
                  <tr key={c.id}>
                    {editId === c.id ? (
                      <td colSpan={5} style={{ padding: 0 }}>
                        <CustomerEdit
                          customer={c}
                          onClose={() => setEditId(null)}
                          onSuccess={() => { setEditId(null); setLocalRefresh((r) => r + 1); if (onMutate) onMutate(); }}
                        />
                      </td>
                    ) : (
                      <>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                              background: "var(--erp-green-soft)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 700, color: "var(--erp-primary)"
                            }}>
                              {c.name.slice(0, 1).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--erp-text-muted)", whiteSpace: "nowrap" }}>
                          {c.phone || <span style={{ color: "var(--erp-text-light)", fontStyle: "italic" }}>—</span>}
                        </td>
                        <td style={{ color: "var(--erp-text-muted)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.address || <span style={{ color: "var(--erp-text-light)", fontStyle: "italic" }}>—</span>}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <button
                              type="button"
                              className="erp-icon-btn"
                              onClick={() => setHistoryCustomerId(c.id)}
                              title="View purchase history"
                              style={{ color: "var(--erp-primary)" }}
                            >
                              <Clock style={{ width: 15, height: 15 }} />
                            </button>
                            <button
                              type="button"
                              className="erp-icon-btn"
                              onClick={() => setEditId(c.id)}
                              title="Edit customer"
                            >
                              <Pencil style={{ width: 15, height: 15 }} />
                            </button>
                            <button
                              type="button"
                              className="erp-icon-btn erp-icon-btn-danger"
                              onClick={() => handleDelete(c.id)}
                              title="Delete customer"
                            >
                              <Trash2 style={{ width: 15, height: 15 }} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {customers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 24 }}>
          <div style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>
            Showing 1 to {customers.length > 5 ? 5 : customers.length} of {customers.length} customers
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

      {historyCustomerId ? (
        <PatientHistoryPanel customerId={historyCustomerId} onClose={() => setHistoryCustomerId(null)} />
      ) : null}
    </div>
  );
}
