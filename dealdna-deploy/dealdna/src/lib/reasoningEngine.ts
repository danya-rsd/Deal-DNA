/**
 * DealDNA — Phase 4
 * src/lib/reasoningEngine.ts
 * Live Anthropic API + simulation fallback.
 */
import type { DealProfile, ScoredPrecedent } from "./scoringEngine";

export interface ThesisScore {
  dimension: string;
  score: number;
  rationale: string;
}

export interface RiskFlag {
  cluster: string;
  severity: "High" | "Medium" | "Low";
  description: string;
  precedentRef?: string;
}

export interface Citation {
  id: string;
  precedentId: string;
  precedentName: string;
  text: string;
  dimension: string;
}

export interface ReasoningOutput {
  executiveSummary: string;
  thesisScores: ThesisScore[];
  riskFlags: RiskFlag[];
  keyLessons: string[];
  hiddenRisks: string[];
  icRecommendation: "Proceed" | "Conditional Proceed" | "Pass";
  recommendationRationale: string;
  confidenceLevel: number;
  citations: Citation[];
}

function simulate(
  deal: DealProfile,
  precs: ScoredPrecedent[]
): ReasoningOutput {
  const top = precs[0];
  const exits = precs.filter((p) => p.moic !== undefined);
  const avgMoic =
    exits.length
      ? exits.reduce((s, p) => s + (p.moic ?? 0), 0) / exits.length
      : 2.5;
  const avgSim = Math.round(
    precs.reduce((s, p) => s + p.similarityScore, 0) / precs.length
  );
  const highLev = deal.leverage >= 6.5;
  const rising = deal.macroRegime === "rate-rising";
  const rec: ReasoningOutput["icRecommendation"] =
    highLev && rising
      ? "Conditional Proceed"
      : avgSim > 70
      ? "Proceed"
      : "Conditional Proceed";
  const recTone = rec === "Proceed" ? "constructive" : "cautious";

  return {
    executiveSummary: `${deal.companyName} presents a ${deal.sector} buyout at ${deal.evEbitda}x EV/EBITDA with ${deal.leverage}x leverage in a ${deal.macroRegime} macro environment. Analysis of ${precs.length} institutional precedents (avg ${avgSim}% similarity) supports a ${recTone} view at current entry parameters. Comparable exits averaged ${avgMoic.toFixed(1)}x MOIC. IC recommendation: ${rec}.`,
    thesisScores: [
      {
        dimension: "Market Position",
        score: ["Technology", "Healthcare"].includes(deal.sector) ? 78 : 64,
        rationale: `${deal.sector} / ${deal.customerSegment} positioning vs. precedent cohort.`,
      },
      {
        dimension: "Financial Profile",
        score: deal.ebitdaMargin > 28 ? 82 : 65,
        rationale: `${deal.ebitdaMargin}% margin at ${deal.evEbitda}x entry EV/EBITDA.`,
      },
      {
        dimension: "Leverage Risk",
        score: highLev ? 45 : 72,
        rationale: `${deal.leverage}x ${
          highLev
            ? "approaches upper bound — covenant headroom concern"
            : "within institutional comfort range"
        }.`,
      },
      {
        dimension: "Macro Alignment",
        score: rising ? 48 : 76,
        rationale: rising
          ? "Rate-rising regime — 150bps avg IRR drag per precedent cohort."
          : "Macro broadly supportive of return profile.",
      },
      {
        dimension: "Exit Optionality",
        score: deal.revenueModel === "recurring" ? 74 : 58,
        rationale:
          deal.revenueModel === "recurring"
            ? "Recurring revenue broadens buyer universe."
            : "Transactional model limits exit multiple range.",
      },
    ],
    riskFlags: [
      {
        cluster: "Leverage",
        severity: highLev ? "High" : "Medium",
        description: `${deal.leverage}x entry leverage. Precedent ${top?.company ?? "—"} (${
          top?.leverage ?? "—"
        }x) — ${top?.outcome ?? "—"}.`,
        precedentRef: top?.id,
      },
      {
        cluster: "Multiple Compression",
        severity: deal.evEbitda > 18 ? "High" : "Medium",
        description: `Entry at ${deal.evEbitda}x. Precedent median: ${
          Math.round(
            (precs.reduce((s, p) => s + p.evEbitda, 0) / precs.length) * 10
          ) / 10
        }x.`,
        precedentRef: precs[1]?.id,
      },
      {
        cluster: "Macro Regime",
        severity: rising ? "High" : "Low",
        description: rising
          ? "Rate-rising — 150–200bps IRR compression in levered buyouts per cohort."
          : "Stable rates supportive of return profile.",
        precedentRef: precs[2]?.id,
      },
      {
        cluster: "Customer Concentration",
        severity: "Medium",
        description:
          "Top-3 concentration risk. Precedent experience: >50% concentration correlated with partial exit outcomes.",
        precedentRef: precs[3]?.id,
      },
    ],
    keyLessons: precs.flatMap((p) => p.keyLessons).slice(0, 5),
    hiddenRisks: precs.flatMap((p) => p.hiddenRisks).slice(0, 4),
    icRecommendation: rec,
    recommendationRationale: `Based on ${precs.length}-precedent analysis. ${deal.ebitdaMargin}% margin at ${deal.leverage}x in ${deal.macroRegime} regime. ${
      highLev
        ? "Covenant stress test required before IC approval."
        : "Parameters within historical precedent range."
    }`,
    confidenceLevel: Math.min(95, avgSim + 10),
    citations: precs.slice(0, 3).map((p, i) => ({
      id: `c${i + 1}`,
      precedentId: p.id,
      precedentName: p.company,
      text: p.keyLessons[0] ?? "Referenced precedent",
      dimension: (["Leverage", "Multiple", "Macro"] as const)[i] ?? "General",
    })),
  };
}

async function fetchLive(
  deal: DealProfile,
  precs: ScoredPrecedent[]
): Promise<ReasoningOutput> {
  const summary = precs
    .map(
      (p) =>
        `- ${p.company} (${p.sponsor} ${p.year}): ${p.sector}, ${p.leverage}x lev, ${
          p.evEbitda
        }x, ${p.outcome}${p.moic ? `, ${p.moic}x MOIC` : ""}. Lesson: ${
          p.keyLessons[0]
        }`
    )
    .join("\n");

  const prompt = `You are an institutional PE IC analyst. Analyze this deal vs precedents. Return ONLY valid JSON (no markdown).

DEAL: ${JSON.stringify(deal)}

PRECEDENTS:
${summary}

Return JSON with: executiveSummary, thesisScores (array of {dimension,score,rationale}), riskFlags (array of {cluster,severity,description,precedentRef}), keyLessons (string[]), hiddenRisks (string[]), icRecommendation ("Proceed"|"Conditional Proceed"|"Pass"), recommendationRationale, confidenceLevel (number), citations (array of {id,precedentId,precedentName,text,dimension})`;

  const res = await fetch("/api/reasoning", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`API ${res.status}`);

  const data = await res.json();
  const rawText: string = data.content?.[0]?.text ?? "{}";
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as ReasoningOutput;
}

export async function generateReasoning(
  deal: DealProfile,
  precs: ScoredPrecedent[],
  useLive = false
): Promise<ReasoningOutput> {
  if (useLive) {
    try {
      return await fetchLive(deal, precs);
    } catch (e) {
      console.warn("[DealDNA] Live API fallback:", e);
    }
  }
  return simulate(deal, precs);
}
