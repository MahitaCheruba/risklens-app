"use client";

interface MetricsSummaryProps {
  mean: number;
  stdDev: number;
  percentile5: number;
  percentile95: number;
  probabilityOfLoss: number;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function MetricsSummary({
  mean,
  stdDev,
  percentile5,
  percentile95,
  probabilityOfLoss,
}: MetricsSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">
          Expected profit
        </p>
        <p className={`text-xl font-semibold ${mean >= 0 ? "text-green-600" : "text-red-600"}`}>
          {formatCurrency(mean)}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">
          Std deviation
        </p>
        <p className="text-xl font-semibold text-slate-900">
          {formatCurrency(stdDev)}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">
          5th – 95th percentile
        </p>
        <p className="text-lg font-semibold text-slate-900">
          {formatCurrency(percentile5)} – {formatCurrency(percentile95)}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">
          Probability of loss
        </p>
        <p className="text-xl font-semibold text-slate-900">
          {probabilityOfLoss.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
