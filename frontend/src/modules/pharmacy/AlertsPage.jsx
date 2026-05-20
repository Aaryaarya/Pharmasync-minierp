import { useEffect, useState } from "react";
import { pharmacyApi } from "../../services/api";

function AlertSection({ title, tone, items, renderRow }) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white/80 overflow-hidden">
      <div className={`px-4 py-3 border-b ${tone.header}`}>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600">{items.length} item(s)</p>
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">None — all good.</p>
      ) : (
        <ul className="divide-y divide-slate-100">{items.map(renderRow)}</ul>
      )}
    </section>
  );
}

export default function AlertsPage({ refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${pharmacyApi}/alerts`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load alerts");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className="p-6 text-slate-600">Loading alerts…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  const row = (p, extra) => (
    <li key={p.id} className="px-4 py-3 text-sm flex flex-wrap justify-between gap-2">
      <div>
        <span className="font-medium text-slate-900">{p.name}</span>
        {p.batch_no ? <span className="text-slate-500 ml-2">Batch {p.batch_no}</span> : null}
      </div>
      <span className="text-slate-600 tabular-nums">{extra}</span>
    </li>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <p className="text-sm text-slate-600">
        Pharmacy notifications as of <strong>{data.asOf}</strong>. Low stock threshold: ≤{" "}
        {data.lowStockThreshold} units.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Expired", data.counts.expired, "bg-red-50"],
          ["Expiring tomorrow", data.counts.expiringTomorrow, "bg-amber-50"],
          ["Low stock", data.counts.lowStock, "bg-yellow-50"],
          ["Out of stock", data.counts.outOfStock, "bg-slate-100"],
        ].map(([label, count, bg]) => (
          <div key={label} className={`rounded-xl ${bg} border border-slate-200/60 p-3 text-center`}>
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-xs text-slate-600">{label}</p>
          </div>
        ))}
      </div>
      <AlertSection
        title="Expired medicines"
        tone={{ header: "bg-red-50/80 border-red-100" }}
        items={data.expired}
        renderRow={(p) => row(p, `Expired ${p.expiry_date} · Stock ${p.stock}`)}
      />
      <AlertSection
        title="Expiring tomorrow"
        tone={{ header: "bg-amber-50/80 border-amber-100" }}
        items={data.expiringTomorrow}
        renderRow={(p) => row(p, `Expiry ${p.expiry_date} · Stock ${p.stock}`)}
      />
      <AlertSection
        title="Low stock"
        tone={{ header: "bg-yellow-50/80 border-yellow-100" }}
        items={data.lowStock}
        renderRow={(p) => row(p, `Stock ${p.stock}`)}
      />
      <AlertSection
        title="Out of stock"
        tone={{ header: "bg-slate-50 border-slate-200" }}
        items={data.outOfStock}
        renderRow={(p) => row(p, `Stock 0`)}
      />
    </div>
  );
}
