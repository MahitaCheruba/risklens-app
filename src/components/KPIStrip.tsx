"use client";

interface KPIStripProps {
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

export function KPIStrip({
  mean,
  stdDev,
  percentile5,
  percentile95,
  probabilityOfLoss,
  breakEvenDemand,
}: KPIStripProps) {
  const labelClass = "text-[11px] font-medium uppercase tracking-wider text-slate-500";
  const itemClass =
    "rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div className={itemClass}>
        <p className={labelClass}>Expected profit</p>
        <p
          className={`mt-1 text-lg font-semibold tabular-nums ${
            mean >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {formatCurrency(mean)}
        </p>
      </div>
      <div className={itemClass}>
        <p className={labelClass}>Probability of loss</p>
        <p
          className={`mt-1 text-lg font-semibold tabular-nums ${
            probabilityOfLoss > 50 ? "text-rose-600" : "text-slate-900"
          }`}
        >
          {probabilityOfLoss.toFixed(1)}%
        </p>
      </div>
      <div className={itemClass}>
        <p className={labelClass}>Break-even demand</p>
        <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
          {breakEvenDemand != null
            ? `${breakEvenDemand.toLocaleString()} units`
            : "—"}
        </p>
      </div>
      <div className={itemClass}>
        <p className={labelClass}>5th – 95th percentile</p>
        <p className="mt-1 text-base font-semibold tabular-nums text-slate-900">
          {formatCurrency(percentile5)} – {formatCurrency(percentile95)}
        </p>
      </div>
      <div className={itemClass}>
        <p className={labelClass}>Std deviation</p>
        <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
          {formatCurrency(stdDev)}
        </p>
      </div>
    </div>
  );
}
