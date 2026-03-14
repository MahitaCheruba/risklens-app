/**
 * Business Viability Score: 0–100 summary from simulation outputs.
 * Uses existing results only; no Monte Carlo or optimization changes.
 */

export interface ViabilityInputs {
  expectedProfit: number;
  probabilityOfLoss: number;
  breakEvenDemand: number | null;
  /** Standard deviation of profit (volatility). */
  stdDev: number;
}

export interface ViabilityResult {
  /** 0–100 overall score. */
  score: number;
  /** Status label for display. */
  label: "Attractive" | "Moderate" | "Risky" | "Not recommended";
  /** Short interpretation for the scenario. */
  interpretation: string;
}

const WEIGHT_PROFIT = 0.4;
const WEIGHT_RISK = 0.3;
const WEIGHT_BREAKEVEN = 0.2;
const WEIGHT_VOLATILITY = 0.1;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Compute Business Viability Score from simulation outputs.
 * Factors: profit attractiveness (40%), risk level (30%), break-even feasibility (20%), volatility (10%).
 */
export function computeViabilityScore(inputs: ViabilityInputs): ViabilityResult {
  const { expectedProfit, probabilityOfLoss, breakEvenDemand, stdDev } = inputs;

  // Profit attractiveness (40%): higher expected profit = better. 0–100.
  const profitScore =
    expectedProfit < 0
      ? clamp(50 + expectedProfit / 2000, 0, 50)
      : clamp(50 + expectedProfit / 5000, 50, 100);

  // Risk level (30%): lower P(loss) = better. 0–100.
  const riskScore = clamp(100 - probabilityOfLoss, 0, 100);

  // Break-even feasibility (20%): achievable = 100, not achievable = 0.
  const breakEvenScore = breakEvenDemand != null ? 100 : 0;

  // Volatility (10%): lower stdDev = better. Scale relative to |mean| or fixed ref.
  const ref = Math.max(5000, Math.abs(expectedProfit) * 0.5);
  const volatilityScore = clamp(100 - (stdDev / ref) * 100, 0, 100);

  const raw =
    WEIGHT_PROFIT * profitScore +
    WEIGHT_RISK * riskScore +
    WEIGHT_BREAKEVEN * breakEvenScore +
    WEIGHT_VOLATILITY * volatilityScore;
  const score = Math.round(clamp(raw, 0, 100));

  let label: ViabilityResult["label"];
  if (score >= 80) label = "Attractive";
  else if (score >= 60) label = "Moderate";
  else if (score >= 40) label = "Risky";
  else label = "Not recommended";

  const interpretation =
    score >= 80
      ? "This scenario shows strong viability: expected profit is attractive, risk is contained, and break-even is achievable. Suitable for investment consideration."
      : score >= 60
        ? "The scenario is viable with moderate risk. Review sensitivity drivers and consider mitigation to improve the outlook."
        : score >= 40
          ? "Viability is limited by profit, risk, or break-even feasibility. Significant improvements or safeguards are recommended before proceeding."
          : "The scenario is not recommended under current assumptions. Consider revising inputs, reducing risk, or pausing until conditions improve.";

  return { score, label, interpretation };
}
