"use client";

import Link from "next/link";

interface ScenarioCardProps {
  id: string;
  name: string;
  description: string;
  updatedAt: Date | string;
  expectedProfit?: number | null;
  probabilityOfLoss?: number | null;
  percentile5?: number | null;
  percentile95?: number | null;
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function ScenarioCard({
  id,
  name,
  description,
  updatedAt,
  expectedProfit,
  probabilityOfLoss,
  percentile5,
  percentile95,
}: ScenarioCardProps) {
  const hasMetrics =
    expectedProfit != null ||
    probabilityOfLoss != null ||
    (percentile5 != null && percentile95 != null);

  return (
    <Link
      href={`/scenarios/${id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-900">{name}</h3>
        {description && (
          <p className="text-sm text-slate-600 line-clamp-2">{description}</p>
        )}
        <p className="text-xs text-slate-400">Updated {formatDate(updatedAt)}</p>
        {hasMetrics && (
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {expectedProfit != null && (
              <span className="text-slate-700">
                Expected profit:{" "}
                <span
                  className={
                    expectedProfit >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {formatCurrency(expectedProfit)}
                </span>
              </span>
            )}
            {probabilityOfLoss != null && (
              <span className="text-slate-700">
                P(loss): {probabilityOfLoss.toFixed(1)}%
              </span>
            )}
            {percentile5 != null && percentile95 != null && (
              <span className="text-slate-700">
                5th–95th: {formatCurrency(percentile5)} –{" "}
                {formatCurrency(percentile95)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
