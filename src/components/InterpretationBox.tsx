"use client";

interface InterpretationBoxProps {
  mean: number;
  probabilityOfLoss: number;
  percentile5: number;
  percentile95: number;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function InterpretationBox({
  mean,
  probabilityOfLoss,
  percentile5,
  percentile95,
}: InterpretationBoxProps) {
  const pct = Math.round(probabilityOfLoss);
  let summary: string;

  if (pct >= 50) {
    summary = `There is a ${pct}% chance of losing money. The expected profit is ${mean >= 0 ? "positive" : "negative"} (${formatCurrency(mean)}), but downside risk is high. Consider reducing uncertainty or costs.`;
  } else if (pct >= 20) {
    summary = `There is a ${pct}% chance of losing money. While the expected profit is ${formatCurrency(mean)}, downside risk is meaningful. The 5th–95th percentile range (${formatCurrency(percentile5)} to ${formatCurrency(percentile95)}) shows substantial variability.`;
  } else if (pct > 0) {
    summary = `There is a ${pct}% chance of losing money. Expected profit is ${formatCurrency(mean)}. The 5th–95th percentile range (${formatCurrency(percentile5)} to ${formatCurrency(percentile95)}) indicates moderate variability.`;
  } else {
    summary = `In these simulations, profit was always positive. Expected profit is ${formatCurrency(mean)}. The 5th–95th percentile range (${formatCurrency(percentile5)} to ${formatCurrency(percentile95)}) shows the spread of outcomes.`;
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
      <h3 className="text-sm font-semibold text-indigo-900 mb-2">
        Plain-English interpretation
      </h3>
      <p className="text-slate-700">{summary}</p>
    </div>
  );
}
