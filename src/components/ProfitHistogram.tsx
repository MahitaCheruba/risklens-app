"use client";

interface ProfitHistogramProps {
  profits: number[];
  numBins?: number;
  className?: string;
}

export function ProfitHistogram({
  profits,
  numBins = 30,
  className = "",
}: ProfitHistogramProps) {
  if (profits.length === 0) return null;

  const min = Math.min(...profits);
  const max = Math.max(...profits);
  const range = max - min || 1;
  const binWidth = range / numBins;
  const bins = new Array(numBins).fill(0).map((_, i) => {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    return profits.filter((p) => p >= lo && (i === numBins - 1 ? p <= hi : p < hi)).length;
  });
  const maxCount = Math.max(...bins, 1);

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Profit distribution
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Histogram of simulated profit outcomes across all runs
      </p>
      <div
        className="flex items-end gap-px h-52 w-full rounded-lg overflow-hidden bg-slate-50"
        style={{ minHeight: "13rem" }}
      >
        {bins.map((count, i) => (
          <div
            key={i}
            className="flex-1 rounded-t min-w-0 transition-opacity hover:opacity-90 bg-indigo-500/90"
            style={{
              height: `${(count / maxCount) * 100}%`,
              minHeight: count > 0 ? "4px" : "0",
            }}
            title={`${(min + i * binWidth).toFixed(0)} – ${(min + (i + 1) * binWidth).toFixed(0)}: ${count} runs`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>${min.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span>${max.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>
    </div>
  );
}
