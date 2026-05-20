import React, { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, Pencil, Trash2 } from "lucide-react";
import ProductEdit from "./ProductEdit";
import StockBadge from "../../components/ui/StockBadge";
import { productsApi } from "../../services/api";

const LOW = 10;

export default function ProductList({ refresh, onMutate, onAddClick }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [localRefresh, setLocalRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    const url = params.toString() ? `${productsApi}?${params}` : productsApi;
    fetch(url)
      .then((res) => { if (!res.ok) throw new Error("Failed to load products"); return res.json(); })
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refresh, localRefresh, search]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const s = Number(p.stock);
      if (stockFilter === "low") return s > 0 && s <= LOW;
      if (stockFilter === "out") return s === 0;
      if (stockFilter === "ok") return s > LOW;
      return true;
    });
  }, [products, stockFilter]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`${productsApi}/${id}`, { method: "DELETE" });
    window.showToast?.("Product deleted successfully!", "info");
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
              placeholder="Search products..."
              className="erp-input"
              style={{ paddingLeft: 36, width: 260, borderRadius: 8, height: 38 }}
              aria-label="Search products"
            />
          </div>
          
          {/* Categories Dropdown Dummy */}
          <select className="erp-input" style={{ width: 150, borderRadius: 8, height: 38 }}>
            <option>All Categories</option>
          </select>
          
          {/* Stock Filter Dummy (using the existing stock filter) */}
          <div style={{ position: "relative" }}>
            <SlidersHorizontal style={{
              position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              width: 14, height: 14, color: "var(--erp-text-light)", pointerEvents: "none"
            }} aria-hidden />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="erp-input"
              style={{ paddingLeft: 32, width: 120, borderRadius: 8, height: 38, border: "none", background: "transparent" }}
              aria-label="Filter by stock"
            >
              <option value="all">Filter</option>
              <option value="ok">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out stock</option>
            </select>
          </div>
        </div>

        {/* Add Product Button */}
        <button 
          className="erp-btn-primary" 
          onClick={onAddClick}
          style={{ borderRadius: 8, height: 38, padding: "0 16px", background: "#10b981" }}
        >
          + Add Product
        </button>
      </div>

      {filtered.length === 0 && !loading && (
        <div className="erp-empty">
          <p style={{ fontSize: 28, marginBottom: 8 }}>📦</p>
          <p style={{ fontWeight: 600, color: "var(--erp-text)" }}>No products found</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</p>
        </div>
      )}

      {(filtered.length > 0 || loading) && (
        <div style={{ overflow: "hidden", borderRadius: 14, border: "1px solid var(--erp-border)" }}>
          <div className="overflow-x-auto">
            <table className="erp-table min-w-full">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Batch No.</th>
                  <th>Expiry Date</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  skeletonRows.map((_, idx) => (
                    <tr key={idx}>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "120px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "80px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "60px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "90px" }} /></td>
                      <td className="text-right"><div className="erp-skeleton erp-skeleton-text" style={{ width: "50px" }} /></td>
                      <td className="text-right"><div className="erp-skeleton erp-skeleton-text" style={{ width: "40px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "70px" }} /></td>
                      <td><div className="erp-skeleton erp-skeleton-text" style={{ width: "50px" }} /></td>
                    </tr>
                  ))
                ) : (
                  filtered.map((p) => (
                  <tr key={p.id}>
                    {editId === p.id ? (
                      <td colSpan={8} style={{ padding: 0 }}>
                        <ProductEdit
                          product={p}
                          onClose={() => setEditId(null)}
                          onSave={() => {
                            setEditId(null);
                            setLocalRefresh((r) => r + 1);
                            if (onMutate) onMutate();
                          }}
                        />
                      </td>
                    ) : (
                      <>
                        <td className="font-medium">{p.name}</td>
                        <td>
                          {p.category
                            ? <span className="erp-pill-neutral">{p.category}</span>
                            : <span style={{ color: "var(--erp-text-light)" }}>—</span>
                          }
                        </td>
                        <td className="font-mono text-xs" style={{ color: "var(--erp-text-muted)" }}>{p.batch_no || "—"}</td>
                        <td className="whitespace-nowrap" style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>{p.expiry_date || "—"}</td>
                        <td className="text-right font-semibold tabular-nums">
                          ₹{Number(p.price).toFixed(2)}
                        </td>
                        <td className="text-right font-bold tabular-nums" style={{ fontSize: 15 }}>{p.stock}</td>
                        <td><StockBadge stock={p.stock} /></td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              type="button"
                              className="erp-icon-btn"
                              onClick={() => setEditId(p.id)}
                              title="Edit product"
                            >
                              <Pencil style={{ width: 15, height: 15 }} />
                            </button>
                            <button
                              type="button"
                              className="erp-icon-btn erp-icon-btn-danger"
                              onClick={() => handleDelete(p.id)}
                              title="Delete product"
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
      {filtered.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 24 }}>
          <div style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>
            Showing 1 to {filtered.length > 7 ? 7 : filtered.length} of {products.length} products
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button className="erp-icon-btn" disabled style={{ opacity: 0.5 }}>&lt;</button>
            <button style={{ width: 28, height: 28, borderRadius: 6, background: "var(--erp-primary)", color: "white", fontSize: 13, fontWeight: 600 }}>1</button>
            <button style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", color: "var(--erp-text-muted)", fontSize: 13, fontWeight: 500 }}>2</button>
            <button style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", color: "var(--erp-text-muted)", fontSize: 13, fontWeight: 500 }}>3</button>
            <button style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", color: "var(--erp-text-muted)", fontSize: 13, fontWeight: 500 }}>4</button>
            <button style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", color: "var(--erp-text-muted)", fontSize: 13, fontWeight: 500 }}>5</button>
            <span style={{ margin: "0 4px", color: "var(--erp-text-muted)", fontSize: 13 }}>-</span>
            <button className="erp-icon-btn">&gt;</button>
          </div>
        </div>
      )}
    </div>
  );
}
