/**
 * Single-variable optimization for RiskLens (v1: selling price).
 * Uses grid search over a price range; for each candidate runs the existing
 * Monte Carlo simulation. Modular so it can be extended to variable cost,
 * demand mean, or multi-variable optimization later.
 */

import { runMonteCarlo, type ScenarioInputs, type SimulationResult } from "./monteCarlo";

/** Result for one candidate price from the grid search. */
export interface PriceCandidateResult {
  price: number;
  expectedProfit: number;
  probabilityOfLoss: number;
  probabilityOfProfit: number;
  percentile5: number;
  percentile95: number;
}

/** Result of a price optimization run: best candidate, top N, and all for charting. */
export interface PriceOptimizationResult {
  best: PriceCandidateResult;
  topFive: PriceCandidateResult[];
  /** All candidates (sorted by expected profit desc) for profit-vs-price chart. */
  allCandidates: PriceCandidateResult[];
}

/** Maximum number of price candidates in one run to keep the page responsive. */
export const MAX_OPTIMIZATION_CANDIDATES = 100;
const MAX_CANDIDATES = MAX_OPTIMIZATION_CANDIDATES;

/**
 * Build ordered list of candidate prices in [minPrice, maxPrice] with given step.
 * Clamps count to MAX_CANDIDATES to avoid runaway runs.
 */
function buildPriceGrid(
  minPrice: number,
  maxPrice: number,
  step: number
): number[] {
  if (minPrice > maxPrice || step <= 0) return [];
  const raw: number[] = [];
  for (let p = minPrice; p <= maxPrice; p += step) {
    raw.push(Math.round(p * 100) / 100);
  }
  if (raw.length > MAX_CANDIDATES) {
    const stride = raw.length / MAX_CANDIDATES;
    return Array.from({ length: MAX_CANDIDATES }, (_, i) =>
      raw[Math.min(Math.floor(i * stride), raw.length - 1)]!
    );
  }
  return raw;
}

/**
 * Run grid search over selling price. For each candidate price, runs the
 * existing Monte Carlo simulation and computes expected profit, probability
 * of loss, probability of profit, and percentile range. Results are ranked
 * by expected profit (descending). Optionally you can filter by probability
 * of loss later; this function returns raw sorted results.
 */
export function runPriceGridSearch(
  baseInputs: ScenarioInputs,
  minPrice: number,
  maxPrice: number,
  step: number
): PriceOptimizationResult {
  const prices = buildPriceGrid(minPrice, maxPrice, step);
  if (prices.length === 0) {
    throw new Error("Invalid range: minPrice <= maxPrice and step > 0 required.");
  }

  const candidates: PriceCandidateResult[] = prices.map((price) => {
    const inputs: ScenarioInputs = { ...baseInputs, sellingPrice: price };
    const sim: SimulationResult = runMonteCarlo(inputs);
    const probabilityOfProfit = Math.max(
      0,
      Math.min(100, 100 - sim.probabilityOfLoss)
    );
    return {
      price,
      expectedProfit: sim.mean,
      probabilityOfLoss: sim.probabilityOfLoss,
      probabilityOfProfit,
      percentile5: sim.percentile5,
      percentile95: sim.percentile95,
    };
  });

  candidates.sort((a, b) => b.expectedProfit - a.expectedProfit);
  const best = candidates[0]!;
  const topFive = candidates.slice(0, 5);

  return { best, topFive, allCandidates: candidates };
}
