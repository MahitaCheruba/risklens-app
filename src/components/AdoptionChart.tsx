"use client";

interface AdoptionChartProps {
  adoptionOverTime: number[];
  numCustomers: number;
  className?: string;
}

export function AdoptionChart({
  adoptionOverTime,
  numCustomers,
  className = "",
}: AdoptionChartProps) {
  if (adoptionOverTime.length === 0) return null;

  const maxVal = Math.max(...adoptionOverTime, numCustomers, 1);
  const height = 200;

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-slate-800 mb-2">
        Adoption over time
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Number of adopters at each step (word-of-mouth + churn)
      </p>
      <div
        className="w-full rounded-lg overflow-hidden bg-slate-50 border border-slate-200"
        style={{ height }}
      >
        <div className="flex items-end gap-px h-full p-2">
          {adoptionOverTime.map((val, i) => (
            <div
              key={i}
              className="flex-1 min-w-0 rounded-t bg-indigo-500/80 transition-opacity hover:opacity-90"
              style={{
                height: `${(val / maxVal) * 100}%`,
                minHeight: val > 0 ? "2px" : "0",
              }}
              title={`Step ${i}: ${val} adopters`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>Step 0</span>
        <span>Step {adoptionOverTime.length - 1}</span>
      </div>
    </div>
  );
}
