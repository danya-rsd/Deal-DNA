/**
 * DealDNA — Phase 4
 * src/app/report/page.tsx
 *
 * Main intelligence report page.
 * Hydrates from localStorage (workspace) → ranks precedents → generates reasoning → renders report.
 */
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadDealFromStore } from "@/hooks/useDealStore";
import { getPrecedentsForScoring } from "@/lib/precedents";
import { rankPrecedents } from "@/lib/scoringEngine";
import { generateReasoning } from "@/lib/reasoningEngine";
import { IntelligenceProcessor } from "@/components/IntelligenceProcessor";
import { CitationLedger } from "@/components/CitationSystem";
import { useToast } from "@/components/ToastSystem";
import type { DealProfile, ScoredPrecedent } from "@/lib/scoringEngine";
import type { ReasoningOutput, Citation } from "@/lib/reasoningEngine";

// ─── Fallback demo deal ────────────────────────────────────────────────────────
const DEMO_DEAL: DealProfile = {
  companyName: "Apex Industrial Holdings",
  sector: "Industrials",
  geography: "North America",
  entryEV: 850,
  leverage: 6.0,
  evEbitda: 11.2,
  revenue: 210,
  ebitdaMargin: 26,
  revenueModel: "recurring",
  customerSegment: "enterprise",
  macroRegime: "rate-stable",
  targetMoic: 3.2,
  targetIrr: 28,
  holdPeriod: 4,
  thesis: "Platform consolidation in fragmented industrials — buy-and-build to 5 bolt-ons",
  keyRisks: ["Leverage covenant sensitivity", "Cyclicality", "Customer concentration"],
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  card: {
    background: "#0a0e17",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "1.25rem",
  } as React.CSSProperties,
  label: {
    color: "#475569",
    fontSize: "0.68rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  },
  value: {
    color: "#e2e8f0",
    fontSize: "0.88rem",
    fontWeight: 500,
  } as React.CSSProperties,
  sectionTitle: {
    color: "#94a3b8",
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  } as React.CSSProperties,
};

function Accent() {
  return (
    <div
      style={{
        width: "3px",
        height: "14px",
        background: "#14b8a6",
        borderRadius: "2px",
        flexShrink: 0,
      }}
    />
  );
}

function Pill({
  children,
  color = "#14b8a6",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: "4px",
        color,
        fontSize: "0.68rem",
        padding: "2px 8px",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function ScoreBar({
  score,
  label,
  rationale,
}: {
  score: number;
  label: string;
  rationale: string;
}) {
  const color =
    score >= 70 ? "#14b8a6" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.3rem",
        }}
      >
        <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{label}</span>
        <span style={{ color, fontWeight: 600, fontSize: "0.82rem" }}>
          {score}
        </span>
      </div>
      <div
        style={{
          background: "#1e293b",
          borderRadius: "4px",
          height: "6px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: color,
            width: `${score}%`,
            borderRadius: "4px",
            transition: "width 1s ease",
          }}
        />
      </div>
      <p
        style={{
          color: "#475569",
          fontSize: "0.72rem",
          margin: "0.3rem 0 0",
          lineHeight: 1.5,
        }}
      >
        {rationale}
      </p>
    </div>
  );
}

function RiskBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    High: "#ef4444",
    Medium: "#f59e0b",
    Low: "#14b8a6",
  };
  const c = map[severity] ?? "#64748b";
  return <Pill color={c}>{severity}</Pill>;
}

// ─── Export ───────────────────────────────────────────────────────────────────
function exportReport(
  deal: DealProfile,
  output: ReasoningOutput,
  precedents: ScoredPrecedent[]
) {
  const date = new Date().toISOString().split("T")[0];
  const name = deal.companyName.replace(/\s+/g, "_");
  const content = `DEALDNA — IC INTELLIGENCE REPORT
Generated: ${date}
Company: ${deal.companyName}
Sector: ${deal.sector} | Geography: ${deal.geography}
Entry EV: $${deal.entryEV}M | Leverage: ${deal.leverage}x | EV/EBITDA: ${deal.evEbitda}x
EBITDA Margin: ${deal.ebitdaMargin}% | Revenue: $${deal.revenue}M

IC RECOMMENDATION: ${output.icRecommendation}
Confidence: ${output.confidenceLevel}%

EXECUTIVE SUMMARY
${output.executiveSummary}

RATIONALE
${output.recommendationRationale}

THESIS SCORES
${output.thesisScores.map((s) => `• ${s.dimension}: ${s.score}/100 — ${s.rationale}`).join("\n")}

RISK FLAGS
${output.riskFlags.map((r) => `• [${r.severity}] ${r.cluster}: ${r.description}`).join("\n")}

KEY LESSONS FROM PRECEDENTS
${output.keyLessons.map((l) => `• ${l}`).join("\n")}

HIDDEN RISKS IDENTIFIED
${output.hiddenRisks.map((r) => `• ${r}`).join("\n")}

TOP PRECEDENTS
${precedents
  .map(
    (p) =>
      `• ${p.company} (${p.sponsor}, ${p.year}) — ${p.outcome}${
        p.moic ? `, ${p.moic}x MOIC` : ""
      } | Similarity: ${p.similarityScore}%`
  )
  .join("\n")}

---
DealDNA Institutional Intelligence Engine
`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DealDNA_${name}_${date}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function ReportPage() {
  const router = useRouter();
  const { success, warning, info } = useToast();

  const [phase, setPhase] = useState<"loading" | "processing" | "ready">(
    "loading"
  );
  const [deal, setDeal] = useState<DealProfile>(DEMO_DEAL);
  const [precedents, setPrecedents] = useState<ScoredPrecedent[]>([]);
  const [output, setOutput] = useState<ReasoningOutput | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const useLiveAI = process.env.NEXT_PUBLIC_ENABLE_LIVE_AI === "true";

  // Hydrate deal from localStorage or fallback to demo
  useEffect(() => {
    const stored = loadDealFromStore();
    if (stored) {
      setDeal(stored.profile);
      const age = Date.now() - stored.timestamp;
      if (age < 60_000) {
        info("Deal loaded", `Analyzing ${stored.profile.companyName}`);
      }
    } else {
      warning(
        "Demo mode",
        "Using sample deal — submit a deal from workspace for live analysis"
      );
    }
    setPhase("processing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = useCallback(
    async (dealProfile: DealProfile) => {
      try {
        const allPrecs = getPrecedentsForScoring();
        const ranked = rankPrecedents(dealProfile, allPrecs, 5);
        setPrecedents(ranked);

        const result = await generateReasoning(dealProfile, ranked, useLiveAI);
        setOutput(result);
        setPhase("ready");
        success(
          "Report ready",
          `${ranked.length} precedents · ${result.confidenceLevel}% confidence`
        );
      } catch (err) {
        console.error("[Report]", err);
        warning("Analysis error", "Using simulation fallback");
        const allPrecs = getPrecedentsForScoring();
        const ranked = rankPrecedents(dealProfile, allPrecs, 5);
        setPrecedents(ranked);
        const result = await generateReasoning(dealProfile, ranked, false);
        setOutput(result);
        setPhase("ready");
      }
    },
    [useLiveAI, success, warning]
  );

  const onProcessingComplete = useCallback(() => {
    runAnalysis(deal);
  }, [deal, runAnalysis]);

  if (phase === "loading")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080c12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#14b8a6",
            fontSize: "0.82rem",
            fontFamily: "monospace",
          }}
        >
          Initializing...
        </div>
      </div>
    );

  if (phase === "processing") {
    return (
      <IntelligenceProcessor
        companyName={deal.companyName || "Deal"}
        onComplete={onProcessingComplete}
      />
    );
  }

  if (!output) return null;

  const recColor =
    output.icRecommendation === "Proceed"
      ? "#14b8a6"
      : output.icRecommendation === "Conditional Proceed"
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080c12",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          borderBottom: "1px solid #1e293b",
          padding: "0 2rem",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "#080c12",
          zIndex: 50,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: "1rem" }}
        >
          <a
            href="/dashboard"
            style={{
              color: "#14b8a6",
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "0.1em",
              textDecoration: "none",
            }}
          >
            DEAL<span style={{ color: "#f1f5f9" }}>DNA</span>
          </a>
          <span style={{ color: "#334155" }}>/</span>
          <span style={{ color: "#64748b", fontSize: "0.78rem" }}>
            Intelligence Report
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => {
              info("Sharing", "Report link copied to clipboard");
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            style={{
              background: "transparent",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "0.4rem 0.9rem",
              color: "#64748b",
              fontSize: "0.75rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Share
          </button>
          <button
            onClick={() => {
              exportReport(deal, output, precedents);
              success("Exported", "IC memo downloaded");
            }}
            style={{
              background: "#14b8a6",
              border: "none",
              borderRadius: "8px",
              padding: "0.4rem 1rem",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Export IC Memo ↓
          </button>
          <button
            onClick={() => router.push("/workspace")}
            style={{
              background: "transparent",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "0.4rem 0.9rem",
              color: "#64748b",
              fontSize: "0.75rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            New Deal
          </button>
        </div>
      </nav>

      {/* Body */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "2rem 1.5rem 4rem",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1.75rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.4rem",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: recColor,
                }}
              />
              <span
                style={{
                  color: recColor,
                  fontSize: "0.7rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {output.icRecommendation}
              </span>
              <span style={{ color: "#334155", fontSize: "0.7rem" }}>·</span>
              <span style={{ color: "#475569", fontSize: "0.7rem" }}>
                {output.confidenceLevel}% confidence
              </span>
            </div>
            <h1
              style={{
                color: "#f1f5f9",
                fontSize: "1.8rem",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              {deal.companyName}
            </h1>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <Pill>{deal.sector}</Pill>
              <Pill color="#64748b">{deal.geography}</Pill>
              <Pill color="#8b5cf6">{deal.macroRegime}</Pill>
              {useLiveAI && <Pill color="#f59e0b">Live AI</Pill>}
            </div>
          </div>

          {/* Key metrics */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {[
              { label: "Entry EV", value: `$${deal.entryEV}M` },
              { label: "Leverage", value: `${deal.leverage}x` },
              { label: "EV/EBITDA", value: `${deal.evEbitda}x` },
              { label: "EBITDA Mgn", value: `${deal.ebitdaMargin}%` },
            ].map((m) => (
              <div
                key={m.label}
                style={{ ...S.card, textAlign: "center", minWidth: "90px" }}
              >
                <div style={S.label}>{m.label}</div>
                <div
                  style={{
                    ...S.value,
                    fontSize: "1.1rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          {/* Left column */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {/* Executive Summary */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <Accent />
                Executive Summary
              </div>
              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: "0.88rem",
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {output.executiveSummary}
              </p>
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1rem",
                  background: `${recColor}10`,
                  border: `1px solid ${recColor}30`,
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    color: recColor,
                    fontSize: "0.7rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.3rem",
                  }}
                >
                  IC Recommendation
                </div>
                <p
                  style={{
                    color: "#e2e8f0",
                    fontSize: "0.82rem",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {output.recommendationRationale}
                </p>
              </div>
            </div>

            {/* Thesis Scores */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <Accent />
                Thesis Scorecard
              </div>
              {output.thesisScores.map((s) => (
                <ScoreBar
                  key={s.dimension}
                  score={s.score}
                  label={s.dimension}
                  rationale={s.rationale}
                />
              ))}
            </div>

            {/* Risk Flags */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <Accent />
                Risk Intelligence
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {output.riskFlags.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#0f1623",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      padding: "0.85rem",
                      borderLeft: `3px solid ${
                        r.severity === "High"
                          ? "#ef4444"
                          : r.severity === "Medium"
                          ? "#f59e0b"
                          : "#14b8a6"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.4rem",
                      }}
                    >
                      <RiskBadge severity={r.severity} />
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "0.78rem",
                          fontWeight: 500,
                        }}
                      >
                        {r.cluster}
                      </span>
                      {r.precedentRef && (
                        <span
                          style={{
                            marginLeft: "auto",
                            color: "#475569",
                            fontSize: "0.68rem",
                          }}
                        >
                          ref: {r.precedentRef}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "0.78rem",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {r.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Precedent Cohort */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <Accent />
                Precedent Cohort ({precedents.length} matches)
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {precedents.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      background: "#0f1623",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      padding: "0.85rem",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "0.5rem",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.3rem",
                        }}
                      >
                        <span
                          style={{
                            color: "#14b8a6",
                            fontSize: "0.68rem",
                            fontFamily: "monospace",
                          }}
                        >
                          #{i + 1}
                        </span>
                        <span
                          style={{
                            color: "#e2e8f0",
                            fontSize: "0.82rem",
                            fontWeight: 500,
                          }}
                        >
                          {p.company}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                          marginBottom: "0.4rem",
                        }}
                      >
                        <span style={S.label}>
                          {p.sponsor} · {p.year}
                        </span>
                        <span style={S.label}>·</span>
                        <span style={S.label}>{p.sector}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <Pill
                          color={
                            p.outcome === "Strong Exit"
                              ? "#14b8a6"
                              : p.outcome === "Hold"
                              ? "#64748b"
                              : "#f59e0b"
                          }
                        >
                          {p.outcome}
                        </Pill>
                        <span
                          style={{ color: "#475569", fontSize: "0.72rem" }}
                        >
                          {p.leverage}x lev
                        </span>
                        <span
                          style={{ color: "#475569", fontSize: "0.72rem" }}
                        >
                          {p.evEbitda}x entry
                        </span>
                        {p.moic && (
                          <span
                            style={{ color: "#94a3b8", fontSize: "0.72rem" }}
                          >
                            {p.moic}x MOIC
                          </span>
                        )}
                        {p.irr && (
                          <span
                            style={{ color: "#94a3b8", fontSize: "0.72rem" }}
                          >
                            {p.irr}% IRR
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: "#14b8a6",
                          fontSize: "1rem",
                          fontWeight: 700,
                        }}
                      >
                        {p.similarityScore}%
                      </div>
                      <div style={{ color: "#475569", fontSize: "0.65rem" }}>
                        similarity
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Lessons */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <Accent />
                Key Lessons from Precedents
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {output.keyLessons.map((lesson, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid #0f1623",
                    }}
                  >
                    <span
                      style={{
                        color: "#14b8a6",
                        fontSize: "0.7rem",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      →
                    </span>
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {lesson}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden Risks */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <Accent />
                Hidden Risks Identified
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {output.hiddenRisks.map((risk, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid #0f1623",
                    }}
                  >
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "0.7rem",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      !
                    </span>
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {risk}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              position: "sticky",
              top: "68px",
            }}
          >
            <CitationLedger
              citations={output.citations}
              precedents={precedents}
              activeCitation={activeCitation}
              onSelect={setActiveCitation}
            />

            {/* Deal summary card */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <Accent />
                Deal Parameters
              </div>
              {(
                [
                  ["Revenue Model", deal.revenueModel],
                  ["Customer", deal.customerSegment],
                  ["Hold Period", `${deal.holdPeriod}yr`],
                  [
                    "Target MOIC",
                    deal.targetMoic ? `${deal.targetMoic}x` : "—",
                  ],
                  [
                    "Target IRR",
                    deal.targetIrr ? `${deal.targetIrr}%` : "—",
                  ],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.4rem 0",
                    borderBottom: "1px solid #0f1623",
                  }}
                >
                  <span style={S.label}>{k}</span>
                  <span style={{ ...S.value, fontSize: "0.8rem" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Export / Actions */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <Accent />
                Actions
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <button
                  onClick={() => {
                    exportReport(deal, output, precedents);
                    success("Downloaded", "IC memo exported");
                  }}
                  style={{
                    background: "#14b8a6",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.65rem 1rem",
                    color: "#fff",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  ↓ Download Intelligence Report
                </button>
                <button
                  onClick={() => {
                    if (
                      typeof navigator !== "undefined" &&
                      navigator.clipboard
                    ) {
                      navigator.clipboard.writeText(window.location.href);
                    }
                    info("Copied", "Share link in clipboard");
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    padding: "0.6rem 1rem",
                    color: "#64748b",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  ↗ Share Analysis Link
                </button>
                <button
                  onClick={() => router.push("/workspace")}
                  style={{
                    background: "transparent",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    padding: "0.6rem 1rem",
                    color: "#64748b",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  + New Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
