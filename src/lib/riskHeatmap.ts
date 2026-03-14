/**
 * Risk heatmap: 2D grid over (selling price × demand mean) using existing
 * Monte Carlo simulation. Each cell runs the simulation and returns a metric
 * (expected profit or probability of loss). Modular for future extension.
 */

import { runMonteCarlo, type ScenarioInputs } from "./monteCarlo";

export type HeatmapMetric = "expectedProfit" | "probabilityOfLoss";

export interface RiskHeatmapResult {
  /** values[row][col] = metric at yLabels[row] (demand mean) and xLabels[col] (price) */
  values: number[][];
  /** x-axis: selling price (columns) */
  xLabels: number[];
  /** y-axis: demand mean (rows) */
  yLabels: number[];
  metric: HeatmapMetric;
}

/** Default grid size for performance (total cells = rows × cols). */
export const HEATMAP_DEFAULT_ROWS = 8;
export const HEATMAP_DEFAULT_COLS = 8;
/** Max grid size. */
export const HEATMAP_MAX_CELLS = 144; // e.g. 12×12
/** Simulations per cell to keep total runtime reasonable. */
export const HEATMAP_SIMS_PER_CELL = 1000;

/**
 * Build a linear grid of n values between min and max (inclusive).
 */
function linspace(min: number, max: number, n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [min];
  const step = (max - min) / (n - 1);
  return Array.from({ length: n }, (_, i) =>
    Math.round((min + i * step) * 100) / 100
  );
}

/**
 * Compute the risk heatmap grid. Requires scenario with Normal demand
 * (demandMean and demandStdDev used). For each (price, demandMean) cell
 * runs Monte Carlo and extracts the chosen metric.
 */
export function computeRiskHeatmap(
  baseInputs: ScenarioInputs,
  options: {
    priceMin: number;
    priceMax: number;
    demandMeanMin: number;
    demandMeanMax: number;
    rows?: number;
    cols?: number;
    metric?: HeatmapMetric;
    numSimulationsPerCell?: number;
  }
): RiskHeatmapResult {
  const {
    priceMin,
    priceMax,
    demandMeanMin,
    demandMeanMax,
    rows = HEATMAP_DEFAULT_ROWS,
    cols = HEATMAP_DEFAULT_COLS,
    metric = "expectedProfit",
    numSimulationsPerCell = HEATMAP_SIMS_PER_CELL,
  } = options;

  const totalCells = rows * cols;
  if (totalCells > HEATMAP_MAX_CELLS) {
    throw new Error(
      `Grid too large (max ${HEATMAP_MAX_CELLS} cells). Use smaller rows/cols.`
    );
  }
  if (baseInputs.demandDistributionType !== "normal") {
    throw new Error("Heatmap requires Normal demand distribution.");
  }
  const stdDev = baseInputs.demandStdDev ?? 0;

  const xLabels = linspace(priceMin, priceMax, cols);
  const yLabels = linspace(demandMeanMin, demandMeanMax, rows);

  const values: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const demandMean = yLabels[i]!;
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      const sellingPrice = xLabels[j]!;
      const inputs: ScenarioInputs = {
        ...baseInputs,
        sellingPrice,
        demandMean,
        demandStdDev: stdDev,
        numSimulations: numSimulationsPerCell,
      };
      const result = runMonteCarlo(inputs);
      const value =
        metric === "expectedProfit" ? result.mean : result.probabilityOfLoss;
      row.push(value);
    }
    values.push(row);
  }

  return { values, xLabels, yLabels, metric };
}
