import { useState } from "react";
import SaleNew from "./SaleNew";
import SaleHistory from "./SaleHistory";
import SaleDetail from "./SaleDetail";
import { FileText, Plus } from "lucide-react";

export default function SalesPage({ refresh, onRefresh }) {
  const [tab, setTab] = useState("new");
  const [detailId, setDetailId] = useState(null);

  if (detailId != null) {
    return (
      <div className="erp-card overflow-hidden animate-fade-up">
        <SaleDetail
          saleId={detailId}
          onBack={() => setDetailId(null)}
          onChanged={() => onRefresh && onRefresh()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 erp-page">
      <div className="erp-tab-bar">
        <button
          type="button"
          className={tab === "new" ? "erp-tab-active" : "erp-tab"}
          onClick={() => setTab("new")}
        >
          <Plus style={{ width: 14, height: 14, display: "inline", marginRight: 6 }} />
          New Invoice
        </button>
        <button
          type="button"
          className={tab === "history" ? "erp-tab-active" : "erp-tab"}
          onClick={() => setTab("history")}
        >
          <FileText style={{ width: 14, height: 14, display: "inline", marginRight: 6 }} />
          Recent Sales
        </button>
      </div>

      {tab === "new" && (
        <div className="erp-card overflow-hidden animate-fade-up">
          <SaleNew
            onCreated={() => {
              if (onRefresh) onRefresh();
              setTab("history");
            }}
          />
        </div>
      )}

      {tab === "history" && (
        <div className="erp-card overflow-hidden animate-fade-up">
          <SaleHistory refresh={refresh} onViewSale={(id) => setDetailId(id)} />
        </div>
      )}
    </div>
  );
}
