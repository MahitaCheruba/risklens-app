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
      <p className="text-sm font-medium text-slate-700 mb-2">Profit distribution</p>
      <div
        className="flex items-end gap-0.5 h-48 w-full"
        style={{ minHeight: "12rem" }}
      >
        {bins.map((count, i) => (
          <div
            key={i}
            className="flex-1 bg-indigo-500 rounded-t min-w-0 transition-opacity hover:opacity-80"
            style={{
              height: `${(count / maxCount) * 100}%`,
              minHeight: count > 0 ? "4px" : "0",
            }}
            title={`${(min + i * binWidth).toFixed(0)} – ${(min + (i + 1) * binWidth).toFixed(0)}: ${count} runs`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs text-slate-500">
        <span>${min.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span>${max.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>
    </div>
  );
}
