/**
 * Rule-based business story generator. Builds plain-language narratives
 * from existing simulation outputs (no external APIs, no simulation logic).
 */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export interface StoryInputs {
  expectedProfit: number;
  probabilityOfLoss: number;
  percentile5: number;
  percentile95: number;
  breakEvenDemand: number | null;
  topSensitivityDrivers: string[];
  recommendationLines: string[];
  /** Optional: best price from optimization run */
  optimizedPrice?: number | null;
  optimizedExpectedProfit?: number | null;
  optimizedProbabilityOfLoss?: number | null;
}

/**
 * Base Case Story: narrative on baseline outlook and range of outcomes.
 */
export function buildBaseCaseStory(inp: StoryInputs): string {
  const p = Math.round(inp.probabilityOfLoss);
  const probProfit = 100 - p;
  const parts: string[] = [];

  parts.push(
    `Under current assumptions, this scenario yields an expected profit of ${formatCurrency(inp.expectedProfit)}.`
  );
  if (p > 0 && p < 100) {
    parts.push(
      `There is a ${p}% probability of loss and a ${probProfit}% probability of profit.`
    );
  }
  parts.push(
    `Plausible outcomes range from ${formatCurrency(inp.percentile5)} to ${formatCurrency(inp.percentile95)} (5th–95th percentile).`
  );
  if (inp.breakEvenDemand != null) {
    parts.push(
      `Break-even demand is approximately ${inp.breakEvenDemand.toLocaleString()} units; volume above this level reduces downside risk.`
    );
  }
  return parts.join(" ");
}

/**
 * Risk Story: focus on downside and key risk drivers.
 */
export function buildRiskStory(inp: StoryInputs): string {
  const p = Math.round(inp.probabilityOfLoss);
  const parts: string[] = [];

  if (inp.expectedProfit < 0) {
    parts.push(
      `Expected profit is negative (${formatCurrency(inp.expectedProfit)}), indicating the scenario is unattractive under current assumptions.`
    );
  } else {
    parts.push(
      `While expected profit is ${formatCurrency(inp.expectedProfit)}, there is a ${p}% probability of loss.`
    );
  }
  if (inp.breakEvenDemand != null) {
    parts.push(
      `Volume must exceed ${inp.breakEvenDemand.toLocaleString()} units to avoid loss on average.`
    );
  }
  if (inp.topSensitivityDrivers.length > 0) {
    const drivers =
      inp.topSensitivityDrivers.length >= 2
        ? `${inp.topSensitivityDrivers[0]} and ${inp.topSensitivityDrivers[1]}`
        : inp.topSensitivityDrivers[0];
    parts.push(
      `The main drivers of risk are ${drivers}; improving or reducing uncertainty in these areas can strengthen the profile.`
    );
  }
  parts.push(
    "Management should monitor these levers and consider stress-testing key assumptions."
  );
  return parts.join(" ");
}

/**
 * Recommendation Story: synthesizes analyst view and optional optimization.
 */
export function buildRecommendationStory(inp: StoryInputs): string {
  const parts: string[] = [];

  if (inp.recommendationLines.length > 0) {
    parts.push(inp.recommendationLines[0]);
    if (inp.recommendationLines.length > 1) {
      parts.push(inp.recommendationLines[1]);
    }
  }

  const hasOptimization =
    inp.optimizedPrice != null &&
    inp.optimizedExpectedProfit != null &&
    inp.optimizedProbabilityOfLoss != null;

  if (hasOptimization) {
    const optProfit = inp.optimizedExpectedProfit!;
    const optP = inp.optimizedProbabilityOfLoss!;
    if (optProfit >= 0 && optP < 60) {
      parts.push(
        `Optimization suggests a selling price of ${formatCurrency(inp.optimizedPrice!)} to maximize expected profit (${formatCurrency(optProfit)}, ${optP.toFixed(0)}% probability of loss). Consider this price to improve outcomes.`
      );
    } else {
      parts.push(
        "Even at the best price in the tested range, the scenario remains risky; consider improving costs or demand assumptions before launching."
      );
    }
  }

  if (parts.length === 0) {
    return "Run the simulation and review the analyst recommendation for a concise view of the scenario.";
  }
  return parts.join(" ");
}

export type StoryType = "baseCase" | "risk" | "recommendation";

export function buildAllStories(inp: StoryInputs): Record<StoryType, string> {
  return {
    baseCase: buildBaseCaseStory(inp),
    risk: buildRiskStory(inp),
    recommendation: buildRecommendationStory(inp),
  };
}
