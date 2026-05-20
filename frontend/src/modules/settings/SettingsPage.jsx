import React, { useState } from "react";
import { LogOut, User, Server, ShieldCheck, Building2, Users, SlidersHorizontal, Database } from "lucide-react";
import SyncStatus from "../../components/SyncStatus";

export default function SettingsPage({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: Building2 },
    { id: "profile", label: "Profile", icon: User },
    { id: "users", label: "Users", icon: Users },
    { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
    { id: "backup", label: "Backup", icon: Database },
  ];

  return (
    <div className="erp-page" style={{ maxWidth: 1000, marginTop: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 48 }}>

        {/* Sidebar Nav */}
        <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 18px", borderRadius: 12,
                  background: isActive ? "var(--erp-green-soft)" : "transparent",
                  color: isActive ? "var(--erp-primary)" : "var(--erp-text-muted)",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.2s",
                  border: "none", cursor: "pointer", textAlign: "left", width: "100%"
                }}
              >
                <Icon style={{ width: 18, height: 18, color: isActive ? "var(--erp-primary)" : "var(--erp-text-light)" }} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Pane */}
        <div style={{ flex: 1, minWidth: 300 }}>

          {/* General Settings */}
          {activeTab === "general" && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--erp-text)", marginBottom: 28 }}>General Settings</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>
                <div className="erp-field">
                  <label className="erp-label">Pharmacy Name</label>
                  <input type="text" className="erp-input" defaultValue="PharmaSync Medical Store" />
                </div>
                <div className="erp-field">
                  <label className="erp-label">Email</label>
                  <input type="email" className="erp-input" defaultValue="pharmasync@email.com" />
                </div>
                <div className="erp-field">
                  <label className="erp-label">Phone</label>
                  <input type="tel" className="erp-input" defaultValue="9876543210" />
                </div>
                <div className="erp-field">
                  <label className="erp-label">Address</label>
                  <input type="text" className="erp-input" defaultValue="Poinachi,kasaragod" />
                </div>
                <div>
                  <button className="erp-btn-primary" style={{ marginTop: 12, padding: "12px 24px" }} onClick={() => window.showToast?.("Settings saved successfully!")}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Settings (Old UI preservation) */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in" style={{ maxWidth: 600 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--erp-text)", marginBottom: 24 }}>My Profile</h3>

              <div className="erp-card overflow-hidden">
                <div className="erp-card-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: "var(--erp-green-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <User style={{ width: 18, height: 18, color: "var(--erp-primary)" }} />
                  </div>
                  <div>
                    <h3>Account</h3>
                    <p>Signed-in biller session details</p>
                  </div>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { label: "Name", value: session?.name || "—" },
                      { label: "Biller ID", value: session?.billerId || "—", mono: true },
                      { label: "Role", value: session?.role || "biller" },
                    ].map(({ label, value, mono }) => (
                      <div key={label} style={{
                        padding: "14px 16px", borderRadius: 12,
                        background: "var(--erp-bg)", border: "1px solid var(--erp-border)"
                      }}>
                        <dt style={{ fontSize: 11, fontWeight: 600, color: "var(--erp-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                          {label}
                        </dt>
                        <dd style={{
                          fontSize: 15, fontWeight: 700, color: "var(--erp-text)",
                          fontFamily: mono ? "monospace" : "inherit"
                        }}>
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="erp-card overflow-hidden">
                <div className="erp-card-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: "#fee2e2",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <ShieldCheck style={{ width: 18, height: 18, color: "#dc2626" }} />
                  </div>
                  <div>
                    <h3>Session</h3>
                    <p>Sign out of your pharmacy account</p>
                  </div>
                </div>
                <div className="p-6">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="erp-btn-danger"
                    style={{ padding: "10px 20px" }}
                  >
                    <LogOut style={{ width: 15, height: 15 }} />
                    Sign Out
                  </button>
                  <p style={{ fontSize: 12, color: "var(--erp-text-muted)", marginTop: 10 }}>
                    You will be returned to the login screen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Backup / Sync Settings */}
          {activeTab === "backup" && (
            <div className="animate-fade-in" style={{ maxWidth: 600 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--erp-text)", marginBottom: 24 }}>Backup & Sync</h3>
              <div className="erp-card overflow-hidden">
                <div className="erp-card-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: "#ede9fe",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Server style={{ width: 18, height: 18, color: "#7c3aed" }} />
                  </div>
                  <div>
                    <h3>Sync & Offline</h3>
                    <p>Automatic background sync — no manual button needed</p>
                  </div>
                </div>
                <div className="p-6">
                  <SyncStatus variant="default" />
                </div>
              </div>
            </div>
          )}

          {/* Empty States for Users / Preferences */}
          {(activeTab === "users" || activeTab === "preferences") && (
            <div className="erp-empty mt-10 animate-fade-in">
              <p style={{ fontSize: 32, marginBottom: 8 }}>🚧</p>
              <p style={{ fontWeight: 600, color: "var(--erp-text)", fontSize: 16 }}>Coming Soon</p>
              <p style={{ fontSize: 14, marginTop: 4 }}>This module is currently under development.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
