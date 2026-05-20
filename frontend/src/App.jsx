import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";
import AppLayout from "./components/layout/AppLayout";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./modules/auth/LoginPage";
import { startAutoSync } from "./services/syncService";
import DashboardPage from "./modules/dashboard/DashboardPage";
import ProductForm from "./modules/products/ProductForm";
import ProductList from "./modules/products/ProductList";
import CustomerForm from "./modules/customers/CustomerForm";
import CustomerList from "./modules/customers/CustomerList";
import SalesPage from "./modules/sales/SalesPage";
import InventorySection from "./modules/inventory/InventorySection";
import InvoicesSection from "./modules/invoices/InvoicesSection";
import SettingsPage from "./modules/settings/SettingsPage";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "sales", label: "Sales", icon: ShoppingCart },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "inventory", label: "Inventory", icon: Warehouse },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const pageMeta = {
  dashboard: { title: "Dashboard", subtitle: "Let's check your pharmacy today." },
  products: { title: "Products", subtitle: "Manage medicines, pricing, batch numbers, and expiry dates." },
  customers: { title: "Customers", subtitle: "Patient and walk-in buyer records with purchase history." },
  sales: { title: "Sale invoice", subtitle: "Create bills with line items and automatic totals." },
  invoices: { title: "Invoices", subtitle: "Sales history, PDF download, and voided refunds." },
  inventory: { title: "Inventory", subtitle: "Stock levels, low stock, and expiry alerts." },
  reports: { title: "Reports", subtitle: "Sales and order trends from your local database." },
  settings: { title: "Settings", subtitle: "Account, sync status, and session." },
};

function AppShell() {
  const { session, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [productRefresh, setProductRefresh] = useState(0);
  const [customerRefresh, setCustomerRefresh] = useState(0);
  const [salesRefresh, setSalesRefresh] = useState(0);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.showToast = (message, type = "success") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
    return () => {
      delete window.showToast;
    };
  }, []);

  const dashboardRefreshKey = useMemo(
    () => productRefresh + customerRefresh + salesRefresh,
    [productRefresh, customerRefresh, salesRefresh]
  );

  function bumpSalesAndProducts() {
    setSalesRefresh((r) => r + 1);
    setProductRefresh((r) => r + 1);
  }

  function refreshAll() {
    setProductRefresh((r) => r + 1);
    setCustomerRefresh((r) => r + 1);
    setSalesRefresh((r) => r + 1);
  }

  useEffect(() => {
    const stop = startAutoSync();
    const onSynced = () => refreshAll();
    window.addEventListener("pharmasync:synced", onSynced);
    return () => {
      stop();
      window.removeEventListener("pharmasync:synced", onSynced);
    };
  }, []);

  const meta = pageMeta[activeSection] || pageMeta.dashboard;

  return (
    <AppLayout
      session={session}
      navItems={navItems}
      activeSection={activeSection}
      onNavigate={setActiveSection}
      onLogout={logout}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    >
      {activeSection === "dashboard" ? (
        <DashboardPage refreshKey={dashboardRefreshKey} variant="full" />
      ) : null}

      {activeSection === "products" ? (
        <div className="space-y-6 max-w-[1400px]">
          {showProductForm && (
            <div className="erp-card overflow-hidden relative">
              <button 
                onClick={() => setShowProductForm(false)}
                style={{ position: "absolute", top: 16, right: 16, padding: 8, borderRadius: "50%", background: "#f1f5f9", cursor: "pointer", border: "none" }}
              >
                ✕
              </button>
              <ProductForm onAdd={() => setProductRefresh((r) => r + 1)} />
            </div>
          )}
          <div className="erp-card overflow-hidden p-2">
            <ProductList 
              refresh={productRefresh} 
              onMutate={() => setProductRefresh((r) => r + 1)}
              onAddClick={() => setShowProductForm(true)}
            />
          </div>
        </div>
      ) : null}

      {activeSection === "customers" ? (
        <div className="space-y-6 max-w-[1400px]">
          {showCustomerForm && (
            <div className="erp-card overflow-hidden relative">
              <button 
                onClick={() => setShowCustomerForm(false)}
                style={{ position: "absolute", top: 16, right: 16, padding: 8, borderRadius: "50%", background: "#f1f5f9", cursor: "pointer", border: "none" }}
              >
                ✕
              </button>
              <CustomerForm onAdd={() => setCustomerRefresh((r) => r + 1)} />
            </div>
          )}
          <div className="erp-card overflow-hidden p-2">
            <CustomerList 
              refresh={customerRefresh} 
              onMutate={() => setCustomerRefresh((r) => r + 1)} 
              onAddClick={() => setShowCustomerForm(true)}
            />
          </div>
        </div>
      ) : null}

      {activeSection === "sales" ? (
        <div className="max-w-[1400px]">
          <SalesPage refresh={salesRefresh} onRefresh={bumpSalesAndProducts} />
        </div>
      ) : null}

      {activeSection === "invoices" ? (
        <div className="max-w-[1400px]">
          <InvoicesSection salesRefresh={salesRefresh} onSalesChanged={bumpSalesAndProducts} />
        </div>
      ) : null}

      {activeSection === "inventory" ? (
        <div className="max-w-[1400px]">
          <InventorySection
            productRefresh={productRefresh}
            onProductMutate={() => setProductRefresh((r) => r + 1)}
            alertsRefreshKey={dashboardRefreshKey}
          />
        </div>
      ) : null}

      {activeSection === "reports" ? (
        <DashboardPage refreshKey={dashboardRefreshKey} variant="reports" />
      ) : null}

      {activeSection === "settings" ? <SettingsPage session={session} onLogout={logout} /> : null}

      <div className="erp-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`erp-toast erp-toast-${t.type}`}>
            <span style={{ fontSize: 16 }}>
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--erp-text)" }}>
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--erp-bg)" }}>
        <p style={{ color: 'var(--erp-text-muted)' }}>Loading PharmaSync…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return <AppShell />;
}

export default App;
