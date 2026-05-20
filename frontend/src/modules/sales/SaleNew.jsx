import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ShoppingBag, Receipt } from "lucide-react";
import { customersApi, productsApi, salesApi } from "../../services/api";

function newLine() {
  return { key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, product_id: "", quantity: 1 };
}

export default function SaleNew({ onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);
    Promise.all([
      fetch(customersApi).then((r) => r.json()),
      fetch(productsApi).then((r) => r.json()),
    ])
      .then(([c, p]) => {
        if (!cancelled) {
          setCustomers(Array.isArray(c) ? c : []);
          setProducts(Array.isArray(p) ? p : []);
        }
      })
      .catch(() => { if (!cancelled) setError("Could not load customers or products"); })
      .finally(() => { if (!cancelled) setLoadingData(false); });
    return () => { cancelled = true; };
  }, []);

  const productById = useMemo(() => Object.fromEntries(products.map((p) => [String(p.id), p])), [products]);

  const lineTotals = useMemo(() => {
    return lines.map((line) => {
      const p = line.product_id ? productById[String(line.product_id)] : null;
      const qty = Math.max(1, parseInt(line.quantity, 10) || 1);
      const unit = p ? Number(p.price) : 0;
      return qty * unit;
    });
  }, [lines, productById]);

  const grandTotal = useMemo(() => lineTotals.reduce((a, b) => a + b, 0), [lineTotals]);

  function addProductToCart(p) {
    setLines((prev) => {
      const existing = prev.find(l => String(l.product_id) === String(p.id));
      if (existing) {
        return prev.map(l => l.key === existing.key ? { ...l, quantity: Number(l.quantity) + 1 } : l);
      }
      return [...prev, { key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, product_id: String(p.id), quantity: 1 }];
    });
  }

  function updateLine(key, patch) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function removeLine(key) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }
  function clearCart() {
    setLines([]);
    setCustomerId("");
  }
  const [productSearch, setProductSearch] = useState("");
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const items = lines
      .filter((l) => l.product_id)
      .map((l) => ({
        product_id: parseInt(l.product_id, 10),
        quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
      }));
    if (items.length === 0) {
      window.showToast?.("Add at least one product to create invoice", "error");
      setError("Add at least one product line."); 
      return; 
    }
    
    // Validate stock levels before sending
    for (const item of items) {
      const p = productById[String(item.product_id)];
      if (p && p.stock < item.quantity) {
        window.showToast?.(`Not enough stock for "${p.name}" (Available: ${p.stock})`, "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      const body = {
        customer_id: customerId === "" ? null : parseInt(customerId, 10),
        sale_date: saleDate,
        items,
      };
      const res = await fetch(salesApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText || "Failed to create sale");
      setLines([]);
      setCustomerId("");
      setSaleDate(new Date().toISOString().slice(0, 10));
      window.showToast?.(`Invoice INV-${data.id || ""} created successfully!`);
      if (onCreated) onCreated(data);
    } catch (err) {
      setError(err.message);
      window.showToast?.(err.message || "Failed to create sale", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return (
      <div className="erp-loading">
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--erp-text-muted)" }}>
          <div style={{ width: 18, height: 18, border: "2px solid var(--erp-border)", borderTopColor: "var(--erp-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Loading products & customers…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-5 md:p-6" style={{ minHeight: 520, background: "var(--erp-bg)" }}>
      {/* ── Left: Products Selection ── */}
      <div className="flex-1 erp-card p-5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--erp-text)", margin: 0 }}>
          Add Products
        </h3>
        
        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--erp-text-light)", pointerEvents: "none" }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="search"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search medicine..."
            className="erp-input"
            style={{ paddingLeft: 36, width: "100%", borderRadius: 8, height: 42 }}
          />
        </div>

        {/* Product List Grid */}
        <div style={{ overflowY: "auto", paddingRight: 4, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {filteredProducts.map(p => (
            <div key={p.id} style={{ border: "1px solid var(--erp-border)", borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", background: "white" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: "var(--erp-text)", marginBottom: 4 }}>{p.name}</p>
                <p style={{ fontSize: 12, color: "var(--erp-primary)", fontWeight: 700 }}>₹{Number(p.price).toFixed(2)}</p>
                <p style={{ fontSize: 11, color: "var(--erp-text-muted)", marginTop: 2 }}>In Stock: {p.stock}</p>
              </div>
              <button 
                type="button" 
                onClick={() => addProductToCart(p)}
                style={{ width: 32, height: 32, borderRadius: 8, background: "var(--erp-green-soft)", color: "var(--erp-primary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Plus style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Cart ── */}
      <aside className="w-full xl:w-[420px] shrink-0 erp-card p-5 space-y-5" style={{ display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--erp-text)", margin: 0 }}>
          Cart
        </h3>

        {/* Form elements for Invoice (Customer/Date) */}
        <div className="space-y-3">
          <div className="erp-field">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="erp-input" style={{ height: 38, borderRadius: 8 }}>
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} {c.phone ? `— ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items Table */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 200 }}>
          {lines.length === 0 ? (
            <div className="erp-empty" style={{ paddingTop: 40 }}>
              <ShoppingBag style={{ width: 32, height: 32, color: "var(--erp-border)", marginBottom: 12 }} />
              <p style={{ color: "var(--erp-text-muted)", fontSize: 13 }}>Cart is empty</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--erp-border)", textAlign: "left", fontSize: 12, color: "var(--erp-text-muted)" }}>
                  <th style={{ paddingBottom: 8, fontWeight: 600 }}>Item</th>
                  <th style={{ paddingBottom: 8, fontWeight: 600 }}>Qty</th>
                  <th style={{ paddingBottom: 8, fontWeight: 600, textAlign: "right" }}>Price</th>
                  <th style={{ paddingBottom: 8, fontWeight: 600, textAlign: "right" }}>Total</th>
                  <th style={{ paddingBottom: 8, width: 24 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const p = productById[String(line.product_id)];
                  if (!p) return null;
                  return (
                    <tr key={line.key} style={{ borderBottom: "1px solid var(--erp-border-light)" }}>
                      <td style={{ padding: "12px 0", fontSize: 13, fontWeight: 500, color: "var(--erp-text)" }}>
                        {p.name}
                        {p.stock < line.quantity && (
                          <div style={{ fontSize: 10, color: "#dc2626" }}>Out of stock</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 0", width: 60 }}>
                        <input
                          type="number" min={1} value={line.quantity}
                          onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                          className="erp-input"
                          style={{ padding: "4px 8px", width: "100%", height: 32, textAlign: "center", borderRadius: 6 }}
                        />
                      </td>
                      <td style={{ padding: "12px 0", fontSize: 13, color: "var(--erp-text-muted)", textAlign: "right" }}>
                        {Number(p.price).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px 0", fontSize: 13, fontWeight: 600, color: "var(--erp-text)", textAlign: "right" }}>
                        {lineTotals[idx].toFixed(2)}
                      </td>
                      <td style={{ padding: "12px 0", textAlign: "right" }}>
                        <button type="button" onClick={() => removeLine(line.key)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals & Actions */}
        <div style={{ borderTop: "2px dashed var(--erp-border)", paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--erp-text-muted)", marginBottom: 8 }}>
            <span>Sub Total</span>
            <span className="font-medium">₹{grandTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--erp-text-muted)", marginBottom: 16 }}>
            <span>Discount</span>
            <span className="font-medium">₹0.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--erp-text)" }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--erp-primary)" }}>
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
          
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={clearCart} className="erp-btn-secondary" style={{ flex: 1, height: 42, borderRadius: 8 }}>
              Clear Cart
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting || lines.length === 0} className="erp-btn-primary" style={{ flex: 2, height: 42, borderRadius: 8, background: "#10b981" }}>
              {submitting ? "Creating..." : "Create Invoice"}
            </button>
          </div>
          {error && <div className="erp-error text-sm mt-4">{error}</div>}
        </div>
      </aside>
    </div>
  );
}
