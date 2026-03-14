"use client";

import type { SensitivityBar } from "@/lib/analytics";

interface TornadoChartProps {
  bars: SensitivityBar[];
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

export function TornadoChart({ bars, className = "" }: TornadoChartProps) {
  if (bars.length === 0) return null;

  const allValues = bars.flatMap((b) => [b.lowCase, b.highCase, b.baseline]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const toPct = (v: number) => ((v - minVal) / range) * 100;

  return (
    <div className={className}>
      <p className="text-xs text-slate-500 mb-3">
        This shows which assumptions have the biggest impact on profit. Each
        bar: −10% (left) and +10% (right) change in that input; others held
        constant.
      </p>
      <div className="space-y-3">
        {bars.map((bar, i) => {
          const lowPct = toPct(bar.lowCase);
          const highPct = toPct(bar.highCase);
          const basePct = toPct(bar.baseline);
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-xs font-medium text-slate-600">
                {bar.name}
              </div>
              <div className="flex-1 h-8 relative bg-slate-100 rounded overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-slate-300 rounded-sm"
                  style={{
                    left: `${Math.min(lowPct, highPct)}%`,
                    width: `${Math.abs(highPct - lowPct)}%`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-700"
                  style={{ left: `${basePct}%` }}
                  title={`Baseline: ${formatCurrency(bar.baseline)}`}
                />
              </div>
              <div className="w-24 shrink-0 text-right text-xs text-slate-500">
                {formatCurrency(bar.lowCase)} – {formatCurrency(bar.highCase)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
