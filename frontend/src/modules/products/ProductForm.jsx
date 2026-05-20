import React, { useState } from "react";
import { Plus } from "lucide-react";
import { productsApi } from "../../services/api";

export default function ProductForm({ onAdd }) {
  const [form, setForm] = useState({
    name: "", category: "", price: "", stock: "", batch_no: "", expiry_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (parseFloat(form.price) <= 0) {
      window.showToast?.("Price must be greater than zero", "error");
      return;
    }
    if (parseInt(form.stock, 10) < 0) {
      window.showToast?.("Stock cannot be negative", "error");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(productsApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, category: form.category,
          price: parseFloat(form.price), stock: parseInt(form.stock, 10),
          batch_no: form.batch_no || null,
          expiry_date: form.expiry_date || null, image: null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText || "Failed to add product");
      setForm({ name: "", category: "", price: "", stock: "", batch_no: "", expiry_date: "" });
      window.showToast?.(`Product "${form.name}" added successfully!`);
      if (onAdd) onAdd();
    } catch (err) {
      setError(err.message);
      window.showToast?.(err.message || "Failed to add product", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="p-5 md:p-6" onSubmit={handleSubmit}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--erp-text)", margin: 0 }}>Add Product</h2>
          <p style={{ fontSize: 12, color: "var(--erp-text-muted)", marginTop: 3 }}>
            Add a new medicine or item to your catalog
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="erp-field">
          <label className="erp-label">Product Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Paracetamol 650mg" className="erp-input" />
        </div>
        <div className="erp-field">
          <label className="erp-label">Category</label>
          <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Antibiotics" className="erp-input" />
        </div>
        <div className="erp-field">
          <label className="erp-label">Price (₹) *</label>
          <input name="price" value={form.price} onChange={handleChange} required placeholder="0.00" type="number" min="0" step="0.01" className="erp-input" />
        </div>
        <div className="erp-field">
          <label className="erp-label">Stock Qty *</label>
          <input name="stock" value={form.stock} onChange={handleChange} required placeholder="0" type="number" min="0" className="erp-input" />
        </div>
        <div className="erp-field">
          <label className="erp-label">Batch No.</label>
          <input name="batch_no" value={form.batch_no} onChange={handleChange} placeholder="e.g. B001" className="erp-input" />
        </div>
        <div className="erp-field">
          <label className="erp-label">Expiry Date</label>
          <input name="expiry_date" value={form.expiry_date} onChange={handleChange} type="date" className="erp-input" />
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button type="submit" className="erp-btn-primary" disabled={loading}>
          <Plus className="h-4 w-4" aria-hidden />
          {loading ? "Adding…" : "Add Product"}
        </button>
        {error && <div className="erp-error" style={{ padding: "7px 12px", fontSize: 13 }}>{error}</div>}
      </div>
    </form>
  );
}
