import { useState } from "react";
import SaleHistory from "../sales/SaleHistory";
import SaleDetail from "../sales/SaleDetail";
import RefundsPage from "../pharmacy/RefundsPage";
import { FileText, RotateCcw } from "lucide-react";

export default function InvoicesSection({ salesRefresh, onSalesChanged }) {
  const [tab, setTab] = useState("invoices");
  const [detailId, setDetailId] = useState(null);

  if (detailId != null) {
    return (
      <div className="erp-card overflow-hidden animate-fade-up">
        <SaleDetail
          saleId={detailId}
          onBack={() => setDetailId(null)}
          onChanged={() => onSalesChanged && onSalesChanged()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 erp-page">
      <div className="erp-tab-bar">
        <button
          type="button"
          className={tab === "invoices" ? "erp-tab-active" : "erp-tab"}
          onClick={() => setTab("invoices")}
        >
          <FileText style={{ width: 14, height: 14, display: "inline", marginRight: 6 }} />
          All Invoices
        </button>
        <button
          type="button"
          className={tab === "refunds" ? "erp-tab-active" : "erp-tab"}
          onClick={() => setTab("refunds")}
        >
          <RotateCcw style={{ width: 14, height: 14, display: "inline", marginRight: 6 }} />
          Refunds / Voided
        </button>
      </div>

      {tab === "invoices" && (
        <div className="erp-card overflow-hidden animate-fade-up">
          <SaleHistory refresh={salesRefresh} onViewSale={(id) => setDetailId(id)} />
        </div>
      )}
      {tab === "refunds" && (
        <div className="erp-card overflow-hidden animate-fade-up">
          <RefundsPage refreshKey={salesRefresh} />
        </div>
      )}
    </div>
  );
}
