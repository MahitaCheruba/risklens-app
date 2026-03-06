/**
 * Monte Carlo simulation utilities for RiskLens.
 * Generates profit samples from demand and variable cost distributions.
 */

export type DemandDistributionType = "normal" | "triangular" | "uniform";
export type VariableCostDistributionType = "triangular" | "uniform" | "fixed";

export interface ScenarioInputs {
  numSimulations: number;
  fixedCost: number;
  sellingPrice: number;
  demandDistributionType: DemandDistributionType;
  demandMean: number | null;
  demandStdDev: number | null;
  demandMin: number | null;
  demandMax: number | null;
  demandMode?: number | null;
  variableCostDistributionType: VariableCostDistributionType;
  variableCostMin: number | null;
  variableCostMode: number | null;
  variableCostMax: number | null;
}

export interface SimulationResult {
  profits: number[];
  mean: number;
  stdDev: number;
  percentile5: number;
  percentile95: number;
  probabilityOfLoss: number;
}

/** Box-Muller: two standard normal samples from uniform [0,1). */
function boxMuller(u1: number, u2: number): { z1: number; z2: number } {
  const r = Math.sqrt(-2 * Math.log(u1));
  const theta = 2 * Math.PI * u2;
  return { z1: r * Math.cos(theta), z2: r * Math.sin(theta) };
}

function randomUniform(): number {
  return Math.random();
}

/** Sample from Normal(mean, stdDev). */
function sampleNormal(mean: number, stdDev: number): number {
  const u1 = randomUniform();
  const u2 = randomUniform();
  const { z1 } = boxMuller(u1, u2);
  return mean + stdDev * z1;
}

/** Sample from Triangular(min, mode, max) via inverse CDF. */
function sampleTriangular(min: number, mode: number, max: number): number {
  const u = randomUniform();
  const c = (mode - min) / (max - min);
  if (u <= c) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

/** Sample from Uniform(min, max). */
function sampleUniform(min: number, max: number): number {
  return min + randomUniform() * (max - min);
}

function sampleDemand(inputs: ScenarioInputs): number {
  const { demandDistributionType } = inputs;
  if (demandDistributionType === "normal") {
    const mean = inputs.demandMean ?? 0;
    const stdDev = Math.max(0, inputs.demandStdDev ?? 0);
    return Math.max(0, sampleNormal(mean, stdDev));
  }
  if (demandDistributionType === "triangular") {
    const min = inputs.demandMin ?? 0;
    const max = inputs.demandMax ?? 1;
    const mode = inputs.demandMode ?? (min + max) / 2;
    return Math.max(0, sampleTriangular(min, mode, max));
  }
  if (demandDistributionType === "uniform") {
    const min = inputs.demandMin ?? 0;
    const max = inputs.demandMax ?? 1;
    return Math.max(0, sampleUniform(min, max));
  }
  return 0;
}

function sampleVariableCost(inputs: ScenarioInputs): number {
  const { variableCostDistributionType } = inputs;
  if (variableCostDistributionType === "fixed") {
    return inputs.variableCostMode ?? inputs.variableCostMin ?? inputs.variableCostMax ?? 0;
  }
  if (variableCostDistributionType === "triangular") {
    const min = inputs.variableCostMin ?? 0;
    const max = inputs.variableCostMax ?? 1;
    const mode = inputs.variableCostMode ?? (min + max) / 2;
    return Math.max(0, sampleTriangular(min, mode, max));
  }
  if (variableCostDistributionType === "uniform") {
    const min = inputs.variableCostMin ?? 0;
    const max = inputs.variableCostMax ?? 1;
    return Math.max(0, sampleUniform(min, max));
  }
  return 0;
}

function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedArr[lower]! * (1 - weight) + sortedArr[upper]! * weight;
}

export function runMonteCarlo(inputs: ScenarioInputs): SimulationResult {
  const { numSimulations, fixedCost, sellingPrice } = inputs;
  const profits: number[] = [];

  for (let i = 0; i < numSimulations; i++) {
    const demand = sampleDemand(inputs);
    const variableCostPerUnit = sampleVariableCost(inputs);
    const revenue = demand * sellingPrice;
    const variableCost = demand * variableCostPerUnit;
    const profit = revenue - variableCost - fixedCost;
    profits.push(profit);
  }

  profits.sort((a, b) => a - b);
  const mean = profits.reduce((s, p) => s + p, 0) / profits.length;
  const variance =
    profits.reduce((s, p) => s + (p - mean) ** 2, 0) / profits.length;
  const stdDev = Math.sqrt(variance);
  const percentile5 = percentile(profits, 5);
  const percentile95 = percentile(profits, 95);
  const probabilityOfLoss =
    (profits.filter((p) => p < 0).length / profits.length) * 100;

  return {
    profits,
    mean,
    stdDev,
    percentile5,
    percentile95,
    probabilityOfLoss,
  };
}
