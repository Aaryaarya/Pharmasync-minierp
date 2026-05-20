import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { productsApi } from "../../services/api";

export default function ProductEdit({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product.name ?? "",
    category: product.category ?? "",
    price: product.price ?? "",
    stock: product.stock ?? "",
    batch_no: product.batch_no ?? "",
    expiry_date: product.expiry_date ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${productsApi}/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, category: form.category,
          price: parseFloat(form.price), stock: parseInt(form.stock, 10),
          batch_no: form.batch_no || null,
          expiry_date: form.expiry_date || null, image: null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText || "Failed to update product");
      if (onSave) onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "linear-gradient(to right, #f4f8f6, #fafcfb)",
        borderTop: "2px solid var(--erp-primary)",
        padding: "20px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--erp-primary)", margin: 0 }}>
          ✏️ Editing: {product.name}
        </h3>
        <button type="button" onClick={onClose} className="erp-icon-btn" title="Cancel">
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="erp-field">
          <label className="erp-label">Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required className="erp-input" placeholder="Product name" />
        </div>
        <div className="erp-field">
          <label className="erp-label">Category</label>
          <input name="category" value={form.category} onChange={handleChange} className="erp-input" placeholder="Category" />
        </div>
        <div className="erp-field">
          <label className="erp-label">Price (₹) *</label>
          <input name="price" value={form.price} onChange={handleChange} required placeholder="0.00" type="number" min="0" step="0.01" className="erp-input" />
        </div>
        <div className="erp-field">
          <label className="erp-label">Stock *</label>
          <input name="stock" value={form.stock} onChange={handleChange} required placeholder="0" type="number" min="0" className="erp-input" />
        </div>
        <div className="erp-field">
          <label className="erp-label">Batch No.</label>
          <input name="batch_no" value={form.batch_no} onChange={handleChange} className="erp-input" placeholder="Batch no." />
        </div>
        <div className="erp-field">
          <label className="erp-label">Expiry Date</label>
          <input name="expiry_date" value={form.expiry_date} onChange={handleChange} type="date" className="erp-input" />
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button type="submit" className="erp-btn-primary" disabled={loading} style={{ padding: "8px 18px" }}>
          <Check style={{ width: 15, height: 15 }} />
          {loading ? "Saving…" : "Save Changes"}
        </button>
        <button type="button" className="erp-btn-secondary" onClick={onClose} style={{ padding: "8px 18px" }}>
          Cancel
        </button>
        {error && <div className="erp-error" style={{ padding: "7px 12px", fontSize: 12 }}>{error}</div>}
      </div>
    </form>
  );
}
