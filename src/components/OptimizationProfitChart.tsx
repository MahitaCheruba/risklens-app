"use client";

import type { PriceCandidateResult } from "@/lib/optimization";

interface OptimizationProfitChartProps {
  /** All candidates; will be sorted by price for x-axis. */
  candidates: PriceCandidateResult[];
  /** Price to highlight as the best. */
  bestPrice: number;
  className?: string;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function OptimizationProfitChart({
  candidates,
  bestPrice,
  className = "",
}: OptimizationProfitChartProps) {
  if (candidates.length === 0) return null;

  const byPrice = [...candidates].sort((a, b) => a.price - b.price);
  const profits = byPrice.map((c) => c.expectedProfit);
  const minProfit = Math.min(...profits);
  const maxProfit = Math.max(...profits);
  const range = maxProfit - minProfit || 1;

  return (
    <div className={className}>
      <p className="text-xs text-slate-500 mb-3">
        Expected profit by selling price. Best price highlighted.
      </p>
      <div
        className="flex items-end gap-px h-44 w-full rounded-lg overflow-hidden bg-slate-50"
        style={{ minHeight: "11rem" }}
      >
        {byPrice.map((c, i) => {
          const pctHeight = range > 0 ? (c.expectedProfit - minProfit) / range : 0;
          const isBest = Math.abs(c.price - bestPrice) < 1e-6;
          return (
            <div
              key={i}
              className={`flex-1 min-w-0 rounded-t transition-opacity hover:opacity-90 ${
                isBest ? "bg-indigo-600" : "bg-slate-400/80"
              }`}
              style={{
                height: `${Math.max(0, pctHeight) * 100}%`,
                minHeight: pctHeight > 0 ? "4px" : "0",
              }}
              title={`${formatCurrency(c.price)}: ${formatCurrency(c.expectedProfit)}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>{formatCurrency(byPrice[0]?.price ?? 0)}</span>
        <span>{formatCurrency(byPrice[byPrice.length - 1]?.price ?? 0)}</span>
      </div>
      <p className="text-[10px] text-slate-400 mt-0.5">
        Price (x) · Expected profit (y)
      </p>
    </div>
  );
}
