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
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-900">{name}</h3>
        {description && (
          <p className="text-sm text-slate-600 line-clamp-2">{description}</p>
        )}
        <p className="text-xs text-slate-400">
          Updated {formatDate(updatedAt)}
        </p>
        {hasMetrics && (
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {expectedProfit != null && (
              <span className="text-slate-700">
                Expected:{" "}
                <span
                  className={
                    expectedProfit >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"
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
                5th–95th: {formatCurrency(percentile5)} – {formatCurrency(percentile95)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
