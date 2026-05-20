import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [billerId, setBillerId] = useState("biller1");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(billerId, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg,#edf7f2 0%,#f4f9f6 40%,#e8f4f0 100%)",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "min(96vw, 1100px)",
          height: "min(90vh, 680px)",
          background: "#fff",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(15,76,58,0.14)",
          border: "1px solid #e0eeea",
        }}
      >
        {/* ── LEFT PANEL ── */}
        <div
          style={{
            flex: 1,
            background: "linear-gradient(160deg,#0e3b2f 0%,#176349 60%,#1a7a57 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "48px 40px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
          className="hidden md:flex"
        >
          {/* Decorative circles */}
          <div style={{
            position: "absolute", top: -60, right: -60, width: 220, height: 220,
            borderRadius: "50%", background: "rgba(183,228,199,0.1)"
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: -40, width: 160, height: 160,
            borderRadius: "50%", background: "rgba(183,228,199,0.08)"
          }} />

          <div style={{
            width: 80, height: 80, borderRadius: 22,
            background: "linear-gradient(135deg,#B7E4C7,#52c97a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, marginBottom: 28,
            boxShadow: "0 8px 28px rgba(183,228,199,0.4)"
          }}>
            💊
          </div>

          <h1 style={{ fontSize: 42, margin: 0, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
            Pharma<span style={{ color: "#B7E4C7" }}>Sync</span>
          </h1>
          <p style={{ fontSize: 15, color: "#8FC5A8", marginTop: 10, fontWeight: 500 }}>
            Smart Pharmacy ERP
          </p>

          <div style={{ width: 48, height: 3, background: "rgba(183,228,199,0.5)", borderRadius: 99, margin: "28px 0" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["📦", "Full inventory tracking"],
              ["🧾", "Invoicing & sales history"],
              ["👥", "Patient & customer records"],
              ["📊", "Revenue analytics"],
            ].map(([icon, text]) => (
              <div key={text} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px", borderRadius: 14,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 13, color: "#cde8db", fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div
          style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "48px 40px",
          }}
        >
          <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 380 }}>

            {/* Header */}
            <div style={{ marginBottom: 36 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 16,
                background: "linear-gradient(135deg,#0F4C3A,#176349)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(15,76,58,0.3)"
              }}>
                <ShieldCheck style={{ width: 22, height: 22, color: "#B7E4C7" }} />
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1A2332", margin: 0 }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: "#6B7A8D", marginTop: 6 }}>
                Sign in to your pharmacy account
              </p>
            </div>

            {/* Biller ID */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 600,
                color: "#6B7A8D", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em"
              }}>
                Biller ID
              </label>
              <input
                type="text"
                value={billerId}
                onChange={(e) => setBillerId(e.target.value)}
                required
                placeholder="Enter your biller ID"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: "1.5px solid #E6EBF0", fontSize: 14,
                  outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
                  color: "#1A2332", background: "#fafcfb",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "#0F4C3A";
                  e.target.style.boxShadow = "0 0 0 3px rgba(15,76,58,0.1)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "#E6EBF0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 600,
                color: "#6B7A8D", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em"
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  style={{
                    width: "100%", padding: "12px 44px 12px 16px", borderRadius: 12,
                    border: "1.5px solid #E6EBF0", fontSize: 14,
                    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
                    color: "#1A2332", background: "#fafcfb",
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "#0F4C3A";
                    e.target.style.boxShadow = "0 0 0 3px rgba(15,76,58,0.1)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "#E6EBF0";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 4,
                    color: "#9BAABB", display: "flex", alignItems: "center"
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 16, padding: "10px 14px", borderRadius: 10,
                background: "#fef2f2", border: "1px solid #fca5a5",
                fontSize: 13, color: "#dc2626", fontWeight: 500
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 12,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: loading
                  ? "#a7c4b8"
                  : "linear-gradient(135deg,#0F4C3A,#176349)",
                color: "white", fontWeight: 700, fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : "0 4px 16px rgba(15,76,58,0.35)",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? (
                "Signing in…"
              ) : (
                <>
                  <LogIn style={{ width: 18, height: 18 }} />
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
