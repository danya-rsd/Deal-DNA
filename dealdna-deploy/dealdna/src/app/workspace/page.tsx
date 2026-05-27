"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDealToStore } from "@/hooks/useDealStore";
import type { DealProfile } from "@/lib/scoringEngine";

const SECTORS = ["Industrials", "Technology", "Healthcare", "Business Services", "Consumer", "Energy", "Financial Services"];
const GEOS = ["North America", "Western Europe", "Asia Pacific", "Latin America", "Middle East"];
const REV_MODELS = ["recurring", "transactional", "hybrid"];
const CUST_SEGS = ["enterprise", "smb", "consumer", "government"];
const MACRO = ["rate-stable", "rate-rising", "rate-falling", "recession"];

const label: React.CSSProperties = { color: "#475569", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem", display: "block" };
const input: React.CSSProperties = { width: "100%", background: "#0f1623", border: "1px solid #1e293b", borderRadius: "8px", padding: "0.6rem 0.75rem", color: "#e2e8f0", fontSize: "0.85rem", fontFamily: "'JetBrains Mono', monospace", boxSizing: "border-box" };

export default function WorkspacePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyName: "", sector: "Industrials", geography: "North America",
    entryEV: "", leverage: "", evEbitda: "", revenue: "", ebitdaMargin: "",
    revenueModel: "recurring", customerSegment: "enterprise",
    macroRegime: "rate-stable", targetMoic: "", targetIrr: "",
    holdPeriod: "", thesis: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.companyName.trim()) { setError("Company name is required"); return; }
    if (!form.entryEV || !form.leverage || !form.evEbitda || !form.revenue || !form.ebitdaMargin) {
      setError("Please fill in all financial fields"); return;
    }
    const profile: DealProfile = {
      companyName: form.companyName,
      sector: form.sector,
      geography: form.geography,
      entryEV: parseFloat(form.entryEV),
      leverage: parseFloat(form.leverage),
      evEbitda: parseFloat(form.evEbitda),
      revenue: parseFloat(form.revenue),
      ebitdaMargin: parseFloat(form.ebitdaMargin),
      revenueModel: form.revenueModel as DealProfile["revenueModel"],
      customerSegment: form.customerSegment as DealProfile["customerSegment"],
      macroRegime: form.macroRegime as DealProfile["macroRegime"],
      targetMoic: form.targetMoic ? parseFloat(form.targetMoic) : undefined,
      targetIrr: form.targetIrr ? parseFloat(form.targetIrr) : undefined,
      holdPeriod: form.holdPeriod ? parseFloat(form.holdPeriod) : undefined,
      thesis: form.thesis || undefined,
    };
    saveDealToStore(profile);
    router.push("/report");
  };

  const Field = ({ label: l, k, type = "text", placeholder = "" }: { label: string; k: string; type?: string; placeholder?: string }) => (
    <div>
      <label style={label}>{l}</label>
      <input style={input} type={type} placeholder={placeholder} value={(form as any)[k]} onChange={e => set(k, e.target.value)} />
    </div>
  );

  const Select = ({ label: l, k, options }: { label: string; k: string; options: string[] }) => (
    <div>
      <label style={label}>{l}</label>
      <select style={{ ...input, cursor: "pointer" }} value={(form as any)[k]} onChange={e => set(k, e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080c12", fontFamily: "'JetBrains Mono', monospace" }}>
      <nav style={{ borderBottom: "1px solid #1e293b", padding: "0 2rem", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#080c12", zIndex: 50 }}>
        <a href="/dashboard" style={{ color: "#14b8a6", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.1em", textDecoration: "none" }}>
          DEAL<span style={{ color: "#f1f5f9" }}>DNA</span>
        </a>
        <span style={{ color: "#64748b", fontSize: "0.78rem" }}>Deal Intake</span>
      </nav>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <h1 style={{ color: "#f1f5f9", fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>New Deal Analysis</h1>
        <p style={{ color: "#475569", fontSize: "0.82rem", marginBottom: "2rem" }}>Enter deal parameters to generate an IC intelligence report</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Company */}
          <div style={{ background: "#0a0e17", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ color: "#94a3b8", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>Company</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div style={{ gridColumn: "1/-1" }}><Field label="Company Name" k="companyName" placeholder="e.g. TechStack Holdings" /></div>
              <Select label="Sector" k="sector" options={SECTORS} />
              <Select label="Geography" k="geography" options={GEOS} />
              <Select label="Macro Regime" k="macroRegime" options={MACRO} />
            </div>
          </div>

          {/* Financials */}
          <div style={{ background: "#0a0e17", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ color: "#94a3b8", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>Financial Profile</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <Field label="Entry EV ($M)" k="entryEV" type="number" placeholder="850" />
              <Field label="Revenue ($M)" k="revenue" type="number" placeholder="210" />
              <Field label="EBITDA Margin (%)" k="ebitdaMargin" type="number" placeholder="26" />
              <Field label="EV/EBITDA (x)" k="evEbitda" type="number" placeholder="11.2" />
              <Field label="Leverage (x)" k="leverage" type="number" placeholder="6.0" />
              <Field label="Hold Period (yrs)" k="holdPeriod" type="number" placeholder="4" />
              <Field label="Target MOIC (x)" k="targetMoic" type="number" placeholder="3.0" />
              <Field label="Target IRR (%)" k="targetIrr" type="number" placeholder="28" />
            </div>
          </div>

          {/* Deal Profile */}
          <div style={{ background: "#0a0e17", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ color: "#94a3b8", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>Deal Profile</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Select label="Revenue Model" k="revenueModel" options={REV_MODELS} />
              <Select label="Customer Segment" k="customerSegment" options={CUST_SEGS} />
              <div style={{ gridColumn: "1/-1" }}>
                <label style={label}>Investment Thesis</label>
                <textarea
                  style={{ ...input, minHeight: "80px", resize: "vertical" }}
                  placeholder="Describe the investment thesis..."
                  value={form.thesis}
                  onChange={e => set("thesis", e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <div style={{ background: "#ef444420", border: "1px solid #ef444440", borderRadius: "8px", padding: "0.75rem 1rem", color: "#ef4444", fontSize: "0.8rem" }}>{error}</div>}

          <button
            onClick={handleSubmit}
            style={{ background: "#14b8a6", border: "none", borderRadius: "10px", padding: "0.85rem 1.5rem", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}
          >
            Generate IC Intelligence Report →
          </button>
        </div>
      </div>
    </div>
  );
}
