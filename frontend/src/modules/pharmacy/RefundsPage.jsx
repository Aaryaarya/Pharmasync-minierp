import { useEffect, useState } from "react";
import { pharmacyApi } from "../../services/api";

export default function RefundsPage({ refreshKey }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${pharmacyApi}/refunds`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load refunds");
        return r.json();
      })
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className="p-6 text-slate-600">Loading refunds…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <p className="text-sm text-slate-600">
        Voided sales (returns). Stock was restored when each sale was voided from Sales → Details.
      </p>
      {rows.length === 0 ? (
        <p className="text-slate-500">No refunds / voided sales yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200/80 bg-white/80">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-3 py-2">Sale #</th>
                <th className="px-3 py-2">Voided at</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono">{s.id}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{s.updated_at?.slice(0, 10)}</td>
                  <td className="px-3 py-2">{s.customer_name || "Walk-in"}</td>
                  <td className="px-3 py-2 text-right font-medium text-red-700">
                    ₹{Number(s.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
