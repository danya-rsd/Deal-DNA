/**
 * DealDNA — Phase 4
 * src/components/IntelligenceProcessor.tsx
 * Animated IC analysis progression screen shown between workspace → report.
 */
"use client";
import { useEffect, useState, useRef } from "react";

interface Stage {
  label: string;
  duration: number;
  detail: string;
}

const STAGES: Stage[] = [
  {
    label: "Parsing deal parameters",
    duration: 600,
    detail: "Extracting sector, leverage, and financial profile...",
  },
  {
    label: "Indexing precedent database",
    duration: 800,
    detail: "Scanning 20 institutional precedents across 6 sectors...",
  },
  {
    label: "Running similarity scoring",
    duration: 1000,
    detail:
      "7-dimension weighted algorithm — sector, leverage, margin, geography...",
  },
  {
    label: "Ranking cohort matches",
    duration: 600,
    detail: "Selecting top 5 precedents by composite similarity score...",
  },
  {
    label: "Generating IC reasoning",
    duration: 1200,
    detail: "Synthesizing risk flags, thesis scores, and hidden risks...",
  },
  {
    label: "Compiling intelligence report",
    duration: 500,
    detail: "Formatting executive summary and citation ledger...",
  },
];

interface Props {
  companyName: string;
  onComplete: () => void;
}

export function IntelligenceProcessor({ companyName, onComplete }: Props) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  // Use ref to avoid stale closure issues with onComplete
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let elapsed = 0;
    const totalDuration = STAGES.reduce((s, st) => s + st.duration, 0);
    let stageIndex = 0;
    let cancelled = false;

    const advance = () => {
      if (cancelled) return;
      if (stageIndex >= STAGES.length) {
        onCompleteRef.current();
        return;
      }
      setCurrentStage(stageIndex);
      const stageDuration = STAGES[stageIndex].duration;
      const stageStartProgress = elapsed / totalDuration;
      const stageEndProgress = (elapsed + stageDuration) / totalDuration;

      const start = Date.now();
      const tick = setInterval(() => {
        if (cancelled) {
          clearInterval(tick);
          return;
        }
        const pct = Math.min((Date.now() - start) / stageDuration, 1);
        setProgress(
          (stageStartProgress + pct * (stageEndProgress - stageStartProgress)) *
            100
        );
        if (pct >= 1) {
          clearInterval(tick);
          elapsed += stageDuration;
          stageIndex++;
          advance();
        }
      }, 30);
    };

    advance();

    return () => {
      cancelled = true;
    };
  }, []); // empty deps — runs once on mount

  const stage = STAGES[Math.min(currentStage, STAGES.length - 1)];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080c12",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      <div style={{ width: "480px", padding: "2rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#14b8a6",
                animation: "ipPulse 1s ease-in-out infinite",
              }}
            />
            <span
              style={{
                color: "#14b8a6",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Intelligence Processing
            </span>
          </div>
          <h1
            style={{
              color: "#f1f5f9",
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {companyName}
          </h1>
          <p
            style={{
              color: "#475569",
              fontSize: "0.8rem",
              marginTop: "0.4rem",
              marginBottom: 0,
            }}
          >
            IC Analysis · Institutional Precedent Engine
          </p>
        </div>

        {/* Stages */}
        <div style={{ marginBottom: "2rem" }}>
          {STAGES.map((s, i) => {
            const done = i < currentStage;
            const active = i === currentStage;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.5rem 0",
                  opacity: done ? 0.5 : active ? 1 : 0.25,
                  transition: "opacity 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    marginTop: "2px",
                    background: done ? "#14b8a6" : "transparent",
                    border: done
                      ? "none"
                      : active
                      ? "2px solid #14b8a6"
                      : "1px solid #334155",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                  }}
                >
                  {done && (
                    <span style={{ color: "#080c12", fontWeight: 700 }}>
                      ✓
                    </span>
                  )}
                  {active && (
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#14b8a6",
                        animation: "ipPulse 0.8s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      color: active
                        ? "#f1f5f9"
                        : done
                        ? "#64748b"
                        : "#475569",
                      fontSize: "0.82rem",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {s.label}
                  </div>
                  {active && (
                    <div
                      style={{
                        color: "#475569",
                        fontSize: "0.72rem",
                        marginTop: "0.15rem",
                      }}
                    >
                      {s.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "4px",
            height: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #0d9488, #14b8a6)",
              width: `${progress}%`,
              transition: "width 0.1s linear",
              borderRadius: "4px",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "0.5rem",
          }}
        >
          <span style={{ color: "#475569", fontSize: "0.7rem" }}>
            {stage?.detail?.slice(0, 40)}...
          </span>
          <span
            style={{
              color: "#14b8a6",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <style>{`
        @keyframes ipPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
