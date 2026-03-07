"use client";

interface RecommendationBoxProps {
  lines: string[];
}

export function RecommendationBox({ lines }: RecommendationBoxProps) {
  if (lines.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-3">
        Analyst recommendation
      </h3>
      <ul className="space-y-2 text-slate-700 text-[15px] leading-relaxed">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-slate-400 shrink-0">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
