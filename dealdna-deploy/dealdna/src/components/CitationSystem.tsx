/**
 * DealDNA — Phase 4
 * src/components/CitationSystem.tsx
 * CitationBadge (inline) + CitationLedger (sidebar panel)
 */
"use client";
import type { Citation } from "@/lib/reasoningEngine";
import type { ScoredPrecedent } from "@/lib/scoringEngine";

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  citation: Citation;
  onClick: (c: Citation) => void;
  active: boolean;
}

export function CitationBadge({ citation, onClick, active }: BadgeProps) {
  return (
    <button
      onClick={() => onClick(citation)}
      title={citation.precedentName}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        background: active ? "#0d9488" : "#0d948820",
        border: `1px solid ${active ? "#0d9488" : "#0d948840"}`,
        borderRadius: "4px",
        padding: "1px 6px",
        color: active ? "#fff" : "#14b8a6",
        fontSize: "0.7rem",
        fontWeight: 600,
        cursor: "pointer",
        verticalAlign: "middle",
        marginLeft: "4px",
        transition: "all 0.15s ease",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      ↗ {citation.precedentId.toUpperCase()}
    </button>
  );
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

interface LedgerProps {
  citations: Citation[];
  precedents: ScoredPrecedent[];
  activeCitation: Citation | null;
  onSelect: (c: Citation | null) => void;
}

export function CitationLedger({
  citations,
  precedents,
  activeCitation,
  onSelect,
}: LedgerProps) {
  const getPrecedent = (id: string) =>
    precedents.find((p) => p.id === id);

  return (
    <div
      style={{
        background: "#0a0e17",
        border: "1px solid #1e293b",
        borderRadius: "12px",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#14b8a6",
          }}
        />
        <span
          style={{
            color: "#94a3b8",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Citation Ledger
        </span>
        <span
          style={{
            marginLeft: "auto",
            background: "#1e293b",
            borderRadius: "10px",
            padding: "1px 8px",
            color: "#64748b",
            fontSize: "0.68rem",
          }}
        >
          {citations.length} refs
        </span>
      </div>

      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
      >
        {citations.map((c) => {
          const prec = getPrecedent(c.precedentId);
          const isActive = activeCitation?.id === c.id;
          return (
            <div
              key={c.id}
              onClick={() => onSelect(isActive ? null : c)}
              style={{
                background: isActive ? "#0d948815" : "#0f1623",
                border: `1px solid ${isActive ? "#0d9488" : "#1e293b"}`,
                borderRadius: "8px",
                padding: "0.75rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.3rem",
                }}
              >
                <span
                  style={{
                    color: "#14b8a6",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    fontFamily: "monospace",
                  }}
                >
                  {c.precedentId.toUpperCase()}
                </span>
                <span style={{ color: "#475569", fontSize: "0.65rem" }}>
                  {c.dimension}
                </span>
              </div>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {c.precedentName}
              </p>
              {prec && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.4rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background:
                        prec.outcome === "Strong Exit"
                          ? "#0d948820"
                          : "#1e293b",
                      color:
                        prec.outcome === "Strong Exit"
                          ? "#14b8a6"
                          : "#64748b",
                      fontSize: "0.62rem",
                      padding: "1px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {prec.outcome}
                  </span>
                  {prec.moic && (
                    <span
                      style={{ color: "#64748b", fontSize: "0.62rem" }}
                    >
                      {prec.moic}x MOIC
                    </span>
                  )}
                  <span style={{ color: "#64748b", fontSize: "0.62rem" }}>
                    {prec.year}
                  </span>
                </div>
              )}
              {isActive && (
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "0.72rem",
                    marginTop: "0.5rem",
                    fontStyle: "italic",
                    lineHeight: 1.5,
                    marginBottom: 0,
                  }}
                >
                  &ldquo;{c.text}&rdquo;
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
