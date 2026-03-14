/**
 * Generates a print-friendly HTML report from scenario and simulation results.
 * Structured for 5 sections; use browser Print → Save as PDF for multi-page PDF.
 */

import type { SensitivityBar } from "./analytics";

export interface ReportScenario {
  name: string;
  description?: string | null;
  fixedCost: number;
  sellingPrice: number;
  demandDistributionType: string;
  demandMean?: number | null;
  demandStdDev?: number | null;
  demandMin?: number | null;
  demandMax?: number | null;
  demandMode?: number | null;
  variableCostDistributionType: string;
  variableCostMin?: number | null;
  variableCostMode?: number | null;
  variableCostMax?: number | null;
  numSimulations: number;
}

export interface ReportResult {
  mean: number;
  stdDev: number;
  percentile5: number;
  percentile95: number;
  probabilityOfLoss: number;
}

/** Optional data for histogram, optimization, etc. */
export interface ReportOptions {
  /** Simulated profit outcomes for histogram (Page 2). */
  profits?: number[];
  /** Optimization run result for Page 4. */
  optimization?: {
    best: { price: number; expectedProfit: number; probabilityOfLoss: number; probabilityOfProfit: number };
    topFive: Array<{ price: number; expectedProfit: number; probabilityOfLoss: number; probabilityOfProfit: number }>;
    allCandidates: Array<{ price: number; expectedProfit: number }>;
  };
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build histogram bins from profit array (same logic as ProfitHistogram). */
function buildHistogramBins(profits: number[], numBins: number): { bins: number[]; min: number; max: number } {
  if (profits.length === 0) return { bins: [], min: 0, max: 0 };
  const min = Math.min(...profits);
  const max = Math.max(...profits);
  const range = max - min || 1;
  const binWidth = range / numBins;
  const bins = new Array(numBins).fill(0).map((_, i) => {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    return profits.filter((p) => p >= lo && (i === numBins - 1 ? p <= hi : p < hi)).length;
  });
  return { bins, min, max };
}

/** Inline SVG for profit histogram (fixed width/height for print). */
function renderHistogramSvg(profits: number[], numBins: number): string {
  const { bins, min, max } = buildHistogramBins(profits, numBins);
  if (bins.length === 0) return "<p>No distribution data.</p>";
  const maxCount = Math.max(...bins, 1);
  const w = 600;
  const h = 220;
  const pad = { top: 20, right: 20, bottom: 36, left: 50 };
  const barW = (w - pad.left - pad.right) / bins.length;
  const chartH = h - pad.top - pad.bottom;
  const bars = bins
    .map((count, i) => {
      const x = pad.left + i * barW;
      const barHeight = (count / maxCount) * chartH;
      const y = pad.top + chartH - barHeight;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barW - 1).toFixed(1)}" height="${barHeight.toFixed(1)}" fill="#4f46e5" opacity="0.9"/>`;
    })
    .join("\n");
  const minLabel = formatCurrency(min);
  const maxLabel = formatCurrency(max);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:600px;height:auto;">
  ${bars}
  <text x="${pad.left}" y="${h - 8}" font-size="11" fill="#64748b">${escapeHtml(minLabel)}</text>
  <text x="${w - pad.right}" y="${h - 8}" font-size="11" fill="#64748b" text-anchor="end">${escapeHtml(maxLabel)}</text>
</svg>`;
}

/** Inline SVG for sensitivity (tornado) bars. */
function renderTornadoSvg(bars: SensitivityBar[]): string {
  if (bars.length === 0) return "<p>No sensitivity data.</p>";
  const allValues = bars.flatMap((b) => [b.lowCase, b.highCase]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const toPct = (v: number) => ((v - minVal) / range) * 100;
  const w = 600;
  const h = Math.min(400, 40 + bars.length * 36);
  const pad = { left: 120, right: 100, top: 16 };
  const barH = 28;
  const gap = 8;
  const rowHeight = barH + gap;
  const chartW = w - pad.left - pad.right;
  const segments = bars
    .map((bar, i) => {
      const lowPct = toPct(bar.lowCase);
      const highPct = toPct(bar.highCase);
      const x = pad.left + (Math.min(lowPct, highPct) / 100) * chartW;
      const width = (Math.abs(highPct - lowPct) / 100) * chartW;
      const y = pad.top + i * rowHeight;
      return `<rect x="${x.toFixed(0)}" y="${y}" width="${width.toFixed(0)}" height="${barH}" fill="#94a3b8" opacity="0.8"/>
  <text x="${pad.left - 8}" y="${y + barH / 2 + 4}" font-size="11" fill="#334155" text-anchor="end">${escapeHtml(bar.name)}</text>`;
    })
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:600px;height:auto;">
  ${segments}
  <text x="${pad.left}" y="${h - 4}" font-size="10" fill="#94a3b8">${escapeHtml(formatCurrency(minVal))}</text>
  <text x="${w - pad.right}" y="${h - 4}" font-size="10" fill="#94a3b8" text-anchor="end">${escapeHtml(formatCurrency(maxVal))}</text>
</svg>`;
}

/** Inline SVG for profit vs price (optimization chart). */
function renderProfitVsPriceSvg(
  allCandidates: Array<{ price: number; expectedProfit: number }>,
  bestPrice: number
): string {
  if (allCandidates.length === 0) return "<p>No optimization data.</p>";
  const prices = allCandidates.map((c) => c.price);
  const profits = allCandidates.map((c) => c.expectedProfit);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const minProf = Math.min(...profits);
  const maxProf = Math.max(...profits);
  const rangeP = maxP - minP || 1;
  const rangeProf = maxProf - minProf || 1;
  const w = 600;
  const h = 240;
  const pad = { top: 20, right: 50, bottom: 40, left: 60 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const toX = (p: number) => pad.left + ((p - minP) / rangeP) * chartW;
  const toY = (v: number) => pad.top + chartH - ((v - minProf) / rangeProf) * chartH;
  const pts = allCandidates.map((c) => `${toX(c.price).toFixed(1)},${toY(c.expectedProfit).toFixed(1)}`).join(" ");
  const bestX = toX(bestPrice);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:600px;height:auto;">
  <polyline points="${pts}" fill="none" stroke="#4f46e5" stroke-width="2"/>
  <line x1="${bestX.toFixed(1)}" y1="${pad.top}" x2="${bestX.toFixed(1)}" y2="${h - pad.bottom}" stroke="#dc2626" stroke-width="1" stroke-dasharray="4"/>
  <text x="${pad.left}" y="${h - 12}" font-size="10" fill="#64748b">${escapeHtml(formatCurrency(minP))}</text>
  <text x="${w - pad.right}" y="${h - 12}" font-size="10" fill="#64748b" text-anchor="end">${escapeHtml(formatCurrency(maxP))}</text>
</svg>`;
}

export function buildReportHtml(
  scenario: ReportScenario,
  result: ReportResult,
  breakEvenDemand: number | null,
  sensitivityBars: SensitivityBar[],
  recommendationLines: string[],
  options?: ReportOptions
): string {
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const breakEvenText =
    breakEvenDemand != null
      ? breakEvenDemand.toLocaleString() + " units"
      : "Not achievable";
  const probProfit = Math.max(0, 100 - result.probabilityOfLoss);
  const topDrivers = sensitivityBars.slice(0, 3).map((b) => b.name);

  const demandDesc =
    scenario.demandDistributionType === "normal"
      ? `Normal (μ=${scenario.demandMean ?? "—"}, σ=${scenario.demandStdDev ?? "—"})`
      : scenario.demandDistributionType === "triangular"
        ? `Triangular (min=${scenario.demandMin ?? "—"}, max=${scenario.demandMax ?? "—"})`
        : `Uniform (min=${scenario.demandMin ?? "—"}, max=${scenario.demandMax ?? "—"})`;

  const vcDesc =
    scenario.variableCostDistributionType === "fixed"
      ? `Fixed (${scenario.variableCostMode ?? scenario.variableCostMin ?? scenario.variableCostMax ?? "—"} per unit)`
      : scenario.variableCostDistributionType === "triangular"
        ? `Triangular (min=${scenario.variableCostMin ?? "—"}, max=${scenario.variableCostMax ?? "—"})`
        : `Uniform (min=${scenario.variableCostMin ?? "—"}, max=${scenario.variableCostMax ?? "—"})`;

  const execInsight =
    result.mean >= 0 && result.probabilityOfLoss < 30
      ? "The scenario presents a favorable outlook: expected profit is positive and downside risk is moderate. The risk range indicates the spread of outcomes to plan for."
      : result.mean < 0 || result.probabilityOfLoss > 50
        ? "This scenario carries meaningful risk. Expected profit may be negative or the probability of loss is high. Consider mitigation or alternative assumptions."
        : "The scenario shows a moderate risk profile. Review sensitivity drivers and the recommendation before deciding.";

  const recParagraph =
    recommendationLines.length > 0 ? recommendationLines[0] : "Run sensitivity and review key drivers to form a recommendation.";

  const sensitivityRows = sensitivityBars
    .slice(0, 8)
    .map(
      (b) =>
        `    <tr><td>${escapeHtml(b.name)}</td><td class="num">${formatCurrency(b.lowCase)}</td><td class="num">${formatCurrency(b.highCase)}</td><td class="num">${formatCurrency(b.impact)}</td></tr>`
    )
    .join("\n");

  const recList = recommendationLines
    .map((line) => `    <li>${escapeHtml(line)}</li>`)
    .join("\n");

  const hasOptimization = options?.optimization;
  const opt = options?.optimization;
  const optTableRows =
    opt?.topFive
      .map(
        (row, i) =>
          `    <tr${i === 0 ? ' class="best"' : ""}><td>${formatCurrency(row.price)}</td><td class="num">${formatCurrency(row.expectedProfit)}</td><td class="num">${row.probabilityOfLoss.toFixed(1)}%</td><td class="num">${row.probabilityOfProfit.toFixed(1)}%</td></tr>`
      )
      .join("\n") ?? "";

  const pageClass = ' class="page"';
  const histogramSvg =
    options?.profits && options.profits.length > 0
      ? renderHistogramSvg(options.profits, 30)
      : "<p>Profit distribution data not included in this report. Run the simulation and download again to include the histogram.</p>";
  const tornadoSvg = sensitivityBars.length > 0 ? renderTornadoSvg(sensitivityBars.slice(0, 8)) : "<p>No sensitivity data.</p>";
  const profitVsPriceSvg =
    hasOptimization && opt && opt.allCandidates.length > 0
      ? renderProfitVsPriceSvg(opt.allCandidates, opt.best.price)
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>RiskLens Report – ${escapeHtml(scenario.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", system-ui, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.5; font-size: 14px; }
    .page { page-break-after: always; }
    .page:last-of-type { page-break-after: auto; }
    h1 { font-size: 1.5rem; font-weight: 600; color: #0f172a; border-bottom: 2px solid #334155; padding-bottom: 8px; margin-bottom: 4px; }
    h2 { font-size: 1.15rem; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
    .meta { font-size: 0.8rem; color: #64748b; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.9rem; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; color: #475569; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    tr.best { background: #eef2ff; font-weight: 600; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin: 4px 0; }
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
    .kpi-box { border: 1px solid #e2e8f0; padding: 12px; background: #f8fafc; border-radius: 6px; }
    .kpi-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
    .kpi-value { font-size: 1.1rem; font-weight: 600; margin-top: 4px; }
    .positive { color: #059669; }
    .negative { color: #dc2626; }
    .insight { background: #f1f5f9; padding: 14px; border-radius: 6px; margin: 12px 0; font-size: 0.95rem; }
    .chart-wrap { margin: 16px 0; }
    @media print {
      body { margin: 1cm; padding: 0; max-width: none; }
      .page { page-break-after: always; }
      .page:last-of-type { page-break-after: auto; }
    }
  </style>
</head>
<body>
  <h1>RiskLens Report</h1>
  <p class="meta">${escapeHtml(scenario.name)}${scenario.description ? " · " + escapeHtml(scenario.description) : ""} · ${date}</p>

  <section${pageClass}>
    <h2>Page 1 — Executive Summary</h2>
    <h3 style="font-size: 0.95rem; color: #475569; margin-bottom: 8px;">Scenario overview</h3>
    <table>
      <tr><th>Parameter</th><th>Value</th></tr>
      <tr><td>Fixed cost</td><td class="num">${formatCurrency(scenario.fixedCost)}</td></tr>
      <tr><td>Selling price</td><td class="num">${formatCurrency(scenario.sellingPrice)}</td></tr>
      <tr><td>Demand distribution</td><td>${escapeHtml(demandDesc)}</td></tr>
      <tr><td>Variable cost</td><td>${escapeHtml(vcDesc)}</td></tr>
      <tr><td>Simulations</td><td class="num">${scenario.numSimulations.toLocaleString()}</td></tr>
    </table>
    <h3 style="font-size: 0.95rem; color: #475569; margin: 16px 0 8px;">Key metrics</h3>
    <div class="kpi-grid">
      <div class="kpi-box"><div class="kpi-label">Expected profit</div><div class="kpi-value ${result.mean >= 0 ? "positive" : "negative"}">${formatCurrency(result.mean)}</div></div>
      <div class="kpi-box"><div class="kpi-label">Probability of loss</div><div class="kpi-value">${result.probabilityOfLoss.toFixed(1)}%</div></div>
      <div class="kpi-box"><div class="kpi-label">Probability of profit</div><div class="kpi-value positive">${probProfit.toFixed(1)}%</div></div>
      <div class="kpi-box"><div class="kpi-label">Break-even demand</div><div class="kpi-value">${breakEvenText}</div></div>
      <div class="kpi-box" style="grid-column: span 2;"><div class="kpi-label">Risk range (5th–95th percentile)</div><div class="kpi-value">${formatCurrency(result.percentile5)} – ${formatCurrency(result.percentile95)}</div></div>
    </div>
    <h3 style="font-size: 0.95rem; color: #475569; margin: 16px 0 8px;">Executive insight</h3>
    <p class="insight">${escapeHtml(execInsight)}</p>
    <h3 style="font-size: 0.95rem; color: #475569; margin: 16px 0 8px;">Recommendation</h3>
    <p>${escapeHtml(recParagraph)}</p>
  </section>

  <section${pageClass}>
    <h2>Page 2 — Profit Risk Distribution</h2>
    <div class="chart-wrap">${histogramSvg}</div>
    <p style="font-size: 0.9rem; color: #475569;">Distribution of simulated profit outcomes. The shape shows the range of plausible results; a wide spread indicates higher uncertainty. Outcomes below zero represent loss scenarios.</p>
  </section>

  <section${pageClass}>
    <h2>Page 3 — Sensitivity Analysis</h2>
    <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 12px;">Inputs that most affect profitability when varied ±10% (others held constant). Wider bars indicate greater impact.</p>
    <div class="chart-wrap">${tornadoSvg}</div>
    <table>
      <tr><th>Input</th><th class="num">−10%</th><th class="num">+10%</th><th class="num">Impact</th></tr>
${sensitivityRows}
    </table>
    <p style="font-size: 0.9rem; color: #475569; margin-top: 12px;">${topDrivers.length > 0 ? `Top risk drivers: ${topDrivers.join(", ")}. Focus on these for scenario planning.` : "Vary inputs in the app to explore further."}</p>
  </section>

  <section${pageClass}>
    <h2>Page 4 — Optimization Results</h2>
    ${hasOptimization && opt ? `
    <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 12px;">Best selling price in the tested range and key metrics at that price.</p>
    <div class="kpi-grid">
      <div class="kpi-box"><div class="kpi-label">Recommended price</div><div class="kpi-value">${formatCurrency(opt.best.price)}</div></div>
      <div class="kpi-box"><div class="kpi-label">Expected profit at optimal price</div><div class="kpi-value ${opt.best.expectedProfit >= 0 ? "positive" : "negative"}">${formatCurrency(opt.best.expectedProfit)}</div></div>
      <div class="kpi-box"><div class="kpi-label">Probability of loss</div><div class="kpi-value">${opt.best.probabilityOfLoss.toFixed(1)}%</div></div>
    </div>
    <h3 style="font-size: 0.9rem; color: #475569; margin: 16px 0 8px;">Profit vs price</h3>
    <div class="chart-wrap">${profitVsPriceSvg}</div>
    <h3 style="font-size: 0.9rem; color: #475569; margin: 16px 0 8px;">Top 5 price options</h3>
    <table>
      <tr><th>Price</th><th class="num">Expected profit</th><th class="num">P(loss)</th><th class="num">P(profit)</th></tr>
${optTableRows}
    </table>
    ` : "<p>Optimization was not run for this scenario. Run optimization in the app and download the report again to include this section.</p>"}
  </section>

  <section${pageClass}>
    <h2>Page 5 — Strategic Insights</h2>
    <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 12px;">Key takeaways for decision-making.</p>
    <ul>
${recList}
    </ul>
  </section>

  <p style="margin-top: 24px; font-size: 0.75rem; color: #94a3b8;">Generated by RiskLens. To save as PDF: File → Print → Save as PDF (or choose “Save as PDF” as the printer).</p>
</body>
</html>`;
}
