"use client";

import type { HeatmapMetric, RiskHeatmapResult } from "@/lib/riskHeatmap";

interface RiskHeatmapProps {
  data: RiskHeatmapResult;
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

/** Interpolate between two hex colors. t in [0,1]. */
function lerpColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export function RiskHeatmap({ data, className = "" }: RiskHeatmapProps) {
  const { values, xLabels, yLabels, metric } = data;
  const rows = values.length;
  const cols = values[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return null;

  const flat = values.flat();
  const minVal = Math.min(...flat);
  const maxVal = Math.max(...flat);
  const range = maxVal - minVal || 1;

  const isProfit = metric === "expectedProfit";
  const lowColor = isProfit ? "#dc2626" : "#16a34a";
  const highColor = isProfit ? "#16a34a" : "#dc2626";

  const getColor = (value: number) => {
    const t = (value - minVal) / range;
    return lerpColor(lowColor, highColor, t);
  };

  return (
    <div className={className}>
      <p className="text-xs text-slate-500 mb-3">
        {metric === "expectedProfit"
          ? "Green = higher expected profit; red = lower."
          : "Green = lower risk (P(loss)); red = higher risk."}
      </p>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-0">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-1 text-slate-500 font-medium w-16">
                  Demand mean ↓
                </th>
                {xLabels.map((x, j) => (
                  <th
                    key={j}
                    className="p-1 text-slate-600 font-medium whitespace-nowrap"
                  >
                    {formatCurrency(x)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {values.map((row, i) => (
                <tr key={i}>
                  <td className="p-1 text-slate-600 font-medium whitespace-nowrap">
                    {yLabels[i]?.toLocaleString() ?? ""}
                  </td>
                  {row.map((val, j) => (
                    <td
                      key={j}
                      className="p-1 min-w-[2.5rem] h-8 border border-white/30 rounded-sm"
                      style={{ backgroundColor: getColor(val) }}
                      title={`Price ${formatCurrency(xLabels[j]!)}, Demand mean ${yLabels[i]}: ${
                        metric === "expectedProfit"
                          ? formatCurrency(val)
                          : `${val.toFixed(1)}% P(loss)`
                      }`}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-slate-500">Legend:</span>
        <div
          className="h-3 flex-1 max-w-[120px] rounded"
          style={{
            background: `linear-gradient(to right, ${lowColor}, ${highColor})`,
          }}
        />
        <span className="text-[10px] text-slate-500">
          {metric === "expectedProfit"
            ? `${formatCurrency(minVal)} → ${formatCurrency(maxVal)}`
            : `${minVal.toFixed(0)}% → ${maxVal.toFixed(0)}%`}
        </span>
      </div>
    </div>
  );
}
