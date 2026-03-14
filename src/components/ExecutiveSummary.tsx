"use client";

export interface ExecutiveSummaryProps {
  scenarioName: string;
  expectedProfit: number;
  probabilityOfLoss: number;
  breakEvenDemand: number | null;
  percentile5: number;
  percentile95: number;
  stdDev: number;
  topSensitivityDrivers: string[];
  firstRecommendationLine: string | null;
}

/**
 * Narrative-only executive summary. Key metrics are shown once in the KPI strip;
 * this component provides outlook, risk drivers, and recommendation only.
 */
export function ExecutiveSummary({
  expectedProfit,
  probabilityOfLoss,
  breakEvenDemand,
  topSensitivityDrivers,
  firstRecommendationLine,
}: ExecutiveSummaryProps) {
  const isFavorable = expectedProfit >= 0 && probabilityOfLoss < 30;
  const isHighRisk = expectedProfit < 0 || probabilityOfLoss > 50;
  const outlook =
    isFavorable
      ? "This scenario presents a favorable outlook: expected profit is positive and probability of loss is relatively low."
      : isHighRisk
        ? "This scenario carries meaningful risk: either expected profit is negative or the probability of loss is high. Review key drivers and consider mitigation."
        : "This scenario shows a moderate risk profile. Review key drivers and the recommendation below before deciding.";

  return (
    <div className="space-y-6">
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Business outlook
        </h4>
        <p className="text-slate-700 text-[15px] leading-relaxed">
          {outlook}
        </p>
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Key risk drivers
        </h4>
        {topSensitivityDrivers.length > 0 ? (
          <ul className="space-y-1.5 text-slate-700 text-sm">
            {topSensitivityDrivers.map((name, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-slate-400 shrink-0">•</span>
                <span>{name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No sensitivity data yet.</p>
        )}
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Recommendation
        </h4>
        {firstRecommendationLine ? (
          <p className="text-slate-700 text-[15px] leading-relaxed">
            {firstRecommendationLine}
          </p>
        ) : (
          <p className="text-sm text-slate-500">No recommendation yet.</p>
        )}
      </section>
    </div>
  );
}
