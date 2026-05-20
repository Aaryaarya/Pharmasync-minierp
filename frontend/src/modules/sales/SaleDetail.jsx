import React, { useEffect, useState } from "react";
import { FileDown, ArrowLeft, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { salesApi } from "../../services/api";
import { generateSaleInvoicePdf } from "../../utils/generateSaleInvoicePdf";

export default function SaleDetail({ saleId, onBack, onChanged }) {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmVoid, setShowConfirmVoid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${salesApi}/${saleId}`)
      .then((r) => {
        if (r.status === 404) throw new Error("Sale not found");
        if (!r.ok) throw new Error("Failed to load sale");
        return r.json();
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [saleId]);

  async function executeDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${salesApi}/${saleId}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Delete failed");
      window.showToast?.(`Invoice INV-${saleId} voided successfully!`, "info");
      if (onChanged) onChanged();
      onBack();
    } catch (e) {
      setError(e.message);
      window.showToast?.(e.message || "Failed to void invoice", "error");
    } finally {
      setDeleting(false);
      setShowConfirmVoid(false);
    }
  }

  if (loading) return (
    <div className="erp-loading">
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--erp-text-muted)" }}>
        <div style={{ width: 18, height: 18, border: "2px solid var(--erp-border)", borderTopColor: "var(--erp-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        Loading invoice…
      </div>
    </div>
  );
  if (error || !data) return <div className="erp-error m-6">{error || "Not found"}</div>;

  const { sale, items } = data;

  function handleDownloadPdf() {
    generateSaleInvoicePdf({ sale, items }, { billerName: session?.name, billerId: session?.billerId });
  }

  return (
    <div className="p-5 md:p-6 space-y-5">
      {/* Top Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
              color: "var(--erp-primary)", fontWeight: 500, background: "none",
              border: "none", cursor: "pointer", padding: 0, marginBottom: 10
            }}
          >
            <ArrowLeft style={{ width: 15, height: 15 }} />
            Back to history
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--erp-text)", margin: 0 }}>
            Invoice <span style={{ color: "var(--erp-primary)" }}>#{sale.id}</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--erp-text-muted)", marginTop: 5 }}>
            Date: <strong style={{ color: "var(--erp-text)" }}>{sale.sale_date}</strong>
            {sale.customer_name ? (
              <>
                {" · "}Customer: <strong style={{ color: "var(--erp-text)" }}>{sale.customer_name}</strong>
                {sale.customer_phone ? ` (${sale.customer_phone})` : ""}
              </>
            ) : (
              <> · <span style={{ fontStyle: "italic" }}>Walk-in</span></>
            )}
          </p>
          {sale.customer_address && (
            <p style={{ fontSize: 12, color: "var(--erp-text-muted)", marginTop: 3 }}>
              📍 {sale.customer_address}
            </p>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" onClick={handleDownloadPdf} className="erp-btn-primary" style={{ padding: "9px 16px" }}>
            <FileDown style={{ width: 15, height: 15 }} />
            Download PDF
          </button>
          {showConfirmVoid ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "4px 8px" }}>
              <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, paddingLeft: 4 }}>Confirm void?</span>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleting}
                className="erp-btn-danger"
                style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8 }}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmVoid(false)}
                className="erp-btn-secondary"
                style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8 }}
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmVoid(true)}
              disabled={deleting}
              className="erp-btn-danger"
              style={{ padding: "9px 16px" }}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
              {deleting ? "Voiding…" : "Void Sale"}
            </button>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div style={{ overflow: "hidden", borderRadius: 14, border: "1px solid var(--erp-border)" }}>
        <div className="overflow-x-auto">
          <table className="erp-table min-w-full">
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit ₹</th>
                <th className="text-right">Line ₹</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const line = Number(row.quantity) * Number(row.price);
                return (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--erp-text)" }}>{row.product_name}</div>
                      {row.category && <div style={{ fontSize: 11, color: "var(--erp-text-muted)", marginTop: 2 }}>{row.category}</div>}
                    </td>
                    <td className="font-mono text-xs" style={{ color: "var(--erp-text-muted)" }}>
                      <div>{row.batch_no || "—"}</div>
                      {row.expiry_date && <div style={{ fontSize: 10, marginTop: 2, color: "var(--erp-text-muted)" }}>Exp: {row.expiry_date.slice(0,10)}</div>}
                    </td>
                    <td className="text-right tabular-nums">{row.quantity}</td>
                    <td className="text-right tabular-nums" style={{ color: "var(--erp-text-muted)" }}>₹{Number(row.price).toFixed(2)}</td>
                    <td className="text-right font-semibold tabular-nums" style={{ color: "var(--erp-primary)" }}>₹{line.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="text-right" style={{ fontWeight: 700 }}>Grand Total</td>
                <td className="text-right" style={{ fontWeight: 800, fontSize: 16, color: "var(--erp-primary)" }}>
                  ₹{Number(sale.total).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {error && <div className="erp-error">{error}</div>}
    </div>
  );
}
