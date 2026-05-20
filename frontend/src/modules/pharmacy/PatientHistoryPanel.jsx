import { useEffect, useState } from "react";
import { customersApi } from "../../services/api";

export default function PatientHistoryPanel({ customerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    fetch(`${customersApi}/${customerId}/history`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load history");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b flex justify-between items-start gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Patient purchase history</h3>
            {data?.customer ? (
              <p className="text-sm text-slate-600">
                {data.customer.name}
                {data.customer.phone ? ` · ${data.customer.phone}` : ""}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 text-xl leading-none">
            ×
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? <p className="text-slate-600">Loading…</p> : null}
          {error ? <p className="text-red-600">{error}</p> : null}
          {data ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-teal-50 p-3 text-center">
                  <p className="text-xl font-bold text-teal-900">{data.summary.purchaseCount}</p>
                  <p className="text-xs text-teal-700">Purchases</p>
                </div>
                <div className="rounded-lg bg-violet-50 p-3 text-center">
                  <p className="text-xl font-bold text-violet-900">
                    ₹{Number(data.summary.totalSpent).toFixed(2)}
                  </p>
                  <p className="text-xs text-violet-700">Total spent</p>
                </div>
              </div>
              {data.sales.length === 0 ? (
                <p className="text-slate-500 text-sm">No purchases yet for this customer.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 border-b">
                      <th className="py-2">Sale #</th>
                      <th className="py-2">Date</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="py-2 font-mono">{s.id}</td>
                        <td className="py-2">{s.sale_date}</td>
                        <td className="py-2 text-right font-medium">₹{Number(s.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
