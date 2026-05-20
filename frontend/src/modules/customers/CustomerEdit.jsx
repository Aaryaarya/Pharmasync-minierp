import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { customersApi } from "../../services/api";

export default function CustomerEdit({ customer, onClose, onSave }) {
  const [form, setForm] = useState({
    name: customer.name ?? "",
    phone: customer.phone ?? "",
    address: customer.address ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { setError("Name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${customersApi}/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText || "Failed to update customer");
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
          ✏️ Editing: {customer.name}
        </h3>
        <button type="button" onClick={onClose} className="erp-icon-btn" title="Cancel">
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="erp-field sm:col-span-2">
          <label className="erp-label">Full Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="Customer full name" className="erp-input" />
        </div>
        <div className="erp-field">
          <label className="erp-label">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="+91 98765 43210" className="erp-input" />
        </div>
        <div className="erp-field sm:col-span-2">
          <label className="erp-label">Address</label>
          <textarea name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Street, City, State" className="erp-input resize-none" style={{ lineHeight: 1.6 }} />
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
