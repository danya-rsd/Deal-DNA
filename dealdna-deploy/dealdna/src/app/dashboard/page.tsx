"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRECEDENTS } from "@/lib/precedents";

const SECTORS = ["All", "Industrials", "Technology", "Healthcare", "Business Services", "Consumer", "Energy", "Financial Services"];

export default function DashboardPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? PRECEDENTS : PRECEDENTS.filter(p => p.sector === filter);
  const exits = PRECEDENTS.filter(p => p.outcome === "Strong Exit");
  const avgMoic = exits.filter(p => p.moic).reduce((s, p) => s + (p.moic ?? 0), 0) / exits.filter(p => p.moic).length;
  const avgIrr = exits.filter(p => p.irr).reduce((s, p) => s + (p.irr ?? 0), 0) / exits.filter(p => p.irr).length;
  const exitRate = Math.round((exits.length / PRECEDENTS.length) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#080c12", fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #1e293b", padding: "0 2rem", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#080c12", zIndex: 50 }}>
        <span style={{ color: "#14b8a6", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.1em" }}>
          DEAL<span style={{ color: "#f1f5f9" }}>DNA</span>
        </span>
        <button
          onClick={() => router.push("/workspace")}
          style={{ background: "#14b8a6", border: "none", borderRadius: "8px", padding: "0.4rem 1rem", color: "#fff", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          + New Deal Analysis
        </button>
      </nav>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "1.6rem", fontWeight: 600, margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            Institutional Precedent Database
          </h1>
          <p style={{ color: "#475569", fontSize: "0.82rem", margin: 0 }}>
            {PRECEDENTS.length} precedents · 6 sectors · KKR, Blackstone, Carlyle, Vista and more
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
          {[
            { label: "Strong Exit Rate", value: `${exitRate}%`, sub: `${exits.length} of ${PRECEDENTS.length} deals` },
            { label: "Avg MOIC (Exits)", value: `${avgMoic.toFixed(1)}x`, sub: "Realized returns" },
            { label: "Avg IRR (Exits)", value: `${avgIrr.toFixed(0)}%`, sub: "Internal rate of return" },
          ].map(s => (
            <div key={s.label} style={{ background: "#0a0e17", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ color: "#475569", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ color: "#14b8a6", fontSize: "1.6rem", fontWeight: 700, margin: "0.25rem 0 0.15rem" }}>{s.value}</div>
              <div style={{ color: "#334155", fontSize: "0.72rem" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Sector filter */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {SECTORS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                background: filter === s ? "#14b8a6" : "transparent",
                border: `1px solid ${filter === s ? "#14b8a6" : "#1e293b"}`,
                borderRadius: "6px", padding: "0.3rem 0.75rem",
                color: filter === s ? "#fff" : "#64748b",
                fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit"
              }}
            >{s}</button>
          ))}
        </div>

        {/* Precedent list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: "#0a0e17", border: "1px solid #1e293b", borderRadius: "10px", padding: "1rem 1.25rem", display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
                  <span style={{ color: "#14b8a6", fontSize: "0.65rem", fontFamily: "monospace" }}>{p.id.toUpperCase()}</span>
                  <span style={{ color: "#e2e8f0", fontSize: "0.88rem", fontWeight: 500 }}>{p.company}</span>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ color: "#475569", fontSize: "0.72rem" }}>{p.sponsor} · {p.year}</span>
                  <span style={{ color: "#334155" }}>·</span>
                  <span style={{ color: "#475569", fontSize: "0.72rem" }}>{p.sector}</span>
                  <span style={{ color: "#334155" }}>·</span>
                  <span style={{ color: "#475569", fontSize: "0.72rem" }}>{p.geography}</span>
                  <span style={{ color: "#334155" }}>·</span>
                  <span style={{ color: "#475569", fontSize: "0.72rem" }}>{p.leverage}x leverage · {p.evEbitda}x EV/EBITDA</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{
                  background: p.outcome === "Strong Exit" ? "#14b8a620" : p.outcome === "Hold" ? "#1e293b" : "#f59e0b20",
                  border: `1px solid ${p.outcome === "Strong Exit" ? "#14b8a640" : p.outcome === "Hold" ? "#334155" : "#f59e0b40"}`,
                  borderRadius: "4px", padding: "2px 8px",
                  color: p.outcome === "Strong Exit" ? "#14b8a6" : p.outcome === "Hold" ? "#64748b" : "#f59e0b",
                  fontSize: "0.68rem", fontWeight: 600
                }}>{p.outcome}</span>
                {p.moic && <div style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: "0.3rem" }}>{p.moic}x MOIC</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
