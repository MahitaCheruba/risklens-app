/**
 * Analytics utilities for RiskLens: break-even demand, sensitivity analysis, and recommendation text.
 */

import { runMonteCarlo, type ScenarioInputs } from "./monteCarlo";

/** Representative variable cost per unit for break-even (single number). */
function getRepresentativeVariableCost(inputs: ScenarioInputs): number | null {
  const { variableCostDistributionType } = inputs;
  if (variableCostDistributionType === "fixed") {
    const v =
      inputs.variableCostMode ??
      inputs.variableCostMin ??
      inputs.variableCostMax ??
      null;
    return v != null ? v : null;
  }
  if (variableCostDistributionType === "uniform") {
    const min = inputs.variableCostMin ?? 0;
    const max = inputs.variableCostMax ?? 1;
    return (min + max) / 2;
  }
  if (variableCostDistributionType === "triangular") {
    const min = inputs.variableCostMin ?? 0;
    const max = inputs.variableCostMax ?? 1;
    const mode = inputs.variableCostMode ?? (min + max) / 2;
    return mode;
  }
  return null;
}

/**
 * Break-even demand (minimum units to avoid loss).
 * Uses fixed selling price and representative variable cost.
 * Returns null if not achievable (e.g. price <= variable cost).
 */
export function breakEvenDemand(inputs: ScenarioInputs): number | null {
  const { fixedCost, sellingPrice } = inputs;
  const vc = getRepresentativeVariableCost(inputs);
  if (vc == null) return null;
  const contribution = sellingPrice - vc;
  if (contribution <= 0) return null;
  const q = fixedCost / contribution;
  return Math.max(0, Math.ceil(q));
}

/** Probability of profit = 100 - probability of loss. */
export function probabilityOfProfit(probabilityOfLoss: number): number {
  return Math.max(0, Math.min(100, 100 - probabilityOfLoss));
}

export interface SensitivityBar {
  name: string;
  lowCase: number;  // expected profit at -10%
  highCase: number; // expected profit at +10%
  baseline: number;
  /** Absolute impact: max(|highCase - baseline|, |lowCase - baseline|). */
  impact: number;
}

const SENSITIVITY_N_SIMULATIONS = 2000;

/**
 * Run sensitivity analysis: vary each input ±10% and measure impact on expected profit.
 * Returns bars ranked by absolute impact (largest first).
 */
export function runSensitivityAnalysis(
  inputs: ScenarioInputs
): SensitivityBar[] {
  const baseline = runMonteCarlo(inputs).mean;
  const bars: SensitivityBar[] = [];

  const runOne = (modified: ScenarioInputs): number =>
    runMonteCarlo({ ...modified, numSimulations: SENSITIVITY_N_SIMULATIONS })
      .mean;

  // Fixed cost: ±10%
  const fcBase = inputs.fixedCost;
  bars.push({
    name: "Fixed cost",
    lowCase: runOne({ ...inputs, fixedCost: fcBase * 1.1 }),
    highCase: runOne({ ...inputs, fixedCost: fcBase * 0.9 }),
    baseline,
    impact: 0,
  });

  // Selling price: ±10%
  const priceBase = inputs.sellingPrice;
  bars.push({
    name: "Selling price",
    lowCase: runOne({ ...inputs, sellingPrice: priceBase * 0.9 }),
    highCase: runOne({ ...inputs, sellingPrice: priceBase * 1.1 }),
    baseline,
    impact: 0,
  });

  // Demand mean: ±10% (only if normal)
  if (inputs.demandDistributionType === "normal" && inputs.demandMean != null) {
    const meanBase = inputs.demandMean;
    bars.push({
      name: "Demand mean",
      lowCase: runOne({ ...inputs, demandMean: meanBase * 0.9 }),
      highCase: runOne({ ...inputs, demandMean: meanBase * 1.1 }),
      baseline,
      impact: 0,
    });
  }

  // Demand std dev: ±10% (only if normal)
  if (
    inputs.demandDistributionType === "normal" &&
    inputs.demandStdDev != null &&
    inputs.demandStdDev > 0
  ) {
    const stdBase = inputs.demandStdDev;
    bars.push({
      name: "Demand std dev",
      lowCase: runOne({ ...inputs, demandStdDev: stdBase * 1.1 }),
      highCase: runOne({ ...inputs, demandStdDev: stdBase * 0.9 }),
      baseline,
      impact: 0,
    });
  }

  // Variable cost: ±10% (representative value)
  const vcRep = getRepresentativeVariableCost(inputs);
  if (vcRep != null) {
    if (inputs.variableCostDistributionType === "fixed") {
      bars.push({
        name: "Variable cost",
        lowCase: runOne({
          ...inputs,
          variableCostMode: vcRep * 1.1,
          variableCostMin: vcRep * 1.1,
          variableCostMax: vcRep * 1.1,
        }),
        highCase: runOne({
          ...inputs,
          variableCostMode: vcRep * 0.9,
          variableCostMin: vcRep * 0.9,
          variableCostMax: vcRep * 0.9,
        }),
        baseline,
        impact: 0,
      });
    } else if (inputs.variableCostDistributionType === "uniform") {
      const min = inputs.variableCostMin ?? 0;
      const max = inputs.variableCostMax ?? 1;
      bars.push({
        name: "Variable cost",
        lowCase: runOne({
          ...inputs,
          variableCostMin: min * 1.1,
          variableCostMax: max * 1.1,
        }),
        highCase: runOne({
          ...inputs,
          variableCostMin: min * 0.9,
          variableCostMax: max * 0.9,
        }),
        baseline,
        impact: 0,
      });
    } else {
      const min = inputs.variableCostMin ?? 0;
      const max = inputs.variableCostMax ?? 1;
      const mode = inputs.variableCostMode ?? (min + max) / 2;
      bars.push({
        name: "Variable cost",
        lowCase: runOne({
          ...inputs,
          variableCostMin: min * 1.1,
          variableCostMode: mode * 1.1,
          variableCostMax: max * 1.1,
        }),
        highCase: runOne({
          ...inputs,
          variableCostMin: min * 0.9,
          variableCostMode: mode * 0.9,
          variableCostMax: max * 0.9,
        }),
        baseline,
        impact: 0,
      });
    }
  }

  bars.forEach((b) => {
    b.impact = Math.max(
      Math.abs(b.highCase - baseline),
      Math.abs(b.lowCase - baseline)
    );
  });
  bars.sort((a, b) => b.impact - a.impact);
  return bars;
}

export interface RecommendationInputs {
  expectedProfit: number;
  probabilityOfLoss: number;
  percentile5: number;
  percentile95: number;
  breakEvenDemand: number | null;
  sensitivityBars: SensitivityBar[];
}

/**
 * Build analyst-style recommendation text from metrics and sensitivity.
 */
export function buildRecommendationText(inp: RecommendationInputs): string[] {
  const lines: string[] = [];
  const pct = Math.round(inp.probabilityOfLoss);
  const probProfit = 100 - pct;

  if (inp.expectedProfit >= 0 && pct < 20) {
    lines.push(
      "The project is profitable on average and carries relatively low downside risk."
    );
  } else if (inp.expectedProfit >= 0 && pct < 50) {
    lines.push(
      "The project is profitable on average but carries moderate downside risk."
    );
  } else if (inp.expectedProfit >= 0) {
    lines.push(
      "The project shows positive expected profit but a high probability of loss; management should proceed cautiously."
    );
  } else {
    lines.push(
      "Expected profit is negative; the scenario is not attractive under current assumptions."
    );
  }

  if (pct > 0 && pct < 100) {
    lines.push(
      `There is a ${pct}% probability of loss and a ${probProfit}% probability of profit.`
    );
  }

  if (inp.breakEvenDemand != null) {
    lines.push(
      `Minimum volume to avoid loss (break-even demand) is approximately ${inp.breakEvenDemand.toLocaleString()} units. Management should target volume above this level to reduce downside risk.`
    );
  }

  lines.push(
    `The 5th–95th percentile range (${formatC(inp.percentile5)} to ${formatC(inp.percentile95)}) indicates the spread of plausible outcomes.`
  );

  if (inp.sensitivityBars.length > 0) {
    const top = inp.sensitivityBars.slice(0, 2).map((b) => b.name.toLowerCase());
    const driverText =
      top.length === 2
        ? `${top[0]} and ${top[1]}`
        : top[0];
    lines.push(
      `Sensitivity analysis shows that ${driverText} have the largest impact on expected profit. Focusing on reducing uncertainty or improving these levers can improve the risk profile.`
    );
  }

  return lines;
}

function formatC(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
