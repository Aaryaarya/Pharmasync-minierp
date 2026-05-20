import { useState } from "react";
import { Bell, ChevronLeft, ChevronRight, LogOut, Search, Menu, X } from "lucide-react";

export default function AppLayout({
  session,
  navItems,
  activeSection,
  onNavigate,
  onLogout,
  pageTitle,
  pageSubtitle,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (session?.name || session?.billerId || "U").slice(0, 2).toUpperCase();
  const sidebarW = collapsed ? 72 : 240;

  /* ── shared nav button renderer ── */
  function NavButton({ id, label, Icon }) {
    const active = activeSection === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => { onNavigate(id); setMobileOpen(false); }}
        title={collapsed ? label : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: collapsed ? "11px 0" : "10px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 14,
          border: "none",
          cursor: "pointer",
          fontSize: 13.5,
          fontWeight: active ? 600 : 500,
          color: active ? "#ffffff" : "#8FC5A8",
          background: active ? "rgba(255,255,255,0.14)" : "transparent",
          transition: "all 0.18s ease",
          position: "relative",
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.color = "#ffffff";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#8FC5A8";
          }
        }}
      >
        {/* left accent bar */}
        {active && (
          <span style={{
            position: "absolute", left: 0, top: "18%", height: "64%",
            width: 3, borderRadius: "0 4px 4px 0", background: "#B7E4C7",
          }} />
        )}
        <Icon style={{ width: 18, height: 18, flexShrink: 0, color: active ? "#B7E4C7" : "inherit" }} aria-hidden />
        {!collapsed && <span style={{ lineHeight: 1, whiteSpace: "nowrap" }}>{label}</span>}
      </button>
    );
  }

  /* ── sidebar inner content ── */
  function SidebarContent() {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* Logo row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: collapsed ? "18px 0" : "18px 14px 18px 18px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          {/* pill logo */}
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg,#B7E4C7,#52c97a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: "0 3px 10px rgba(183,228,199,0.35)",
          }}>💊</div>

          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>PharmaSync</div>
              <div style={{ fontSize: 11, color: "#8FC5A8", marginTop: 1 }}>Smart Pharmacy ERP</div>
            </div>
          )}

          {/* collapse toggle — only visible on desktop (hidden on mobile sidebar) */}
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            className="sidebar-collapse-btn"
            style={{
              padding: 6, borderRadius: 8, border: "none", cursor: "pointer",
              background: "transparent", color: "#8FC5A8",
              display: "flex", alignItems: "center",
              flexShrink: 0,
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight style={{ width: 16, height: 16 }} /> : <ChevronLeft style={{ width: 16, height: 16 }} />}
          </button>
        </div>

        {/* Nav items */}
        <nav
          style={{
            flex: 1, overflowY: "auto", overflowX: "hidden",
            padding: collapsed ? "14px 8px" : "14px 10px",
            display: "flex", flexDirection: "column", gap: 3,
          }}
          aria-label="Main navigation"
        >
          {navItems.map(({ id, label, icon: Icon }) => (
            <NavButton key={id} id={id} label={label} Icon={Icon} />
          ))}
        </nav>

        {/* Bottom: user + logout */}
        <div style={{
          flexShrink: 0, padding: collapsed ? "12px 8px" : "12px 10px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          {/* user info row */}
          {!collapsed && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12, marginBottom: 4,
              background: "rgba(255,255,255,0.06)",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: "linear-gradient(135deg,#B7E4C7,#52c97a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: "#0e3b2f",
              }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session?.name || "Biller"}
                </div>
                <div style={{ fontSize: 11, color: "#8FC5A8", marginTop: 1 }}>{session?.billerId || "—"}</div>
              </div>
            </div>
          )}

          {/* Sign out */}
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Sign out" : undefined}
            style={{
              display: "flex", alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 9, width: "100%",
              padding: collapsed ? "10px 0" : "9px 12px",
              borderRadius: 12, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              color: "#8FC5A8", background: "transparent", transition: "all 0.18s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
              e.currentTarget.style.color = "#fca5a5";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#8FC5A8";
            }}
          >
            <LogOut style={{ width: 15, height: 15, flexShrink: 0 }} aria-hidden />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    );
  }

  return (
    /*
     * ROOT: full-viewport flex ROW
     * Sidebar is a NATURAL FLEX CHILD with fixed pixel width.
     * Main area is a NATURAL FLEX CHILD that takes all remaining width.
     * No fixed/absolute positioning on desktop — pure flexbox.
     */
    <div style={{
      display: "flex",
      flexDirection: "row",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      background: "#F4F6FA",
    }}>

      {/* ══ MOBILE OVERLAY (only renders when mobileOpen) ══ */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.45)",
          }}
        />
      )}

      {/* ══ MOBILE DRAWER (fixed, slides in from left) ══ */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 110,
        width: 240,
        background: "#0e3b2f",
        borderTopRightRadius: 24, borderBottomRightRadius: 24,
        boxShadow: "4px 0 28px rgba(0,0,0,0.18)",
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        /* only visible at mobile widths */
        display: "none",
      }}
        className="mobile-sidebar"
      >
        {/* close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(255,255,255,0.1)", border: "none",
            borderRadius: 8, padding: 6, cursor: "pointer", color: "#fff",
            display: "flex", alignItems: "center",
          }}
          aria-label="Close menu"
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
        <SidebarContent />
      </div>

      {/* ══ DESKTOP SIDEBAR (natural flex child, NOT fixed) ══ */}
      <aside
        className="desktop-sidebar"
        style={{
          width: sidebarW,
          minWidth: sidebarW,
          maxWidth: sidebarW,
          flexShrink: 0,
          height: "100vh",
          background: "#0e3b2f",
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
          overflow: "hidden",
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s, max-width 0.28s",
          /* show on desktop only */
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SidebarContent />
      </aside>

      {/* ══ MAIN COLUMN (flex child, takes remaining width) ══ */}
      <div style={{
        flex: 1,
        minWidth: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ── Top Header ── */}
        <header style={{
          flexShrink: 0,
          background: "#ffffff",
          borderBottom: "1px solid var(--erp-border)",
          height: 64,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}>
          {/* Left: Mobile hamburger & Page title */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, width: "30%" }}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              style={{
                padding: 8, borderRadius: 8, border: "1px solid var(--erp-border)",
                background: "#ffffff", cursor: "pointer",
                color: "var(--erp-text-muted)", display: "none", alignItems: "center",
              }}
              aria-label="Open navigation"
            >
              <Menu style={{ width: 18, height: 18 }} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--erp-text)", margin: 0, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {pageTitle}
              </h1>
              {pageSubtitle && (
                <p style={{ fontSize: 12, color: "var(--erp-text-muted)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {pageSubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Center: Search */}
          <div className="header-search" style={{ position: "relative", width: "40%", maxWidth: 480, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                width: 16, height: 16, color: "var(--erp-text-light)", pointerEvents: "none",
              }} aria-hidden />
              <input
                type="search"
                placeholder="Search anything…"
                readOnly
                title="Use page-level search on Products / Customers"
                style={{
                  width: "100%", padding: "9px 16px 9px 40px",
                  borderRadius: 99, fontSize: 13,
                  border: "1px solid var(--erp-border)", background: "var(--erp-bg)",
                  color: "var(--erp-text)", outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={e => {
                  e.target.style.background = "#fff";
                  e.target.style.borderColor = "var(--erp-accent)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(183,228,199,0.2)";
                }}
                onBlur={e => {
                  e.target.style.background = "var(--erp-bg)";
                  e.target.style.borderColor = "var(--erp-border)";
                  e.target.style.boxShadow = "none";
                }}
                aria-label="Global search"
              />
            </div>
          </div>

          {/* Right: Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, width: "30%" }}>
            {/* Bell */}
            <button
              type="button"
              onClick={() => onNavigate("inventory")}
              style={{
                position: "relative", padding: 8, borderRadius: "50%",
                background: "#ffffff", border: "1px solid var(--erp-border)",
                cursor: "pointer", display: "flex", alignItems: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--erp-bg)"}
              onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
              aria-label="Notifications"
              title="Alerts available under Inventory"
            >
              <Bell style={{ width: 18, height: 18, color: "var(--erp-text-muted)" }} />
              <span style={{
                position: "absolute", top: 6, right: 8, width: 8, height: 8,
                borderRadius: "50%", background: "#ef4444", border: "2px solid #fff",
              }} />
            </button>

            {/* User chip */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 16, borderLeft: "1px solid var(--erp-border)" }}>
              <div className="header-user-info" style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--erp-text)", lineHeight: 1.2 }}>
                  {session?.name || "Biller"}
                </div>
                <div style={{ fontSize: 11, color: "var(--erp-text-muted)", marginTop: 2 }}>{session?.role || "Admin"}</div>
              </div>
              <div style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg, var(--erp-primary), var(--erp-primary-light))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "white",
                boxShadow: "0 2px 6px rgba(15,76,58,0.2)",
              }}>{initials}</div>
            </div>
          </div>
        </header>

        {/* ── Scrollable Page Content ── */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "24px",
          background: "var(--erp-bg)",
        }}>
          {children}
        </main>
      </div>

      {/* ── Responsive helpers (inline style tag) ── */}
      <style>{`
        @media (max-width: 1023px) {
          .desktop-sidebar { display: none !important; }
          .mobile-sidebar  { display: flex !important; flex-direction: column; }
          .mobile-menu-btn { display: flex !important; }
          .header-search   { display: none !important; }
          .header-user-info { display: none; }
        }
        .sidebar-collapse-btn:hover { background: rgba(255,255,255,0.1) !important; }
      `}</style>
    </div>
  );
}
