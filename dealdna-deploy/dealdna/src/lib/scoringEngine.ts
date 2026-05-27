/**
 * DealDNA — Phase 4
 * src/lib/scoringEngine.ts
 * 7-dimension weighted precedent scoring engine.
 */

export interface DealProfile {
  companyName: string;
  sector: string;
  geography: string;
  entryEV: number;
  leverage: number;
  evEbitda: number;
  revenue: number;
  ebitdaMargin: number;
  revenueModel: "recurring" | "transactional" | "hybrid";
  customerSegment: "enterprise" | "smb" | "consumer" | "government";
  macroRegime: "rate-stable" | "rate-rising" | "rate-falling" | "recession";
  targetMoic?: number;
  targetIrr?: number;
  holdPeriod?: number;
  thesis?: string;
  keyRisks?: string[];
}

export interface DimensionScores {
  sector: number;
  leverage: number;
  margin: number;
  geography: number;
  customerModel: number;
  revenueModel: number;
  macroRegime: number;
}

export interface ScoredPrecedent {
  id: string;
  company: string;
  sponsor: string;
  year: number;
  sector: string;
  geography: string;
  outcome: "Strong Exit" | "Partial Exit" | "Hold" | "Loss";
  entryEV: number;
  leverage: number;
  evEbitda: number;
  revenue: number;
  ebitdaMargin: number;
  moic: number | undefined;
  irr: number | undefined;
  holdPeriod: number;
  riskClusters: string[];
  keyLessons: string[];
  hiddenRisks: string[];
  macroRegime: string;
  revenueModel: string;
  customerSegment: string;
  similarityScore: number;
  confidenceScore: number;
  dimensionScores: DimensionScores;
}

const WEIGHTS: DimensionScores = {
  sector: 0.3,
  leverage: 0.2,
  margin: 0.15,
  geography: 0.12,
  customerModel: 0.1,
  revenueModel: 0.08,
  macroRegime: 0.05,
};

const SECTOR_GROUPS: Record<string, string[]> = {
  Industrials: ["Industrials", "Energy", "Infrastructure"],
  Technology: ["Technology", "Software", "SaaS"],
  Healthcare: ["Healthcare", "Life Sciences", "Pharma"],
  "Business Services": [
    "Business Services",
    "Financial Services",
    "Professional Services",
  ],
  Consumer: ["Consumer", "Retail", "Media"],
  Energy: ["Energy", "Infrastructure", "Industrials"],
  "Financial Services": ["Financial Services", "Business Services"],
};

function scoreSector(deal: string, prec: string): number {
  if (deal.toLowerCase() === prec.toLowerCase()) return 1.0;
  const group = SECTOR_GROUPS[deal] ?? [deal];
  return group.some((s) => s.toLowerCase() === prec.toLowerCase()) ? 0.6 : 0.1;
}

function scoreGeography(deal: string, prec: string): number {
  if (deal === prec) return 1.0;
  const dev = ["North America", "Western Europe"];
  return dev.includes(deal) && dev.includes(prec) ? 0.5 : 0.1;
}

function expDecay(a: number, b: number, tol: number): number {
  return Math.exp(-Math.abs(a - b) / Math.max(Math.abs(a), 0.01) / tol);
}

const CUST_ADJ: Record<string, string[]> = {
  enterprise: ["enterprise", "government"],
  smb: ["smb", "consumer"],
  consumer: ["consumer", "smb"],
  government: ["government", "enterprise"],
};

export function scorePrecedent(
  deal: DealProfile,
  p: ScoredPrecedent
): ScoredPrecedent {
  const dims: DimensionScores = {
    sector: scoreSector(deal.sector, p.sector),
    leverage: expDecay(deal.leverage, p.leverage, 0.3),
    margin: expDecay(deal.ebitdaMargin, p.ebitdaMargin, 0.4),
    geography: scoreGeography(deal.geography, p.geography),
    customerModel:
      deal.customerSegment === p.customerSegment
        ? 1
        : (CUST_ADJ[deal.customerSegment] ?? []).includes(p.customerSegment)
        ? 0.5
        : 0.1,
    revenueModel: deal.revenueModel === p.revenueModel ? 1.0 : 0.2,
    macroRegime: deal.macroRegime === p.macroRegime ? 1.0 : 0.2,
  };

  const raw =
    dims.sector * WEIGHTS.sector +
    dims.leverage * WEIGHTS.leverage +
    dims.margin * WEIGHTS.margin +
    dims.geography * WEIGHTS.geography +
    dims.customerModel * WEIGHTS.customerModel +
    dims.revenueModel * WEIGHTS.revenueModel +
    dims.macroRegime * WEIGHTS.macroRegime;

  const filled = [
    p.entryEV,
    p.leverage,
    p.evEbitda,
    p.revenue,
    p.ebitdaMargin,
    p.holdPeriod,
  ].filter(Boolean).length;

  return {
    ...p,
    similarityScore: Math.round(raw * 100),
    confidenceScore: Math.round(dims.sector * (filled / 6) * 100),
    dimensionScores: dims,
  };
}

export function rankPrecedents(
  deal: DealProfile,
  precedents: ScoredPrecedent[],
  topN = 5
): ScoredPrecedent[] {
  return precedents
    .map((p) => scorePrecedent(deal, p))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topN);
}
