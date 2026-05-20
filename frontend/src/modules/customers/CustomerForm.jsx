import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { customersApi } from "../../services/api";

export default function CustomerForm({ onAdd }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { 
      window.showToast?.("Name is required", "error");
      return; 
    }
    const cleanPhone = form.phone.trim();
    if (cleanPhone && (!/^\+?[\d\s-]{10,}$/.test(cleanPhone))) {
      window.showToast?.("Invalid phone number format. Minimum 10 digits required.", "error");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(customersApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: cleanPhone || null,
          address: form.address.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText || "Failed to add customer");
      setForm({ name: "", phone: "", address: "" });
      window.showToast?.(`Customer "${name}" added successfully!`);
      if (onAdd) onAdd();
    } catch (err) {
      setError(err.message);
      window.showToast?.(err.message || "Failed to add customer", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="p-5 md:p-6" onSubmit={handleSubmit}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--erp-text)", margin: 0 }}>Add Customer</h2>
          <p style={{ fontSize: 12, color: "var(--erp-text-muted)", marginTop: 3 }}>
            Register a new patient or walk-in buyer
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="erp-field sm:col-span-2">
          <label className="erp-label">Full Name *</label>
          <input
            name="name" value={form.name} onChange={handleChange}
            required placeholder="Customer full name"
            className="erp-input"
          />
        </div>
        <div className="erp-field">
          <label className="erp-label">Phone</label>
          <input
            name="phone" value={form.phone} onChange={handleChange}
            type="tel" placeholder="+91 98765 43210"
            className="erp-input"
          />
        </div>
        <div className="erp-field sm:col-span-2">
          <label className="erp-label">Address</label>
          <textarea
            name="address" value={form.address} onChange={handleChange}
            rows={2} placeholder="Street, City, State — 123456"
            className="erp-input resize-none"
            style={{ lineHeight: 1.6 }}
          />
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button type="submit" className="erp-btn-primary" disabled={loading}>
          <UserPlus className="h-4 w-4" aria-hidden />
          {loading ? "Adding…" : "Add Customer"}
        </button>
        {error && <div className="erp-error" style={{ padding: "7px 12px", fontSize: 13 }}>{error}</div>}
      </div>
    </form>
  );
}
