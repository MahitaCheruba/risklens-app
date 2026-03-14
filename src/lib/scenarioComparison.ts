/**
 * Shared types and helpers for scenario comparison (N scenarios).
 * Used by the Compare scenarios page; does not change simulation logic.
 */

import { breakEvenDemand } from "./analytics";
import type { ScenarioInputs } from "./monteCarlo";

/** Scenario record as returned by InstantDB for comparison. */
export type ScenarioComparisonRecord = {
  id: string;
  name: string;
  fixedCost: number;
  sellingPrice: number;
  demandDistributionType: string;
  demandMean?: number | null;
  demandStdDev?: number | null;
  demandMin?: number | null;
  demandMax?: number | null;
  demandMode?: number | null;
  variableCostDistributionType: string;
  variableCostMin?: number | null;
  variableCostMode?: number | null;
  variableCostMax?: number | null;
  numSimulations: number;
  expectedProfit?: number;
  probabilityOfLoss?: number;
  percentile5?: number;
  percentile95?: number;
};

export function scenarioToInputs(
  s: ScenarioComparisonRecord
): ScenarioInputs {
  return {
    numSimulations: s.numSimulations,
    fixedCost: s.fixedCost,
    sellingPrice: s.sellingPrice,
    demandDistributionType: s.demandDistributionType as ScenarioInputs["demandDistributionType"],
    demandMean: s.demandMean ?? null,
    demandStdDev: s.demandStdDev ?? null,
    demandMin: s.demandMin ?? null,
    demandMax: s.demandMax ?? null,
    demandMode: s.demandMode ?? null,
    variableCostDistributionType:
      s.variableCostDistributionType as ScenarioInputs["variableCostDistributionType"],
    variableCostMin: s.variableCostMin ?? null,
    variableCostMode: s.variableCostMode ?? null,
    variableCostMax: s.variableCostMax ?? null,
  };
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format a value for display based on metric label. */
export function formatComparisonValue(
  value: number | string,
  label: string
): string {
  if (typeof value === "string") return value;
  if (label.includes("%") || label.includes("Probability"))
    return `${value.toFixed(1)}%`;
  if (label.includes("demand") || label.includes("percentile"))
    return value.toLocaleString();
  return formatCurrency(value);
}

export interface ComparisonRow {
  label: string;
  values: (number | string)[];
}

/**
 * Build comparison rows for N scenarios: one row per metric, one value per scenario.
 * Order of scenarios must match the order of breakEvens and selectedScenarios.
 */
export function buildComparisonRows(
  selectedScenarios: ScenarioComparisonRecord[],
  breakEvens: (number | null)[]
): ComparisonRow[] {
  const rows: ComparisonRow[] = [];
  if (selectedScenarios.length === 0) return rows;

  const hasExpected = selectedScenarios.some(
    (s) => s.expectedProfit != null
  );
  if (hasExpected) {
    rows.push({
      label: "Expected profit",
      values: selectedScenarios.map((s) =>
        s.expectedProfit != null ? s.expectedProfit : "—"
      ),
    });
  }

  const hasProbLoss = selectedScenarios.some(
    (s) => s.probabilityOfLoss != null
  );
  if (hasProbLoss) {
    rows.push({
      label: "Probability of loss (%)",
      values: selectedScenarios.map((s) =>
        s.probabilityOfLoss != null ? s.probabilityOfLoss : "—"
      ),
    });
  }

  const hasBreakEven = breakEvens.some((b) => b != null);
  if (hasBreakEven) {
    rows.push({
      label: "Break-even demand",
      values: breakEvens.map((b) => (b != null ? b : "Not achievable")),
    });
  }

  const hasPercentiles = selectedScenarios.some(
    (s) => s.percentile5 != null && s.percentile95 != null
  );
  if (hasPercentiles) {
    rows.push({
      label: "5th percentile",
      values: selectedScenarios.map((s) =>
        s.percentile5 != null ? s.percentile5 : "—"
      ),
    });
    rows.push({
      label: "95th percentile",
      values: selectedScenarios.map((s) =>
        s.percentile95 != null ? s.percentile95 : "—"
      ),
    });
  }

  return rows;
}

/** Compute break-even for each scenario. */
export function getBreakEvens(
  scenarios: ScenarioComparisonRecord[]
): (number | null)[] {
  return scenarios.map((s) => breakEvenDemand(scenarioToInputs(s)));
}
