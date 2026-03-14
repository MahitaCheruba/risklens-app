"use client";

export interface AutoDecisionEngineCardProps {
  /** Current scenario selling price (baseline). */
  currentPrice: number;
  /** Baseline expected profit from main simulation. */
  baselineExpectedProfit: number;
  /** Baseline probability of loss (0–100). */
  baselineProbabilityOfLoss: number;
  /** Optimized selling price from optimization run. */
  recommendedPrice: number;
  /** Expected profit at recommended price. */
  optimizedExpectedProfit: number;
  /** Probability of loss at recommended price (0–100). */
  optimizedProbabilityOfLoss: number;
  /** First line of analyst recommendation (why). */
  whyLine: string | null;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function AutoDecisionEngineCard({
  currentPrice,
  baselineExpectedProfit,
  baselineProbabilityOfLoss,
  recommendedPrice,
  optimizedExpectedProfit,
  optimizedProbabilityOfLoss,
  whyLine,
}: AutoDecisionEngineCardProps) {
  const profitImprovement = optimizedExpectedProfit - baselineExpectedProfit;
  const probabilityOfLossChange =
    optimizedProbabilityOfLoss - baselineProbabilityOfLoss;

  const isUnattractive =
    optimizedExpectedProfit < 0 || optimizedProbabilityOfLoss >= 60;
  const recommendedAction = isUnattractive
    ? "Do not launch under current assumptions."
    : `Set selling price to ${formatCurrency(recommendedPrice)}.`;

  const priceChanged = Math.abs(recommendedPrice - currentPrice) > 0.01;

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
          Auto Decision Engine
        </h3>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">
            Recommended action
          </p>
          <p
            className={`text-lg font-semibold ${
              isUnattractive ? "text-amber-700" : "text-indigo-700"
            }`}
          >
            {recommendedAction}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">
            Baseline vs optimized strategy
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="pb-2 font-medium">Metric</th>
                <th className="pb-2 font-medium">Current</th>
                <th className="pb-2 font-medium">Recommended</th>
                <th className="pb-2 font-medium text-right">Change</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-t border-slate-200">
                <td className="py-1.5">Selling price</td>
                <td className="py-1.5 tabular-nums">
                  {formatCurrency(currentPrice)}
                </td>
                <td className="py-1.5 tabular-nums font-medium">
                  {formatCurrency(recommendedPrice)}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {priceChanged
                    ? recommendedPrice > currentPrice
                      ? "+"
                      : ""
                    : "—"}
                  {priceChanged
                    ? formatCurrency(recommendedPrice - currentPrice)
                    : "No change"}
                </td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="py-1.5">Expected profit</td>
                <td className="py-1.5 tabular-nums">
                  {formatCurrency(baselineExpectedProfit)}
                </td>
                <td className="py-1.5 tabular-nums font-medium">
                  {formatCurrency(optimizedExpectedProfit)}
                </td>
                <td
                  className={`py-1.5 text-right tabular-nums font-medium ${
                    profitImprovement >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {profitImprovement >= 0 ? "+" : ""}
                  {formatCurrency(profitImprovement)}
                </td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="py-1.5">Probability of loss</td>
                <td className="py-1.5 tabular-nums">
                  {baselineProbabilityOfLoss.toFixed(1)}%
                </td>
                <td className="py-1.5 tabular-nums font-medium">
                  {optimizedProbabilityOfLoss.toFixed(1)}%
                </td>
                <td
                  className={`py-1.5 text-right tabular-nums font-medium ${
                    probabilityOfLossChange <= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {probabilityOfLossChange <= 0 ? "" : "+"}
                  {probabilityOfLossChange.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">
            Why this recommendation
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            {isUnattractive
              ? "Even at the best price in the tested range, expected profit is negative or risk is too high. Improve assumptions (e.g. lower costs, higher demand) before launching."
              : "Within the tested range, this price maximizes expected profit. " +
                (whyLine ?? "See analyst recommendation below for full context.")}
          </p>
        </div>
      </div>
    </div>
  );
}
