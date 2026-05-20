import { useState } from "react";
import ProductList from "../products/ProductList";
import AlertsPage from "../pharmacy/AlertsPage";
import { Package, Bell } from "lucide-react";

export default function InventorySection({ productRefresh, onProductMutate, alertsRefreshKey }) {
  const [tab, setTab] = useState("stock");

  return (
    <div className="space-y-4 erp-page">
      <div className="erp-tab-bar">
        <button
          type="button"
          className={tab === "stock" ? "erp-tab-active" : "erp-tab"}
          onClick={() => setTab("stock")}
        >
          <Package style={{ width: 14, height: 14, display: "inline", marginRight: 6 }} />
          Stock Levels
        </button>
        <button
          type="button"
          className={tab === "alerts" ? "erp-tab-active" : "erp-tab"}
          onClick={() => setTab("alerts")}
        >
          <Bell style={{ width: 14, height: 14, display: "inline", marginRight: 6 }} />
          Expiry &amp; Alerts
        </button>
      </div>

      {tab === "stock" && (
        <div className="erp-card overflow-hidden animate-fade-up">
          <ProductList refresh={productRefresh} onMutate={onProductMutate} />
        </div>
      )}
      {tab === "alerts" && (
        <div className="erp-card overflow-hidden animate-fade-up">
          <AlertsPage refreshKey={alertsRefreshKey} />
        </div>
      )}
    </div>
  );
}
