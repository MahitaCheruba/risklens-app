"use client";

interface AdoptionChartProps {
  /** Adopters count at each time step (including t=0). */
  adoptionOverTime: number[];
  /** Total customers (for rate display). */
  numCustomers: number;
  className?: string;
}

export function AdoptionChart({
  adoptionOverTime,
  numCustomers,
  className = "",
}: AdoptionChartProps) {
  if (adoptionOverTime.length === 0) return null;

  const maxAdopters = Math.max(...adoptionOverTime, 1);

  return (
    <div className={className}>
      <p className="text-xs text-slate-500 mb-3">
        Adopters over time (word-of-mouth and churn applied each step).
      </p>
      <div
        className="flex items-end gap-px h-44 w-full rounded-lg overflow-hidden bg-slate-50"
        style={{ minHeight: "11rem" }}
      >
        {adoptionOverTime.map((count, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 rounded-t bg-indigo-500/90 transition-opacity hover:opacity-90"
            style={{
              height: `${(count / maxAdopters) * 100}%`,
              minHeight: count > 0 ? "2px" : "0",
            }}
            title={`Step ${i}: ${count} adopters (${numCustomers > 0 ? ((count / numCustomers) * 100).toFixed(1) : 0}%)`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>Step 0</span>
        <span>Step {adoptionOverTime.length - 1}</span>
      </div>
    </div>
  );
}
