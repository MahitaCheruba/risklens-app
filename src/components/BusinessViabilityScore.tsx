"use client";

import type { ViabilityResult } from "@/lib/viabilityScore";

interface BusinessViabilityScoreProps extends ViabilityResult {}

/** Gauge arc: 0–100 left to right; color zones red / yellow / green. */
function Gauge({ score }: { score: number }) {
  const w = 280;
  const h = 100;
  const strokeWidth = 14;
  const r = 80;
  const cx = w / 2;
  const cy = h - 10;
  // Arc from 180° (left) to 0° (right) = 0 to 100
  const startAngle = 180;
  const endAngle = 0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const angleToX = (angle: number) => cx + r * Math.cos(toRad(angle));
  const angleToY = (angle: number) => cy - r * Math.sin(toRad(angle));
  const describeArc = (aStart: number, aEnd: number) => {
    const x1 = angleToX(aStart);
    const y1 = angleToY(aStart);
    const x2 = angleToX(aEnd);
    const y2 = angleToY(aEnd);
    const large = aEnd - aStart <= 180 ? 0 : 1;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Zones: 0–40 red, 40–60 yellow, 60–80 moderate, 80–100 green (angles 180→0)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[280px] mx-auto" aria-hidden>
      <path
        d={describeArc(180, 108)}
        fill="none"
        stroke="#ef4444"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={describeArc(108, 72)}
        fill="none"
        stroke="#eab308"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={describeArc(72, 36)}
        fill="none"
        stroke="#84cc16"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={describeArc(36, 0)}
        fill="none"
        stroke="#22c55e"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={angleToX(180 - (score / 100) * 180)}
        y2={angleToY(180 - (score / 100) * 180)}
        stroke="#0f172a"
        strokeWidth={3}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

export function BusinessViabilityScore({
  score,
  label,
  interpretation,
}: BusinessViabilityScoreProps) {
  const labelColor =
    label === "Attractive"
      ? "text-emerald-600"
      : label === "Moderate"
        ? "text-amber-600"
        : label === "Risky"
          ? "text-amber-600"
          : "text-rose-600";

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="viability-heading"
    >
      <h2
        id="viability-heading"
        className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-4"
      >
        Business Viability Score
      </h2>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex flex-col items-center shrink-0">
          <Gauge score={score} />
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {score}
            <span className="text-lg font-normal text-slate-500">/100</span>
          </p>
          <p className={`mt-1 text-sm font-semibold ${labelColor}`}>{label}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            {interpretation}
          </p>
        </div>
      </div>
    </section>
  );
}
