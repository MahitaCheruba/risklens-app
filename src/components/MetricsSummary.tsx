"use client";

interface MetricsSummaryProps {
  mean: number;
  stdDev: number;
  percentile5: number;
  percentile95: number;
  probabilityOfLoss: number;
  breakEvenDemand: number | null;
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
  breakEvenDemand,
}: MetricsSummaryProps) {
  const probabilityOfProfit = Math.max(0, 100 - probabilityOfLoss);

  const kpiClass =
    "rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm";

  const labelClass = "text-[11px] font-medium uppercase tracking-wider text-slate-500";
  const valueClass = "mt-1 text-xl font-semibold tabular-nums text-slate-900";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <div className={kpiClass}>
        <p className={labelClass}>Expected profit</p>
        <p
          className={`${valueClass} ${mean >= 0 ? "text-emerald-600" : "text-rose-600"}`}
        >
          {formatCurrency(mean)}
        </p>
      </div>
      <div className={kpiClass}>
        <p className={labelClass}>Probability of loss</p>
        <p className={valueClass}>{probabilityOfLoss.toFixed(1)}%</p>
      </div>
      <div className={kpiClass}>
        <p className={labelClass}>Probability of profit</p>
        <p className={`${valueClass} ${probabilityOfProfit >= 50 ? "text-emerald-600" : "text-slate-900"}`}>
          {probabilityOfProfit.toFixed(1)}%
        </p>
      </div>
      <div className={kpiClass}>
        <p className={labelClass}>Break-even demand</p>
        <p className={valueClass}>
          {breakEvenDemand != null
            ? breakEvenDemand.toLocaleString()
            : "Not achievable"}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Minimum units to avoid loss
        </p>
      </div>
      <div className={kpiClass}>
        <p className={labelClass}>5th – 95th percentile</p>
        <p className="mt-1 text-base font-semibold tabular-nums text-slate-900">
          {formatCurrency(percentile5)} – {formatCurrency(percentile95)}
        </p>
      </div>
      <div className={kpiClass}>
        <p className={labelClass}>Std deviation</p>
        <p className={valueClass}>{formatCurrency(stdDev)}</p>
      </div>
    </div>
  );
}
